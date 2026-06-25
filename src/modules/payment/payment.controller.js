import { asyncHandler } from "../../shared/helpers/asyncHandler.js";
import { sendSuccess } from "../../shared/helpers/response.helper.js";
import {
  initializeWalletPayment,
  processPaymentWebhook,
} from "./payment.service.js";

export const initializePayment = asyncHandler(async (req, res) => {
  const result = await initializeWalletPayment(req.user._id, req.body);
  return sendSuccess(res, 200, "Payment initialized", result);
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const result = await processPaymentWebhook(req);
  return sendSuccess(res, 200, "Webhook processed", result);
});
