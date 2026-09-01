import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../middleware/error";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid email or password format");
    const { email, password } = parsed.data;

    const user = db.prepare(`SELECT * FROM User WHERE email = ?`).get(email) as any;
    if (!user) throw new ApiError(401, "Invalid credentials");

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid credentials");

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
