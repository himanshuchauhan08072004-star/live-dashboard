import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { emitEvent } from "../ws/socket";

const router = Router();

const VALID_SORT_FIELDS: Record<string, string> = {
  date: "b.scheduledAt",
  amount: "b.amount",
  status: "b.status",
  customer: "c.name",
};

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  serviceId: z.string().optional(),
  mechanicId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sortBy: z.enum(["date", "amount", "status", "customer"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", requireAuth, (req, res, next) => {
  try {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, "Invalid query parameters");
    const { page, limit, search, status, serviceId, mechanicId, from, to, sortBy, sortOrder } =
      parsed.data;

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      where.push(
        `(b.code LIKE ? OR c.name LIKE ? OR v.regNumber LIKE ? OR m.name LIKE ? OR v.model LIKE ?)`
      );
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (status) {
      where.push(`b.status = ?`);
      params.push(status);
    }
    if (serviceId) {
      where.push(`b.serviceId = ?`);
      params.push(serviceId);
    }
    if (mechanicId) {
      where.push(`b.mechanicId = ?`);
      params.push(mechanicId);
    }
    if (from) {
      where.push(`b.scheduledAt >= ?`);
      params.push(from);
    }
    if (to) {
      where.push(`b.scheduledAt <= ?`);
      params.push(to);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderCol = VALID_SORT_FIELDS[sortBy];
    const orderSql = `ORDER BY ${orderCol} ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    const offset = (page - 1) * limit;

    const baseFrom = `
      FROM Booking b
      JOIN Customer c ON c.id = b.customerId
      JOIN Vehicle v ON v.id = b.vehicleId
      JOIN Service s ON s.id = b.serviceId
      LEFT JOIN Mechanic m ON m.id = b.mechanicId
      ${whereSql}
    `;

    const total = (db.prepare(`SELECT COUNT(*) c ${baseFrom}`).get(...params) as any).c;

    const rows = db
      .prepare(
        `SELECT b.id, b.code, b.status, b.amount, b.scheduledAt, b.address,
                c.name as customerName, v.make, v.model, v.regNumber,
                s.name as serviceName, m.name as mechanicName, m.id as mechanicId
         ${baseFrom}
         ${orderSql}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, (req, res, next) => {
  try {
    const booking = db
      .prepare(
        `SELECT b.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail,
                v.make, v.model, v.regNumber,
                s.name as serviceName, s.id as categoryServiceId,
                m.name as mechanicName, m.phone as mechanicPhone, m.id as mechanicId
         FROM Booking b
         JOIN Customer c ON c.id = b.customerId
         JOIN Vehicle v ON v.id = b.vehicleId
         JOIN Service s ON s.id = b.serviceId
         LEFT JOIN Mechanic m ON m.id = b.mechanicId
         WHERE b.id = ?`
      )
      .get(req.params.id);

    if (!booking) throw new ApiError(404, "Booking not found");

    const history = db
      .prepare(
        `SELECT status, changedAt, note FROM BookingStatusHistory WHERE bookingId = ? ORDER BY changedAt ASC`
      )
      .all(req.params.id);

    res.json({ booking, history });
  } catch (err) {
    next(err);
  }
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ON_THE_WAY", "CANCELLED"],
  ON_THE_WAY: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  mechanicId: z.string().optional(),
  note: z.string().optional(),
});

router.patch("/:id/status", requireAuth, (req, res, next) => {
  try {
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid status update payload");
    const { status: newStatus, mechanicId, note } = parsed.data;

    const booking = db.prepare(`SELECT * FROM Booking WHERE id = ?`).get(req.params.id) as any;
    if (!booking) throw new ApiError(404, "Booking not found");

    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(
        400,
        `Invalid status transition from ${booking.status} to ${newStatus}`
      );
    }

    const now = new Date().toISOString();
    const finalMechanicId = mechanicId || booking.mechanicId;

    db.prepare(
      `UPDATE Booking SET status = ?, mechanicId = ?, updatedAt = ? WHERE id = ?`
    ).run(newStatus, finalMechanicId, now, req.params.id);

    db.prepare(
      `INSERT INTO BookingStatusHistory (id, bookingId, status, changedAt, note) VALUES (?, ?, ?, ?, ?)`
    ).run(nanoid(12), req.params.id, newStatus, now, note || null);

    if (newStatus === "COMPLETED" && finalMechanicId) {
      db.prepare(`UPDATE Mechanic SET jobsCompleted = jobsCompleted + 1, status = 'AVAILABLE' WHERE id = ?`).run(
        finalMechanicId
      );
    }
    if (newStatus === "ASSIGNED" && finalMechanicId) {
      db.prepare(`UPDATE Mechanic SET status = 'ASSIGNED' WHERE id = ?`).run(finalMechanicId);
    }
    if (newStatus === "ON_THE_WAY" && finalMechanicId) {
      db.prepare(`UPDATE Mechanic SET status = 'ON_THE_WAY' WHERE id = ?`).run(finalMechanicId);
    }
    if (newStatus === "IN_PROGRESS" && finalMechanicId) {
      db.prepare(`UPDATE Mechanic SET status = 'BUSY' WHERE id = ?`).run(finalMechanicId);
    }

    const notifMsg =
      newStatus === "ASSIGNED"
        ? `Booking ${booking.code} has been assigned to a mechanic.`
        : newStatus === "ON_THE_WAY"
        ? `Mechanic is now on the way for booking ${booking.code}.`
        : newStatus === "IN_PROGRESS"
        ? `Booking ${booking.code} is now in progress.`
        : newStatus === "COMPLETED"
        ? `Booking ${booking.code} has been completed.`
        : `Booking ${booking.code} was cancelled.`;
    const notifId = nanoid(12);
    db.prepare(
      `INSERT INTO Notification (id, message, read, bookingId, createdAt) VALUES (?, ?, 0, ?, ?)`
    ).run(notifId, notifMsg, req.params.id, now);

    const updated = db.prepare(`SELECT * FROM Booking WHERE id = ?`).get(req.params.id);
    emitEvent("booking.status_changed", { booking: updated });
    emitEvent("notification.created", { id: notifId, message: notifMsg, createdAt: now });

    res.json({ booking: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
