import { Response, Request } from "express";
import dbPool from "../config/db";
import ExcelJS from "exceljs";
import multer from "multer";
import * as XLSX from "xlsx";

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

    // Always filter by user_id to ensure users only see their own jobs
    conditions.push(`jobs.user_id = $${paramCount}`);
    values.push(req.user?.id as number);
    paramCount++;

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
  const user_id = req.user?.id; // Ensure the user can only access their own jobs
  try {
    const result = await dbPool.query(
      "SELECT jobs.*, materials.name AS material_name, projects.name AS project_name, statuses.name AS status_name, statuses.color AS status_color FROM jobs LEFT JOIN materials ON jobs.material_id = materials.id LEFT JOIN projects ON jobs.project_id = projects.id LEFT JOIN statuses ON jobs.status_id = statuses.id WHERE jobs.id = $1 AND jobs.user_id = $2",
      [jobId, user_id],
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
  const user_id = req.user?.id; // Assuming you have user authentication and req.user is populated
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
  const original_sqm = total_sqm;

  // Get status name to check if DELIVERED
  const statusResult = await dbPool.query(
    "SELECT name FROM statuses WHERE id = $1",
    [status_id],
  );
  const statusName = statusResult.rows[0]?.name;

  // If DELIVERED set total_delivered_sqm = total_sqm, total_sqm = 0
  let final_total_sqm = total_sqm;
  let final_delivered_sqm = total_delivered_sqm || 0;

  if (statusName === "DELIVERED") {
    final_total_sqm = 0;
    final_delivered_sqm = total_sqm;
  }
  if (!date_received || !status_id || !job_number) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await dbPool.query(
      "INSERT INTO jobs (date_received, material_id, project_id, status_id, job_number,item,level,total_sqm,original_sqm,unit,date_to_production,notes,total_delivered_sqm,user_id) VALUES ($1, $2, $3, $4, $5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *",
      [
        date_received,
        material_id,
        project_id,
        status_id,
        job_number,
        item,
        level,
        final_total_sqm,
        original_sqm,
        unit,
        date_to_production,
        notes,
        final_delivered_sqm,
        user_id,
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
  const user_id = req.user?.id;
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
    notes,
  } = req.body;

  try {
    const statusResult = await dbPool.query(
      "SELECT name FROM statuses WHERE id = $1",
      [status_id],
    );
    const statusName = statusResult.rows[0]?.name;

    // Auto set delivered sqm if DELIVERED
    const final_total_sqm = statusName === "DELIVERED" ? 0 : total_sqm;
    const final_delivered_sqm = statusName === "DELIVERED" ? total_sqm : null;

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
      WHERE id = $13 AND user_id = $14
      RETURNING *`,
      [
        date_received,
        job_number,
        item,
        material_id,
        project_id,
        level,
        final_total_sqm, // ← changed
        unit,
        status_id,
        date_to_production,
        final_delivered_sqm, // ← changed
        notes,
        jobId,
        user_id, // ← uncommented
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
  const { status_id, delivered_sqm } = req.body;
  const user_id = req.user?.id;

  try {
    const [statusResult] = await Promise.all([
      dbPool.query("SELECT name FROM statuses WHERE id = $1", [status_id]),
    ]);

    const statusName = statusResult.rows[0]?.name;

    let query = "";
    let values: any[] = [];

    if (statusName === "DELIVERED") {
      // Auto deliver everything — total_sqm becomes 0
      query = `
        UPDATE jobs 
        SET
          status_id = $1,
          total_delivered_sqm = original_sqm,
          total_sqm = 0,
          updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      values = [status_id, jobId, user_id];
    } else if (statusName === "PARTIALLY DELIVERED") {
      // delivered_sqm must be provided
      if (!delivered_sqm) {
        res.status(400).json({
          error: "delivered_sqm is required for PARTIALLY DELIVERED status",
        });
        return;
      }

      // Check cant deliver more than remaining
      const jobCheck = await dbPool.query(
        "SELECT total_sqm FROM jobs WHERE id = $1",
        [jobId],
      );
      const remainingSqm = parseFloat(jobCheck.rows[0]?.total_sqm);

      if (parseFloat(delivered_sqm) > remainingSqm) {
        res.status(400).json({
          error: `Cannot deliver more than remaining SQM (${remainingSqm})`,
        });
        return;
      }

      // ADD to existing delivered, SUBTRACT from remaining
      query = `
        UPDATE jobs 
        SET
          status_id = $1,
          total_delivered_sqm = COALESCE(total_delivered_sqm, 0) + $2,
          total_sqm = total_sqm - $2,
          updated_at = NOW()
        WHERE id = $3 AND user_id = $4
        RETURNING *
      `;
      values = [status_id, parseFloat(delivered_sqm), jobId, user_id];
    } else {
      // Any other status — just update status only
      query = `
        UPDATE jobs 
        SET
          status_id = $1,
          updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      values = [status_id, jobId, user_id];
    }

    const result = await dbPool.query(query, values);

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
  const user_id = req.user?.id; // Ensure the user can only delete their own jobs
  try {
    const result = await dbPool.query(
      "DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *",
      [jobId, user_id],
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

export const exportJobs = async (req: Request, res: Response) => {
  const user_id = req.user?.id;

  try {
    // Get all jobs for this user with joins
    const result = await dbPool.query(
      `
      SELECT 
          jobs.job_number,
    jobs.date_received,
    jobs.item,
    materials.name AS material,
    projects.name AS project,
    jobs.level,
    jobs.original_sqm,          
    jobs.total_sqm AS remaining_sqm,
    jobs.total_delivered_sqm,
    jobs.unit,
    statuses.name AS status,
    jobs.date_to_production,
    jobs.notes
      FROM jobs
      LEFT JOIN materials ON jobs.material_id = materials.id
      LEFT JOIN projects ON jobs.project_id = projects.id
      LEFT JOIN statuses ON jobs.status_id = statuses.id
      WHERE jobs.user_id = $1
      ORDER BY jobs.date_received DESC
    `,
      [user_id],
    );

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Jobs");

    // Define columns
    worksheet.columns = [
      { header: "Job Number", key: "job_number", width: 15 },
      { header: "Date Received", key: "date_received", width: 15 },
      { header: "Item", key: "item", width: 25 },
      { header: "Material", key: "material", width: 20 },
      { header: "Project", key: "project", width: 20 },
      { header: "Level", key: "level", width: 15 },
      { header: "Total SQM", key: "original_sqm", width: 12 },
      { header: "Delivered SQM", key: "total_delivered_sqm", width: 15 },
      { header: "Remaining SQM", key: "remaining_sqm", width: 15 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Status", key: "status", width: 20 },
      { header: "Date to Production", key: "date_to_production", width: 18 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A5F" },
      };
      cell.alignment = { horizontal: "center" };
    });

    // Add rows
    result.rows.forEach((job) => {
      worksheet.addRow({
        ...job,
        date_received: job.date_received
          ? new Date(job.date_received).toLocaleDateString("en-GB")
          : "",
        date_to_production: job.date_to_production
          ? new Date(job.date_to_production).toLocaleDateString("en-GB")
          : "",
      });
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=jobs_export.xlsx",
    );

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    const error = err as Error;
    console.error("Export error:", error.message);
    res.status(500).json({ error: "Failed to export jobs" });
  }
};

// Multer config - store in memory not disk
export const upload = multer({ storage: multer.memoryStorage() });

// export const importJobs = async (req: Request, res: Response) => {
//   const user_id = req.user?.id;

//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     // Read Excel file from buffer
//     const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0] as string;
//     const worksheet = workbook.Sheets[sheetName];

//     // Convert to JSON
//     const rows: any[] = XLSX.utils.sheet_to_json(worksheet as any);

//     if (rows.length === 0) {
//       return res.status(400).json({ error: "Excel file is empty" });
//     }

//     // Get materials, projects, statuses for name lookup
//     const [materials, projects, statuses] = await Promise.all([
//       dbPool.query("SELECT id, name FROM materials"),
//       dbPool.query("SELECT id, name FROM projects WHERE user_id = $1", [
//         user_id,
//       ]),
//       dbPool.query("SELECT id, name FROM statuses"),
//     ]);

//     const parseDate = (dateStr: string | undefined): string | null => {
//       if (!dateStr) return null;

//       // If format is DD/MM/YYYY convert to YYYY-MM-DD
//       if (typeof dateStr === "string" && dateStr.includes("/")) {
//         const [day, month, year] = dateStr.split("/");
//         return `${year}-${month}-${day}`;
//       }

//       return dateStr;
//     };
//     // Create lookup maps - name → id
//     const materialMap: any = {};
//     materials.rows.forEach((m) => (materialMap[m.name.toUpperCase()] = m.id));

//     const projectMap: any = {};
//     projects.rows.forEach((p) => (projectMap[p.name.toUpperCase()] = p.id));

//     const statusMap: any = {};
//     statuses.rows.forEach((s) => (statusMap[s.name.toUpperCase()] = s.id));

//     // Track results
//     const results = {
//       success: 0,
//       skipped: 0, // ← add this
//       failed: 0,
//       errors: [] as string[],
//     };

//     // Insert each row
//     for (const row of rows) {
//       console.log("Row data:", row);
//       try {
//         const material_id =
//           materialMap[row["Material"]?.toString().toUpperCase()];
//         const project_id = projectMap[row["Project"]?.toString().toUpperCase()];
//         const status_id = statusMap[row["Status"]?.toString().toUpperCase()];
//         const total_sqm = parseFloat(row["Total SQM"]) || 0;
//         const imported_delivered_sqm = parseFloat(row["Delivered SQM"]) || 0;
//         const statusName = row["Status"]?.toString().toUpperCase();
//         const final_total_sqm =
//           statusName === "DELIVERED" ? 0 : total_sqm - imported_delivered_sqm;
//         const final_delivered_sqm =
//           statusName === "DELIVERED" ? total_sqm : imported_delivered_sqm;

//         const insertResult = await dbPool.query(
//           `
//   INSERT INTO jobs (
//     job_number, date_received, item, material_id, project_id,
//     level, total_sqm, original_sqm, total_delivered_sqm, unit, status_id,
//     date_to_production, notes, user_id
//   ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
//   ON CONFLICT (job_number, user_id) DO NOTHING
// `,
//           [
//             row["Job Number"]?.toString() || "", // $1
//             parseDate(row["Date Received"]), // $2
//             row["Item"]?.toString() || "", // $3
//             material_id || null, // $4
//             project_id || null, // $5
//             row["Level"]?.toString() || "", // $6
//             final_total_sqm, // $7 total_sqm
//             total_sqm, // $8 original_sqm always original
//             final_delivered_sqm, // $9 total_delivered_sqm
//             row["Unit"]?.toString() || "SQM", // $10
//             status_id || null, // $11
//             parseDate(row["Date to Production"]), // $12
//             row["Notes"]?.toString() || "", // $13
//             user_id, // $14
//           ],
//         );

//         if (insertResult.rowCount === 0) {
//           results.skipped++;
//         } else {
//           results.success++;
//         }
//       } catch (err) {
//         const error = err as Error;
//         console.log("Date received raw:", row["Date Received"]);
//         console.log("Date parsed:", parseDate(row["Date Received"]));
//         results.failed++;
//         results.errors.push(
//           `Row ${results.success + results.failed}: ${row["Job Number"]}`,
//         );
//       }
//     }

//     res.json({
//       message: `Import complete! ${results.success} imported, ${results.skipped} skipped (duplicates), ${results.failed} failed`,
//       results,
//     });
//   } catch (err) {
//     const error = err as Error;
//     console.error("Import error:", error.message);
//     res.status(500).json({ error: "Failed to import jobs" });
//   }
// };

export const importJobs = async (req: Request, res: Response) => {
  const user_id = req.user?.id;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0] as string;
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet as any);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    const parseDate = (dateStr: string | undefined): string | null => {
      if (!dateStr) return null;
      if (typeof dateStr === "string" && dateStr.includes("/")) {
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    const [materials, projects, statuses] = await Promise.all([
      dbPool.query("SELECT id, name FROM materials"),
      dbPool.query("SELECT id, name FROM projects WHERE user_id = $1", [
        user_id,
      ]),
      dbPool.query("SELECT id, name FROM statuses"),
    ]);

    // Create lookup maps
    const materialMap: any = {};
    materials.rows.forEach((m) => (materialMap[m.name.toUpperCase()] = m.id));

    const projectMap: any = {};
    projects.rows.forEach((p) => (projectMap[p.name.toUpperCase()] = p.id));

    const statusMap: any = {};
    statuses.rows.forEach((s) => (statusMap[s.name.toUpperCase()] = s.id));

    const results = {
      success: 0,
      // skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of rows) {
      try {
        // Auto create material if not exists
        let material_id =
          materialMap[row["Material"]?.toString().toUpperCase()];
        if (!material_id && row["Material"]) {
          const newMaterial = await dbPool.query(
            "INSERT INTO materials (name) VALUES ($1) RETURNING id",
            [row["Material"]],
          );
          material_id = newMaterial.rows[0].id;
          materialMap[row["Material"].toString().toUpperCase()] = material_id;
        }

        // Auto create project if not exists
        let project_id = projectMap[row["Project"]?.toString().toUpperCase()];
        if (!project_id && row["Project"]) {
          const newProject = await dbPool.query(
            "INSERT INTO projects (name, user_id) VALUES ($1, $2) RETURNING id",
            [row["Project"], user_id],
          );
          project_id = newProject.rows[0].id;
          projectMap[row["Project"].toString().toUpperCase()] = project_id;
        }

        // Status must match existing — no auto create
        const status_id =
          statusMap[row["Status"]?.toString().toUpperCase()] || null;

        const total_sqm = parseFloat(row["Total SQM"]) || 0;
        const imported_delivered_sqm = parseFloat(row["Delivered SQM"]) || 0;
        const statusName = row["Status"]?.toString().toUpperCase();

        const final_total_sqm =
          statusName === "DELIVERED" ? 0 : total_sqm - imported_delivered_sqm;
        const final_delivered_sqm =
          statusName === "DELIVERED" ? total_sqm : imported_delivered_sqm;

        const insertResult = await dbPool.query(
          `
          INSERT INTO jobs (
            job_number, date_received, item, material_id, project_id,
            level, total_sqm, original_sqm, total_delivered_sqm, unit, status_id,
            date_to_production, notes, user_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
          `,
          [
            row["Job Number"]?.toString() || "",
            parseDate(row["Date Received"]),
            row["Item"]?.toString() || "",
            material_id || null,
            project_id || null,
            row["Level"]?.toString() || "",
            final_total_sqm,
            total_sqm,
            final_delivered_sqm,
            row["Unit"]?.toString() || "SQM",
            status_id || null,
            parseDate(row["Date to Production"]),
            row["Notes"]?.toString() || "",
            user_id,
          ],
        );

        // if (insertResult.rowCount === 0) {
        //   results.skipped++;
        // } else {
        //   results.success++;
        // }
      } catch (err) {
        const error = err as Error;
        console.error(
          "Failed row:",
          row["Job Number"],
          "Error:",
          error.message,
        );
        results.failed++;
        results.errors.push(
          `Row ${results.success + results.failed}: ${row["Job Number"]}`,
        );
      }
    }

    res.json({
      message: `Import complete! ${results.success} imported, ${results.failed} failed`,
      results,
    });
  } catch (err) {
    const error = err as Error;
    console.error("Import error:", error.message);
    res.status(500).json({ error: "Failed to import jobs" });
  }
};

export const downloadTemplate = async (req: Request, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Jobs");

    worksheet.columns = [
      { header: "Job Number", key: "job_number", width: 15 },
      { header: "Date Received", key: "date_received", width: 15 },
      { header: "Item", key: "item", width: 25 },
      { header: "Material", key: "material", width: 20 },
      { header: "Project", key: "project", width: 20 },
      { header: "Level", key: "level", width: 15 },
      { header: "Total SQM", key: "total_sqm", width: 12 },
      { header: "Delivered SQM", key: "delivered_sqm", width: 15 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Status", key: "status", width: 20 },
      { header: "Date to Production", key: "date_to_production", width: 18 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A5F" },
      };
      cell.alignment = { horizontal: "center" };
    });

    // Add example row so husband knows format
    worksheet.addRow({
      job_number: "4500-033",
      date_received: "01/03/2026",
      item: "GI DUCT LEVEL 01",
      material: "GI DUCT",
      project: "project001",
      level: "LEVEL-01",
      total_sqm: 500,
      unit: "SQM",
      status: "IN PRODUCTION",
      date_to_production: "15/03/2026",
      notes: "",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=import_template.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    const error = err as Error;
    console.error("Template error:", error.message);
    res.status(500).json({ error: "Failed to download template" });
  }
};
