/**
 * Dashboard Controller
 * Handles all dashboard summary data for the HVAC Material Management System
 * Returns aggregated data including job counts, SQM totals,
 * material breakdown, status breakdown, delivery summary
 * and tag list waiting for approval
 *
 * All routes protected by JWT authentication middleware
 */

import { Request, Response } from "express";
import dbPool from "./../config/db";

export const getDashboardData = async (req: Request, res: Response) => {
  const user_id = req.user?.id; // Ensure the user can only access their own dashboard data
  // console.log("Fetching dashboard data for user_id:", user_id);
  try {
    // Get overall summary counts and totals from all jobs
    // COUNT(*) - counts every job row regardless of status
    // SUM(total_sqm) - adds up all square meters across all jobs
    // SUM(total_delivered_sqm) - adds up all delivered square meters
    const overAllResult = await dbPool.query(
      `
  SELECT 
    COUNT(*) AS total_jobs,
    SUM(original_sqm) AS total_sqm,
    SUM(total_delivered_sqm) AS total_delivered_sqm
  FROM jobs
  WHERE user_id = $1
`,
      [user_id],
    );

    // Get job count and total SQM grouped by each material type
    // LEFT JOIN - includes jobs even if material_id is null
    // GROUP BY materials.name - separates totals per material
    // Example result: GI DUCT FIRERATED = 45 jobs, 28530 SQM
    const byMaterialResult = await dbPool.query(
     "SELECT materials.name AS material, COUNT(*) AS total_jobs, SUM(jobs.original_sqm) AS total_sqm FROM jobs LEFT JOIN materials ON jobs.material_id = materials.id WHERE jobs.user_id = $1 GROUP BY materials.name ORDER BY materials.name",
      [user_id]
    );

    // Get job count and total SQM grouped by each status
    // Also fetches status color for frontend badge display
    // GROUP BY both name and color because we're selecting color too
    // Example result: IN PRODUCTION(orange) = 10 jobs, 3267 SQM
    const byStatusResult = await dbPool.query(
      "SELECT statuses.name AS status, statuses.color AS color, COUNT(*) AS total_jobs, SUM(jobs.original_sqm) AS total_sqm FROM jobs LEFT JOIN statuses ON jobs.status_id = statuses.id WHERE jobs.user_id = $1 GROUP BY statuses.name, statuses.color;",
      [user_id],
    );

    // Get delivery progress per material type
    // COALESCE(total_delivered_sqm, 0) - if delivered value is null, treat as 0
    // This prevents null errors in subtraction calculation
    // pending_sqm = total ordered minus what has been delivered so far
    // Helps husband see at a glance how much of each material is still pending
    const deliverySummaryResult = await dbPool.query(`
  SELECT 
  materials.name AS material,
  SUM(jobs.original_sqm) AS total_sqm,
  SUM(jobs.total_delivered_sqm) AS delivered_sqm,
  SUM(jobs.original_sqm) - COALESCE(SUM(jobs.total_delivered_sqm), 0) AS pending_sqm
FROM jobs
LEFT JOIN materials ON jobs.material_id = materials.id
WHERE jobs.user_id = $1
GROUP BY materials.name
ORDER BY materials.name
`,[user_id]);

    // Get all jobs where status is 'TAG LIST SEND FOR APPROVAL'
    // These are jobs waiting for customer approval before production starts
    // Ordered by date_received ASC - oldest waiting jobs appear first
    // This helps husband prioritize which approvals to follow up on
    // COALESCE not needed here as we only need job details not calculations
    const tagListWaitingResult = await dbPool.query(`
  SELECT 
    jobs.id,
    jobs.job_number,
    jobs.level,
    jobs.total_sqm,
    jobs.date_received,
    projects.name AS project_name,
    materials.name AS material_name
  FROM jobs
  LEFT JOIN projects ON jobs.project_id = projects.id
  LEFT JOIN materials ON jobs.material_id = materials.id
  LEFT JOIN statuses ON jobs.status_id = statuses.id
  WHERE statuses.name = 'TAG LIST SEND FOR APPROVAL' AND jobs.user_id=$1
  ORDER BY jobs.date_received ASC
`,[user_id]);

//to get detailes of each category by material
const materialStatusResult = await dbPool.query(`
  SELECT 
    materials.name AS material,
    statuses.name AS status,
    statuses.color AS color,
    COUNT(*) AS total_jobs,
    SUM(jobs.original_sqm) AS total_sqm
  FROM jobs
  LEFT JOIN materials ON jobs.material_id = materials.id
  LEFT JOIN statuses ON jobs.status_id = statuses.id
  WHERE jobs.user_id = $1
  GROUP BY materials.name, statuses.name, statuses.color
  ORDER BY materials.name, statuses.name
`, [user_id]);

    res.json({
      overall: overAllResult.rows[0],
      by_material: byMaterialResult.rows,
      by_status: byStatusResult.rows,
      delivery_summary: deliverySummaryResult.rows,
      tag_list_waiting: tagListWaitingResult.rows,
       material_status_breakdown: materialStatusResult.rows,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching dashboard data:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
