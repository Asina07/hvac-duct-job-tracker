import { Router } from "express";
import { getStatuses, createStatus } from "../controllers/statusController";
import { authenticateToken } from "../middleware/authMiddleware";

const statusRouter = Router();

statusRouter.get("/", authenticateToken, getStatuses);
statusRouter.post("/", authenticateToken, createStatus);


export default statusRouter;
