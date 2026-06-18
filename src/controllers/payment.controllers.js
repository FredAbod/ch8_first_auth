const Transaction = require("../models/transaction.models");
const User = require("../models/user.models");
const Wallet = require("../models/wallet.models");
const { initiatePayment, verifyPayment } = require("../utils/flutterwave");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();

const initializePayment = async (req, res) => {
  const { id } = req.user;
  const { amount } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    const wallet = await Wallet.findOne({ userId: id }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Generate unique reference for this transaction
    const reference = `${user._id}-${Date.now()}`;

    // Initiate payment with provider first
    const paymentData = await initiatePayment(
      amount,
      user.email,
      user.phoneNumber || "N/A",
      `${user.firstName} ${user.lastName}`,
      reference,
    );

    if (!paymentData.success) {
      await session.abortTransaction();
      return res.status(400).json({ message: paymentData.message });
    }

    // Create transaction with all data in one operation
    const newTransaction = await Transaction.create(
      [
        {
          userId: user._id,
          amount,
          trxReference: reference,
          providerTrxId: paymentData.transactionId,
          status: "pending",
          trxType: "credit",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json({
      message: "Payment initialized",
      link: paymentData.link,
      transactionId: paymentData.transactionId,
    });
  } catch (e) {
    await session.abortTransaction();
    console.log(e);
    return res.status(500).json({ message: "Payment initialization failed" });
  } finally {
    session.endSession();
  }
};

const handleWebhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac("sha256", process.env.FLUTTERWAVE_SECRET_HASH || "")
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["verif-hash"]) {
      await session.abortTransaction();
      return res.status(401).json({ message: "Unauthorized webhook" });
    }

    const { event, data } = req.body;

    if (event !== "charge.completed") {
      await session.abortTransaction();
      return res.status(200).json({ message: "Event not processed" });
    }

    const { status, tx_ref, amount } = data;

    if (status !== "successful") {
      await session.abortTransaction();
      return res.status(200).json({ message: "Payment not successful" });
    }

    // Extract userId from reference (format: userId-timestamp)
    const userId = tx_ref.split("-")[0];

    // Update transaction to completed
    await Transaction.findOneAndUpdate(
      { trxReference: tx_ref },
      { status: "completed" },
      { session }
    );

    // Atomically credit wallet using $inc
    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: parseFloat(amount) } },
      { session, new: true }
    );

    if (!updatedWallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Wallet not found" });
    }

    await session.commitTransaction();

    return res.status(200).json({
      message: "Webhook processed successfully",
      walletBalance: updatedWallet.balance,
    });
  } catch (e) {
    await session.abortTransaction();
    console.log(e);
    return res.status(500).json({ message: "Webhook processing failed" });
  } finally {
    session.endSession();
  }
};

module.exports = {
  initializePayment,
  handleWebhook,
};
