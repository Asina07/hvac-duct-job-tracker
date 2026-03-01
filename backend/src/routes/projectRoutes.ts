import { Router } from "express";
import { createProject, getProjects } from "../controllers/projectController";
import { authenticateToken } from "../middleware/authMiddleware";

const projectRouter = Router();

projectRouter.get("/", authenticateToken, getProjects);
projectRouter.post("/", authenticateToken, createProject);

export default projectRouter;
