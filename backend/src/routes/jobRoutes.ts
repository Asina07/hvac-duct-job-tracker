import {Router} from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { createJob, getJobById, getJobs,updateJob,deleteJob, updateJobStatus, exportJobs, upload, importJobs, downloadTemplate } from "../controllers/jobController";

const Jobrouter = Router();

Jobrouter.get('/export', authenticateToken, exportJobs);
Jobrouter.post('/import', authenticateToken, upload.single('file'), importJobs);
Jobrouter.get('/template', authenticateToken, downloadTemplate);

Jobrouter.get("/", authenticateToken, getJobs);
Jobrouter.get("/:id", authenticateToken, getJobById);
Jobrouter.post("/", authenticateToken, createJob);
Jobrouter.put("/:id", authenticateToken, updateJob);
Jobrouter.patch("/:id/status", authenticateToken, updateJobStatus);
Jobrouter.delete("/:id", authenticateToken, deleteJob);



export default Jobrouter;
