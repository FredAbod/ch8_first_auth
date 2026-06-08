const mongoose = require('mongoose');

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
            default: 0
        }
    },
    { timestamps: true, versionKey: false },
);

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;