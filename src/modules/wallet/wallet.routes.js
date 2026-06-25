import { Router } from "express";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { authenticate } from "../auth/auth.middleware.js";
import * as walletController from "./wallet.controller.js";
import {
  amountSchema,
  createWalletSchema,
  currencyQuerySchema,
  transferSchema,
} from "./wallet.validation.js";

const router = Router();

router.post(
  "/create",
  authenticate,
  validate(createWalletSchema),
  walletController.createWallet,
);
router.get(
  "/get",
  authenticate,
  validate(currencyQuerySchema, "query"),
  walletController.getWallet,
);
router.post(
  "/credit",
  authenticate,
  validate(amountSchema),
  walletController.creditWallet,
);
router.post(
  "/debit",
  authenticate,
  validate(amountSchema),
  walletController.debitWallet,
);
router.post(
  "/transfer",
  authenticate,
  validate(transferSchema),
  walletController.transfer,
);

export default router;
