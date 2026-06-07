import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authenticateJWT, authorizeRoles } from "../../middlewares/auth.middleware";
const router = Router();
export const issueRouter = router;
router.post("/", authenticateJWT, issuesController.createIssue);
router.get("/", issuesController.getAllIssues);
router.get("/:id", issuesController.getSingleIssue);
router.patch("/:id", authenticateJWT, issuesController.updateIssue);
router.delete("/:id", authenticateJWT, authorizeRoles("maintainer"), issuesController.deleteIssue);
//# sourceMappingURL=issues.route.js.map