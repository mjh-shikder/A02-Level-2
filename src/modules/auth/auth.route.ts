import { Router } from "express";
import { authController } from "./authController";

const router = Router()
export const authRouter = router

router.post("/signup", authController.signup);
router.post("/login", authController.login)


