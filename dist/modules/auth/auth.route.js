import { Router } from "express";
import { authController } from "./auth.controller";
const router = Router();
export const authRouter = router;
router.post("/signup", authController.signup);
router.post("/login", authController.login);
//# sourceMappingURL=auth.route.js.map