const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        senderWalletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
        },
        receiverWalletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
        },
        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
        },
        balanceBefore: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
        },
        balanceAfter: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
        },
        trxReference: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        trxType: {
            type: String,
            enum: ["debit", "credit"],
            required: true,
        },
    },
    { timestamps: true, versionKey: false },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;