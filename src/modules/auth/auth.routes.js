import { Router } from "express";
import * as authController from "./auth.controller.js";

const router = Router();

router.get("/google", authController.googleAuth);
router.get("/redirect", authController.googleRedirect);

export default router;
