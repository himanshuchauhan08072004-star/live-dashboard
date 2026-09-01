import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const totalBookings = (db.prepare(`SELECT COUNT(*) c FROM Booking`).get() as any).c;
  const todaysBookings = (
    db.prepare(`SELECT COUNT(*) c FROM Booking WHERE scheduledAt >= ?`).get(todayIso) as any
  ).c;
  const completed = (
    db.prepare(`SELECT COUNT(*) c FROM Booking WHERE status = 'COMPLETED'`).get() as any
  ).c;
  const pending = (
    db.prepare(`SELECT COUNT(*) c FROM Booking WHERE status = 'PENDING'`).get() as any
  ).c;
  const cancelled = (
    db.prepare(`SELECT COUNT(*) c FROM Booking WHERE status = 'CANCELLED'`).get() as any
  ).c;
  const totalRevenue = (
    db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM Booking WHERE status = 'COMPLETED'`).get() as any
  ).s;

  // Revenue trend: this period (last 30d) vs previous 30d
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
  const d60 = new Date(now.getTime() - 60 * 86400000).toISOString();
  const revLast30 = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount),0) s FROM Booking WHERE status = 'COMPLETED' AND updatedAt >= ?`
      )
      .get(d30) as any
  ).s;
  const revPrev30 = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount),0) s FROM Booking WHERE status = 'COMPLETED' AND updatedAt >= ? AND updatedAt < ?`
      )
      .get(d60, d30) as any
  ).s;
  const revenueTrendPct =
    revPrev30 > 0 ? Math.round(((revLast30 - revPrev30) / revPrev30) * 1000) / 10 : 0;

  const activeMechanics = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM Mechanic WHERE status IN ('AVAILABLE','ASSIGNED','ON_THE_WAY','BUSY')`
      )
      .get() as any
  ).c;

  const newCustomers30d = (
    db.prepare(`SELECT COUNT(*) c FROM Customer WHERE customerSince >= ?`).get(d30) as any
  ).c;

  const liveOps = db
    .prepare(
      `SELECT b.id, b.code, b.status, b.scheduledAt, b.updatedAt, c.name as customerName,
              m.name as mechanicName, s.name as serviceName
       FROM Booking b
       JOIN Customer c ON c.id = b.customerId
       LEFT JOIN Mechanic m ON m.id = b.mechanicId
       JOIN Service s ON s.id = b.serviceId
       WHERE b.status IN ('PENDING','ASSIGNED','ON_THE_WAY','IN_PROGRESS')
       ORDER BY b.updatedAt DESC
       LIMIT 15`
    )
    .all();

  const recentlyCompleted = db
    .prepare(
      `SELECT b.id, b.code, b.updatedAt, c.name as customerName, m.name as mechanicName
       FROM Booking b
       JOIN Customer c ON c.id = b.customerId
       LEFT JOIN Mechanic m ON m.id = b.mechanicId
       WHERE b.status = 'COMPLETED'
       ORDER BY b.updatedAt DESC
       LIMIT 8`
    )
    .all();

  res.json({
    kpis: {
      totalBookings,
      todaysBookings,
      completedBookings: completed,
      pendingBookings: pending,
      cancelledBookings: cancelled,
      totalRevenue,
      revenueTrendPct,
      activeMechanics,
      newCustomers30d,
    },
    liveOps,
    recentlyCompleted,
  });
});

export default router;
