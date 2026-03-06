import { Request, Response } from "express";
import dbPool from "./../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// INSERT INTO users (email, password, name)
// -- VALUES ('demo@hvactracker.com', 'abcd@1234', 'Demo User')

export const login = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  if (!password) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  try {
    const result = await dbPool.query(
      "SELECT * FROM users WHERE email = $1 AND name = $2",
      [email, name],
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }
    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    const error = err as Error;
    console.error("Error during login:", error.message);
    res.status(500).json({ error: "Failed to login" });
  }
};
