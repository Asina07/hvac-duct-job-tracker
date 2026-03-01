import { Request, Response } from "express";
import dbPool from "./../config/db";

export const getStatuses = async (req: Request, res: Response) => {
    try {
        const result = await dbPool.query("SELECT * FROM statuses");
        res.json(result.rows);
    } catch (err) {
        const error = err as Error;
        console.error("Error fetching statuses:", error.message);
        res.status(500).json({ error: "Failed to fetch statuses" });
    }
};

export const createStatus = async (req: Request, res: Response) => {
    const { name ,color} = req.body;
    try {
        const result = await dbPool.query(
            "INSERT INTO statuses (name,color) VALUES ($1,$2) RETURNING *",
            [name,color],
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        const error = err as Error;
        console.error("Error creating status:", error.message);
        res.status(500).json({ error: "Failed to create status" });
    }   
};

