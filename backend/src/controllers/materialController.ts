import { Request, Response } from "express";
import dbPool from "./../config/db";

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const result = await dbPool.query("SELECT * FROM materials");
    res.json(result.rows);
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching materials:", error.message);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await dbPool.query(
      "INSERT INTO materials (name) VALUES ($1) RETURNING *",
      [name],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error creating material:", error.message);
    res.status(500).json({ error: "Failed to create material" });
  }
};
