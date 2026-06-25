import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import env from "../../config/env.js";
import logger from "../../shared/logger/logger.js";
import { AppError } from "../../shared/errors/AppError.js";
import { TransactionStatus } from "../../shared/enums/transactionStatus.enum.js";
import { cacheDel } from "../../cache/cache.service.js";
import { findUserById } from "../user/user.repository.js";
import {
  findWalletByUserAndCurrency,
  incrementWalletBalance,
} from "../wallet/wallet.repository.js";
import {
  createTransaction,
  findTransactionByReference,
  updateTransactionByReference,
} from "../transaction/transaction.repository.js";

const walletCacheKey = (userId, currency) => `wallet:${userId}:${currency}`;

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

export const initiatePayment = async (
  amount,
  email,
  phoneNumber,
  fullName,
  reference,
  currency = "NGN",
) => {
  try {
    const payload = {
      tx_ref: reference,
      amount,
      currency,
      payment_options: "card,ussd,bank_transfer",
      customer: {
        email,
        phonenumber: phoneNumber,
        name: fullName,
      },
      customizations: {
        title: "TechyJaunt Payment",
        description: "Wallet Fund",
        logo: env.APP_LOGO || "",
      },
      redirect_url: env.FLUTTERWAVE_REDIRECT_URL,
    };

    const response = await axios.post(`${FLUTTERWAVE_BASE_URL}/payments`, payload, {
      headers: {
        Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data.status === "success") {
      return {
        success: true,
        link: response.data.data.link,
        transactionId: response.data.data.id,
      };
    }

    return {
      success: false,
      message: response.data.message,
    };
  } catch (error) {
    logger.error("Flutterwave payment initialization failed", {
      error: error.response?.data || error.message,
    });
    throw new Error("Payment initialization failed");
  }
};

export const verifyPayment = async (transactionId) => {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
        },
      },
    );

    if (response.data.status === "success") {
      return {
        success: true,
        status: response.data.data.status,
        amount: response.data.data.amount,
        reference: response.data.data.tx_ref,
        currency: response.data.data.currency,
      };
    }

    return {
      success: false,
      message: response.data.message,
    };
  } catch (error) {
    logger.error("Flutterwave payment verification failed", {
      error: error.response?.data || error.message,
    });
    throw new Error("Payment verification failed");
  }
};

export const initializeWalletPayment = async (userId, { amount, currency = "NGN" }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const wallet = await findWalletByUserAndCurrency(userId, currency, session);
    if (!wallet) {
      throw new AppError("Wallet not found", 404, "NOT_FOUND");
    }

    const reference = `${user._id}-${currency}-${Date.now()}`;

    const paymentData = await initiatePayment(
      amount,
      user.email,
      user.phoneNumber || "N/A",
      `${user.firstName} ${user.lastName}`,
      reference,
      currency,
    );

    if (!paymentData.success) {
      throw new AppError(paymentData.message, 400, "PAYMENT_INIT_FAILED");
    }

    await createTransaction(
      {
        walletId: wallet._id,
        amount,
        trxReference: reference,
        providerTrxId: paymentData.transactionId,
        status: TransactionStatus.PENDING,
        trxType: "credit",
        currency,
      },
      session,
    );

    await session.commitTransaction();

    return {
      link: paymentData.link,
      transactionId: paymentData.transactionId,
      reference,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const processPaymentWebhook = async (req) => {
  const secretHash = env.FLUTTERWAVE_SECRET_HASH;
  const signature =
    req.headers["flutterwave-signature"] || req.headers["verif-hash"];

  const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
  const hmacHash = crypto
    .createHmac("sha256", secretHash)
    .update(rawBody)
    .digest("base64");

  const isValid = signature === secretHash || signature === hmacHash;

  if (!signature || !isValid) {
    throw new AppError("Unauthorized webhook", 401, "WEBHOOK_UNAUTHORIZED");
  }

  const { event, data } = req.body;

  if (event !== "charge.completed") {
    return { processed: false, reason: "Event not processed" };
  }

  const { status, tx_ref, amount, currency = "NGN" } = data;

  if (status !== "successful") {
    return { processed: false, reason: "Payment not successful" };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingTransaction = await findTransactionByReference(tx_ref, session);

    if (!existingTransaction) {
      throw new AppError("Transaction not found", 404, "NOT_FOUND");
    }

    if (existingTransaction.status === TransactionStatus.COMPLETED) {
      await session.abortTransaction();
      return { processed: true, reason: "Already processed" };
    }

    await updateTransactionByReference(
      tx_ref,
      { status: TransactionStatus.COMPLETED },
      session,
    );

    const userId = tx_ref.split("-")[0];
    const txCurrency = existingTransaction.currency || currency;

    const updatedWallet = await incrementWalletBalance(
      { userId, currency: txCurrency },
      parseFloat(amount),
      session,
    );

    if (!updatedWallet) {
      throw new AppError("Wallet not found", 404, "NOT_FOUND");
    }

    await session.commitTransaction();
    await cacheDel(walletCacheKey(userId, txCurrency));

    return {
      processed: true,
      walletBalance: parseFloat(updatedWallet.balance.toString()),
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
