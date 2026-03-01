import { Response, Request } from "express";
import dbPool from "../config/db";

export const getJobs = async (req: Request, res: Response) => {
  try {
    const result = await dbPool.query(
      "SELECT jobs.*, materials.name AS material_name, projects.name AS project_name, statuses.name AS status_name, statuses.color AS status_color FROM jobs LEFT JOIN materials ON jobs.material_id = materials.id LEFT JOIN projects ON jobs.project_id = projects.id LEFT JOIN statuses ON jobs.status_id = statuses.id ORDER BY jobs.date_received DESC",
    );
    res.json(result.rows);
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching jobs:", error.message);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  const jobId = req.params.id;
  try {
    const result = await dbPool.query(
      "SELECT jobs.*, materials.name AS material_name, projects.name AS project_name, statuses.name AS status_name, statuses.color AS status_color FROM jobs LEFT JOIN materials ON jobs.material_id = materials.id LEFT JOIN projects ON jobs.project_id = projects.id LEFT JOIN statuses ON jobs.status_id = statuses.id WHERE jobs.id = $1",
      [jobId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching job:", error.message);
    res.status(500).json({ error: "Failed to fetch job" });
  }
};

export const createJob = async (req: Request, res: Response) => {
  const {
    date_received,
    material_id,
    project_id,
    status_id,
    job_number,
    item,
    level,
    total_sqm,
    unit,
    date_to_production,
    total_delivered_sqm,
    notes,
  } = req.body;
  if (!date_received || !status_id || !job_number) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await dbPool.query(
      "INSERT INTO jobs (date_received, material_id, project_id, status_id, job_number,item,level,total_sqm,unit,date_to_production,notes,total_delivered_sqm) VALUES ($1, $2, $3, $4, $5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
      [
        date_received,
        material_id,
        project_id,
        status_id,
        job_number,
        item,
        level,
        total_sqm,
        unit,
        date_to_production,
        notes,
        total_delivered_sqm,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error creating job:", error.message);
    res.status(500).json({ error: "Failed to create job" });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const {
    date_received,
    job_number,
    item,
    material_id,
    project_id,
    level,
    total_sqm,
    unit,
    status_id,
    date_to_production,
    total_delivered_sqm,
    notes,
  } = req.body;

  try {
    const result = await dbPool.query(
      `UPDATE jobs SET 
        date_received = $1,
        job_number = $2,
        item = $3,
        material_id = $4,
        project_id = $5,
        level = $6,
        total_sqm = $7,
        unit = $8,
        status_id = $9,
        date_to_production = $10,
        total_delivered_sqm = $11,
        notes = $12,
        updated_at = NOW()
      WHERE id = $13 
      RETURNING *`,
      [
        date_received,
        job_number,
        item,
        material_id,
        project_id,
        level,
        total_sqm,
        unit,
        status_id,
        date_to_production,
        total_delivered_sqm,
        notes,
        jobId,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error updating job:", error.message);
    res.status(500).json({ error: "Failed to update job" });
  }
};

export const updateJobStatus = async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const { status_id } = req.body;

  if (!status_id) {
    res.status(400).json({ error: "Status ID is required" });
    return;
  }
  try {
    const result = await dbPool.query(
      "UPDATE jobs SET status_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status_id, jobId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    const error = err as Error;
    console.error("Error updating status:", error.message);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  const jobId = req.params.id;
  try {
    const result = await dbPool.query(
      "DELETE FROM jobs WHERE id = $1 RETURNING *",
      [jobId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    const error = err as Error;
    console.error("Error deleting job:", error.message);
    res.status(500).json({ error: "Failed to delete job" });
  }
};
