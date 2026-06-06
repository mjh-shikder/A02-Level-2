import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";


const router = Router();
export const issueRouter= router
router.post("/", authenticateJWT, issuesController.createIssue)