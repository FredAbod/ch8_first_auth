import mongoose from "mongoose";
import { WalletStatus } from "../../shared/enums/walletStatus.enum.js";
import { SUPPORTED_CURRENCIES } from "../../shared/constants/wallet.constants.js";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: SUPPORTED_CURRENCIES,
      default: "NGN",
    },
    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE,
    },
  },
  { timestamps: true, versionKey: false },
);

walletSchema.index({ userId: 1, currency: 1 }, { unique: true });
walletSchema.index({ accountNumber: 1 });
walletSchema.index({ status: 1 });

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
