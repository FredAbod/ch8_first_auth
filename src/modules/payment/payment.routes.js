import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { authenticate } from "../auth/auth.middleware.js";
import * as paymentController from "./payment.controller.js";
import { initializePaymentSchema } from "./payment.validation.js";

const router = Router();

router.post(
  "/initialize",
  authenticate,
  validate(initializePaymentSchema),
  paymentController.initializePayment,
);
router.post("/webhook", paymentController.handleWebhook);

export default router;
