import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM Notification ORDER BY createdAt DESC LIMIT 30`)
    .all();
  const unreadCount = (
    db.prepare(`SELECT COUNT(*) c FROM Notification WHERE read = 0`).get() as any
  ).c;
  res.json({ data: rows, unreadCount });
});

router.patch("/:id/read", requireAuth, (req, res) => {
  db.prepare(`UPDATE Notification SET read = 1 WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

router.patch("/read-all", requireAuth, (req, res) => {
  db.prepare(`UPDATE Notification SET read = 1 WHERE read = 0`).run();
  res.json({ success: true });
});

export default router;
