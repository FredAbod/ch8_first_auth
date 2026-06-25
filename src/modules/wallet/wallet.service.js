import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError.js";
import { WalletStatus } from "../../shared/enums/walletStatus.enum.js";
import {
  MAX_TRANSFER_AMOUNT,
  TRANSFER_FEE_CAP,
  TRANSFER_FEE_RATE,
} from "../../shared/constants/wallet.constants.js";
import { cacheDel, cacheGet, cacheSet } from "../../cache/cache.service.js";
import { findUserById, updateUserById } from "../user/user.repository.js";
import { sendTemplateEmail } from "../email/email.service.js";
import {
  createWallet,
  findWalletByAccountNumber,
  findWalletByUserAndCurrency,
  incrementWalletBalance,
} from "./wallet.repository.js";

const WALLET_CACHE_TTL = 120;
const walletCacheKey = (userId, currency) => `wallet:${userId}:${currency}`;

const decimalToNumber = (value) => parseFloat(value?.toString() ?? "0");

const buildAccountNumber = (phoneNumber, currency) => {
  const suffix = phoneNumber.slice(-10);
  return currency === "NGN" ? suffix : `${suffix}${currency}`;
};

const assertWalletIsActive = (wallet) => {
  if (wallet.status === WalletStatus.FROZEN) {
    throw new AppError("Wallet is frozen", 403, "WALLET_FROZEN");
  }
};

const toPublicWallet = (wallet) => ({
  id: wallet._id,
  userId: wallet.userId,
  accountNumber: wallet.accountNumber,
  balance: decimalToNumber(wallet.balance),
  currency: wallet.currency,
  status: wallet.status,
  createdAt: wallet.createdAt,
  updatedAt: wallet.updatedAt,
});

export const calculateTransferFee = (amount) => {
  const fee = amount * TRANSFER_FEE_RATE;
  return Math.min(fee, TRANSFER_FEE_CAP);
};

export const createUserWallet = async (userId, { phoneNumber, currency }) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  await updateUserById(userId, { phoneNumber });

  const existingWallet = await findWalletByUserAndCurrency(userId, currency);
  if (existingWallet) {
    throw new AppError(
      `Wallet already exists for currency ${currency}`,
      409,
      "WALLET_EXISTS",
    );
  }

  const wallet = await createWallet({
    userId,
    accountNumber: buildAccountNumber(phoneNumber, currency),
    currency,
  });

  sendTemplateEmail(user.email, "Your Wallet Has Been Created", "wallet-created", {
    firstName: user.firstName,
    accountNumber: wallet.accountNumber,
    phoneNumber,
    currency,
  });

  await cacheDel(walletCacheKey(userId, currency));

  return toPublicWallet(wallet);
};

export const getUserWallet = async (userId, currency = "NGN") => {
  const cacheKey = walletCacheKey(userId, currency);
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const wallet = await findWalletByUserAndCurrency(userId, currency);
  if (!wallet) {
    throw new AppError("Wallet not found", 404, "NOT_FOUND");
  }

  const publicWallet = toPublicWallet(wallet);
  await cacheSet(cacheKey, publicWallet, WALLET_CACHE_TTL);
  return publicWallet;
};

export const creditWallet = async (userId, { amount, currency = "NGN" }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await findWalletByUserAndCurrency(userId, currency, session);
    if (!wallet) {
      throw new AppError("Wallet not found", 404, "NOT_FOUND");
    }

    assertWalletIsActive(wallet);

    const updatedWallet = await incrementWalletBalance(
      { userId, currency },
      amount,
      session,
    );

    await session.commitTransaction();
    await cacheDel(walletCacheKey(userId, currency));

    return toPublicWallet(updatedWallet);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const debitWallet = async (userId, { amount, currency = "NGN" }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await findWalletByUserAndCurrency(userId, currency, session);
    if (!wallet) {
      throw new AppError("Wallet not found", 404, "NOT_FOUND");
    }

    assertWalletIsActive(wallet);

    if (decimalToNumber(wallet.balance) < amount) {
      throw new AppError("Insufficient balance", 400, "INSUFFICIENT_BALANCE");
    }

    const updatedWallet = await incrementWalletBalance(
      { userId, currency, balance: { $gte: amount } },
      -amount,
      session,
    );

    if (!updatedWallet) {
      throw new AppError("Insufficient balance", 400, "INSUFFICIENT_BALANCE");
    }

    await session.commitTransaction();
    await cacheDel(walletCacheKey(userId, currency));

    return toPublicWallet(updatedWallet);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const transferFunds = async (
  userId,
  { recipientAccountNumber, amount, currency = "NGN" },
) => {
  if (amount > MAX_TRANSFER_AMOUNT) {
    throw new AppError(
      `Transfer amount cannot exceed ${MAX_TRANSFER_AMOUNT}`,
      400,
      "TRANSFER_LIMIT_EXCEEDED",
    );
  }

  const fee = calculateTransferFee(amount);
  const totalDebit = amount + fee;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderWallet = await findWalletByUserAndCurrency(userId, currency, session);
    if (!senderWallet) {
      throw new AppError("Sender wallet not found", 404, "NOT_FOUND");
    }

    assertWalletIsActive(senderWallet);

    if (decimalToNumber(senderWallet.balance) < totalDebit) {
      throw new AppError("Insufficient balance", 400, "INSUFFICIENT_BALANCE");
    }

    const recipientWallet = await findWalletByAccountNumber(
      recipientAccountNumber,
      session,
    );
    if (!recipientWallet) {
      throw new AppError("Recipient wallet not found", 404, "NOT_FOUND");
    }

    if (recipientWallet.currency !== currency) {
      throw new AppError("Currency mismatch between wallets", 400, "CURRENCY_MISMATCH");
    }

    assertWalletIsActive(recipientWallet);

    if (senderWallet._id.equals(recipientWallet._id)) {
      throw new AppError("Cannot transfer to the same wallet", 400, "INVALID_TRANSFER");
    }

    await incrementWalletBalance(
      { _id: senderWallet._id, balance: { $gte: totalDebit } },
      -totalDebit,
      session,
    );

    await incrementWalletBalance(
      { _id: recipientWallet._id },
      amount,
      session,
    );

    await session.commitTransaction();

    await cacheDel(walletCacheKey(userId, currency));
    await cacheDel(walletCacheKey(recipientWallet.userId, currency));

    return {
      amount,
      fee,
      totalDebit,
      currency,
      recipientAccountNumber,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
