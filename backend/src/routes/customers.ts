import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../middleware/error";

const router = Router();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["name", "totalSpent", "totalBookings", "customerSince"]).default("totalSpent"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", requireAuth, (req, res, next) => {
  try {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, "Invalid query parameters");
    const { page, limit, search, sortBy, sortOrder } = parsed.data;

    const where: string[] = [];
    const params: any[] = [];
    if (search) {
      where.push(`(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const baseFrom = `
      FROM Customer c
      LEFT JOIN Booking b ON b.customerId = c.id
      ${whereSql}
    `;

    const total = (
      db.prepare(`SELECT COUNT(DISTINCT c.id) cnt ${baseFrom}`).get(...params) as any
    ).cnt;

    const sortCol =
      sortBy === "totalSpent"
        ? "totalSpent"
        : sortBy === "totalBookings"
        ? "totalBookings"
        : sortBy === "customerSince"
        ? "c.customerSince"
        : "c.name";

    const rows = db
      .prepare(
        `SELECT c.id, c.name, c.email, c.phone, c.customerSince,
                COUNT(b.id) as totalBookings,
                COALESCE(SUM(CASE WHEN b.status = 'COMPLETED' THEN b.amount ELSE 0 END), 0) as totalSpent,
                MAX(b.scheduledAt) as lastBooking
         ${baseFrom}
         GROUP BY c.id
         ORDER BY ${sortCol} ${sortOrder === "asc" ? "ASC" : "DESC"}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    res.json({
      data: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, (req, res, next) => {
  try {
    const customer = db.prepare(`SELECT * FROM Customer WHERE id = ?`).get(req.params.id);
    if (!customer) throw new ApiError(404, "Customer not found");

    const bookings = db
      .prepare(
        `SELECT b.id, b.code, b.status, b.amount, b.scheduledAt, s.name as serviceName, v.model
         FROM Booking b JOIN Service s ON s.id = b.serviceId JOIN Vehicle v ON v.id = b.vehicleId
         WHERE b.customerId = ? ORDER BY b.scheduledAt DESC`
      )
      .all(req.params.id);

    const vehicles = db.prepare(`SELECT * FROM Vehicle WHERE customerId = ?`).all(req.params.id);

    const summary = db
      .prepare(
        `SELECT COUNT(*) totalBookings,
                COALESCE(SUM(CASE WHEN status='COMPLETED' THEN amount ELSE 0 END),0) totalSpent
         FROM Booking WHERE customerId = ?`
      )
      .get(req.params.id);

    res.json({ customer, vehicles, bookings, summary });
  } catch (err) {
    next(err);
  }
});

export default router;
