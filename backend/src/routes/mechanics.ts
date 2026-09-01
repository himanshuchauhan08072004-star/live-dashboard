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
  status: z.string().optional(),
  sortBy: z.enum(["name", "jobsCompleted", "rating"]).default("jobsCompleted"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/", requireAuth, (req, res, next) => {
  try {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, "Invalid query parameters");
    const { page, limit, search, status, sortBy, sortOrder } = parsed.data;

    const where: string[] = [];
    const params: any[] = [];
    if (search) {
      where.push(`name LIKE ?`);
      params.push(`%${search}%`);
    }
    if (status) {
      where.push(`status = ?`);
      params.push(status);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const total = (
      db.prepare(`SELECT COUNT(*) c FROM Mechanic ${whereSql}`).get(...params) as any
    ).c;

    const rows = db
      .prepare(
        `SELECT * FROM Mechanic ${whereSql} ORDER BY ${sortBy} ${sortOrder === "asc" ? "ASC" : "DESC"} LIMIT ? OFFSET ?`
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
    const mechanic = db.prepare(`SELECT * FROM Mechanic WHERE id = ?`).get(req.params.id);
    if (!mechanic) throw new ApiError(404, "Mechanic not found");

    const recentBookings = db
      .prepare(
        `SELECT b.id, b.code, b.status, b.amount, b.scheduledAt, c.name as customerName
         FROM Booking b JOIN Customer c ON c.id = b.customerId
         WHERE b.mechanicId = ? ORDER BY b.scheduledAt DESC LIMIT 20`
      )
      .all(req.params.id);

    res.json({ mechanic, recentBookings });
  } catch (err) {
    next(err);
  }
});

export default router;
