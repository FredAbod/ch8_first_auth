import Joi from "joi";
import { SUPPORTED_CURRENCIES } from "../../shared/constants/wallet.constants.js";

export const initializePaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string()
    .valid(...SUPPORTED_CURRENCIES)
    .default("NGN"),
});
