import { asyncHandler } from "../../shared/helpers/asyncHandler.js";
import { sendSuccess } from "../../shared/helpers/response.helper.js";
import * as walletService from "./wallet.service.js";

export const createWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.createUserWallet(req.user._id, req.body);
  return sendSuccess(res, 201, "Wallet created successfully", { wallet });
});

export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.getUserWallet(
    req.user._id,
    req.query.currency,
  );
  return sendSuccess(res, 200, "Wallet retrieved successfully", { wallet });
});

export const creditWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.creditWallet(req.user._id, req.body);
  return sendSuccess(res, 200, "Wallet credited successfully", { wallet });
});

export const debitWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.debitWallet(req.user._id, req.body);
  return sendSuccess(res, 200, "Wallet debited successfully", { wallet });
});

export const transfer = asyncHandler(async (req, res) => {
  const result = await walletService.transferFunds(req.user._id, req.body);
  return sendSuccess(res, 200, "Transfer completed successfully", result);
});
