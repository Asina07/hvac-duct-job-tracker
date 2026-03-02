import { Response, Request } from "express";
import dbPool from "../config/db";

export const getJobs = async (req: Request, res: Response) => {
  try {
    //pagination parameters
    // page — which page number you want. Default is page 1
    const page = parseInt(req.query.page as string) || 1;
    // limit — how many jobs per page. Default is 10
    const limit = parseInt(req.query.limit as string) || 10;
    // offset — how many jobs to skip
    const offset = (page - 1) * limit;

    // Page 1 → offset = (1-1) * 10 = 0  → skip nothing, show jobs 1-10
    // Page 2 → offset = (2-1) * 10 = 10 → skip 10, show jobs 11-20
    // Page 3 → offset = (3-1) * 10 = 20 → skip 20, show jobs 21-30

    //     These read values from the URL. For example:///
    // /api/jobs?search=4691&status_id=2&material_id=3&project_id=5&from_date=2024-01-01&to_date=2024-12-31&page=2&limit=10
    // search=4691 → search term to filter job_number or project_name
    // status_id=2 → filter by status ID
    // material_id=3 → filter by material Id
    const search = (req.query.search as string) || "";
    const status_id = (req.query.status_id as string) || "";
    const material_id = (req.query.material_id as string) || "";
    const project_id = (req.query.project_id as string) || "";
    const from_date = (req.query.from_date as string) || "";
    const to_date = (req.query.to_date as string) || "";

    //sort_by parameter with validation against allowed columns to prevent SQL injection
    const allowedSortColumns = [
      "date_received",
      "job_number",
      "total_sqm",
      "created_at",
    ];

    const sort_by = allowedSortColumns.includes(req.query.sort_by as string)
      ? (req.query.sort_by as string)
      : "date_received";

    //start with empty array and push as needed
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramCount = 1;

    if (search) {
      conditions.push(
        `(jobs.job_number ILIKE $${paramCount} OR projects.name ILIKE $${paramCount})`,
      );
      values.push(`%${search}%`);
      paramCount++;
    }

    if (status_id) {
      conditions.push(`jobs.status_id = $${paramCount}`);
      values.push(status_id);
      paramCount++;
    }

    if (material_id) {
      conditions.push(`jobs.material_id = $${paramCount}`);
      values.push(material_id);
      paramCount++;
    }

    if (project_id) {
      conditions.push(`jobs.project_id = $${paramCount}`);
      values.push(project_id);
      paramCount++;
    }

    if (from_date) {
      conditions.push(`jobs.date_received >= $${paramCount}`);
      values.push(from_date);
      paramCount++;
    }

    if (to_date) {
      conditions.push(`jobs.date_received <= $${paramCount}`);
      values.push(to_date);
      paramCount++;
    }


    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    //to get total count for pagination
    const countResult = await dbPool.query(
      `SELECT COUNT(*) 
       FROM jobs
       LEFT JOIN projects ON jobs.project_id = projects.id
       LEFT JOIN materials ON jobs.material_id = materials.id
       ${whereClause}`,
      values,
    );

    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    const jobsResult = await dbPool.query(
      `SELECT jobs.*, 
        materials.name AS material_name, 
        projects.name AS project_name, 
        statuses.name AS status_name, 
        statuses.color AS status_color 
       FROM jobs
       LEFT JOIN materials ON jobs.material_id = materials.id
       LEFT JOIN projects ON jobs.project_id = projects.id
       LEFT JOIN statuses ON jobs.status_id = statuses.id
       ${whereClause}
       ORDER BY jobs.date_received DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset],
    );

    // Send back jobs AND pagination info
    res.json({
      jobs: jobsResult.rows,
      pagination: {
        total_jobs: totalItems,
        total_pages: totalPages,
        current_page: page,
        per_page: limit,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
      sorting: {
        sort_by: sort_by,
      },
    });
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
