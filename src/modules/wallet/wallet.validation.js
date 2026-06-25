import Joi from "joi";
import { SUPPORTED_CURRENCIES } from "../../shared/constants/wallet.constants.js";

export const createWalletSchema = Joi.object({
  phoneNumber: Joi.string().trim().required(),
  currency: Joi.string()
    .valid(...SUPPORTED_CURRENCIES)
    .default("NGN"),
});

export const amountSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string()
    .valid(...SUPPORTED_CURRENCIES)
    .default("NGN"),
});

export const transferSchema = Joi.object({
  recipientAccountNumber: Joi.string().trim().required(),
  amount: Joi.number().positive().max(1_000_000).required(),
  currency: Joi.string()
    .valid(...SUPPORTED_CURRENCIES)
    .default("NGN"),
});

export const currencyQuerySchema = Joi.object({
  currency: Joi.string()
    .valid(...SUPPORTED_CURRENCIES)
    .default("NGN"),
});
