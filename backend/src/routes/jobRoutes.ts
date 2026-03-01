import {Router} from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { createJob, getJobById, getJobs,updateJob,deleteJob, updateJobStatus } from "../controllers/jobController";

const Jobrouter = Router();

Jobrouter.get("/", authenticateToken, getJobs);
Jobrouter.get("/:id", authenticateToken, getJobById);
Jobrouter.post("/", authenticateToken, createJob);
Jobrouter.put("/:id", authenticateToken, updateJob);
Jobrouter.patch("/:id/status", authenticateToken, updateJobStatus);
Jobrouter.delete("/:id", authenticateToken, deleteJob);


export default Jobrouter;
