import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { db, initSchema } from "./db";
import { initSocket, emitEvent } from "./ws/socket";
import { errorHandler, notFoundHandler } from "./middleware/error";

import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import bookingsRoutes from "./routes/bookings";
import mechanicsRoutes from "./routes/mechanics";
import customersRoutes from "./routes/customers";
import analyticsRoutes from "./routes/analytics";
import notificationsRoutes from "./routes/notifications";

initSchema();

const app = express();
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/mechanics", mechanicsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = createServer(app);
initSocket(httpServer, CORS_ORIGIN);

// Lightweight live-activity simulator: periodically nudges a random
// active booking forward so the dashboard demonstrates real-time updates
// without requiring a second client to drive changes.
function simulateLiveActivity() {
  const candidates = db
    .prepare(
      `SELECT id, status, mechanicId, code FROM Booking
       WHERE status IN ('PENDING','ASSIGNED','ON_THE_WAY','IN_PROGRESS')
       ORDER BY RANDOM() LIMIT 1`
    )
    .get() as any;
  if (!candidates) return;

  const nextMap: Record<string, string> = {
    PENDING: "ASSIGNED",
    ASSIGNED: "ON_THE_WAY",
    ON_THE_WAY: "IN_PROGRESS",
    IN_PROGRESS: "COMPLETED",
  };
  const next = nextMap[candidates.status];
  if (!next) return;

  const now = new Date().toISOString();
  let mechanicId = candidates.mechanicId;
  if (!mechanicId) {
    const m = db.prepare(`SELECT id FROM Mechanic ORDER BY RANDOM() LIMIT 1`).get() as any;
    mechanicId = m?.id;
  }

  db.prepare(`UPDATE Booking SET status = ?, mechanicId = ?, updatedAt = ? WHERE id = ?`).run(
    next,
    mechanicId,
    now,
    candidates.id
  );
  db.prepare(
    `INSERT INTO BookingStatusHistory (id, bookingId, status, changedAt) VALUES (?, ?, ?, ?)`
  ).run(Math.random().toString(36).slice(2, 14), candidates.id, next, now);

  if (next === "COMPLETED" && mechanicId) {
    db.prepare(
      `UPDATE Mechanic SET jobsCompleted = jobsCompleted + 1, status = 'AVAILABLE' WHERE id = ?`
    ).run(mechanicId);
  }

  const updated = db.prepare(`SELECT * FROM Booking WHERE id = ?`).get(candidates.id);
  emitEvent("booking.status_changed", { booking: updated });

  const notifId = Math.random().toString(36).slice(2, 14);
  const msg =
    next === "COMPLETED"
      ? `Booking ${candidates.code} has been completed.`
      : `Booking ${candidates.code} is now ${next.replace(/_/g, " ").toLowerCase()}.`;
  db.prepare(
    `INSERT INTO Notification (id, message, read, bookingId, createdAt) VALUES (?, ?, 0, ?, ?)`
  ).run(notifId, msg, candidates.id, now);
  emitEvent("notification.created", { id: notifId, message: msg, createdAt: now });
}

setInterval(simulateLiveActivity, 12000);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`VSOD backend listening on port ${PORT}`);
});
