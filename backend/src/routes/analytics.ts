import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

const rangeSchema = z.object({
  range: z.enum(["7", "30", "90"]).default("30"),
});

router.get("/bookings", requireAuth, (req, res) => {
  const { range } = rangeSchema.parse(req.query);
  const days = Number(range);
  const rows = db
    .prepare(
      `SELECT substr(scheduledAt, 1, 10) as date, COUNT(*) as count
       FROM Booking
       WHERE scheduledAt >= datetime('now', ?)
       GROUP BY date ORDER BY date ASC`
    )
    .all(`-${days} days`);
  res.json({ range: days, data: rows });
});

router.get("/revenue", requireAuth, (req, res) => {
  const { range } = rangeSchema.parse(req.query);
  const days = Number(range);
  const rows = db
    .prepare(
      `SELECT substr(updatedAt, 1, 10) as date, COALESCE(SUM(amount),0) as revenue
       FROM Booking
       WHERE status = 'COMPLETED' AND updatedAt >= datetime('now', ?)
       GROUP BY date ORDER BY date ASC`
    )
    .all(`-${days} days`);
  res.json({ range: days, data: rows });
});

router.get("/status-breakdown", requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT status, COUNT(*) as count FROM Booking GROUP BY status`)
    .all();
  res.json({ data: rows });
});

router.get("/services", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT sc.name as category, COUNT(b.id) as bookings, COALESCE(SUM(CASE WHEN b.status='COMPLETED' THEN b.amount ELSE 0 END),0) as revenue
       FROM Booking b
       JOIN Service s ON s.id = b.serviceId
       JOIN ServiceCategory sc ON sc.id = s.categoryId
       GROUP BY sc.name
       ORDER BY bookings DESC`
    )
    .all();
  res.json({ data: rows });
});

export default router;
