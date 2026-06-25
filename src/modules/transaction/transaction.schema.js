import mongoose from "mongoose";
import { TransactionStatus } from "../../shared/enums/transactionStatus.enum.js";

const transactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    senderWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    receiverWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    balanceBefore: {
      type: mongoose.Schema.Types.Decimal128,
    },
    balanceAfter: {
      type: mongoose.Schema.Types.Decimal128,
    },
    trxReference: {
      type: String,
      required: true,
      unique: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    trxType: {
      type: String,
      enum: ["debit", "credit", "transfer"],
      required: true,
    },
    providerTrxId: {
      type: String,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true, versionKey: false },
);

transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ providerTrxId: 1 }, { sparse: true });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
