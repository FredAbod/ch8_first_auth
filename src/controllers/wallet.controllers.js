const User = require("../models/user.models");
const Wallet = require("../models/wallet.models");
const { sendTemplateEmail } = require("../utils/email");
const mongoose = require("mongoose");

const createWallet = async (req, res) => {
  const { id } = req.user;
  const { phoneNumber } = req.body;
  try {
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.phoneNumber = phoneNumber;
    await user.save();

    const existingWallet = await Wallet.findOne({ userId: id });
    if (existingWallet) {
      return res.status(400).json({ message: "Wallet already exists" });
    }

    const wallet = new Wallet({
      userId: user._id,
      accountNumber: phoneNumber.slice(-10),
    });
    await wallet.save();

    // Fire and forget email
    sendTemplateEmail(
      user.email,
      "Your Wallet Has Been Created",
      "wallet-created",
      {
        firstName: user.firstName,
        accountNumber: wallet.accountNumber,
        phoneNumber,
      },
    );

    return res
      .status(201)
      .json({ message: "Wallet created successfully", wallet });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getWallet = async (req, res) => {
  const { id } = req.user;
  try {
    const wallet = await Wallet.findOne({ userId: id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    return res
      .status(200)
      .json({ message: "Wallet retrieved successfully", wallet });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const creditWallet = async (req, res) => {
    const { id } = req.user;
    const { amount } = req.body;
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        if (!amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Amount must be greater than zero" });
        }
        
        // Check wallet exists first
        const walletExists = await Wallet.findOne({ userId: id }).session(session);
        if (!walletExists) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Wallet not found" });
        }
        
        // Atomic operation - prevents race conditions
        const wallet = await Wallet.findOneAndUpdate(
            { userId: id },
            { $inc: { balance: parseFloat(amount) } },
            { session, new: true }
        );
        
        await session.commitTransaction();
        return res.status(200).json({ message: "Wallet credited successfully", wallet });
    } catch (e) {
        await session.abortTransaction();
        console.log(e);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const debitWallet = async (req, res) => {
    const { id } = req.user;
    const { amount } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Amount must be greater than zero" });
        }

        // Check wallet exists and has sufficient balance
        const wallet = await Wallet.findOne({ userId: id }).session(session);
        if (!wallet) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Wallet not found" });
        }

        if (parseFloat(wallet.balance) < parseFloat(amount)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Atomic operation - prevents race conditions
        const updatedWallet = await Wallet.findOneAndUpdate(
            { userId: id },
            { $inc: { balance: -parseFloat(amount) } },
            { session, new: true }
        );

        await session.commitTransaction();
        return res.status(200).json({ message: "Wallet debited successfully", wallet: updatedWallet });
    } catch (e) {
        await session.abortTransaction();
        console.log(e);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

const transfer = async (req, res) => {
    const { id } = req.user;
    const { recipientAccountNumber, amount } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {        
      if (!recipientAccountNumber || !amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Recipient account number and amount are required, and amount must be greater than zero" });
        }

        const senderWallet = await Wallet.findOne({ userId: id }).session(session);
        if (!senderWallet) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Sender wallet not found" });
        }

        if (parseFloat(senderWallet.balance) < parseFloat(amount)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const recipientWallet = await Wallet.findOne({ accountNumber: recipientAccountNumber }).session(session);
        if (!recipientWallet) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Recipient wallet not found" });
        }

        // Perform the transfer
        await Wallet.findOneAndUpdate(
            { userId: id },
            { $inc: { balance: -parseFloat(amount) } },
            { session, new: true }
        );

        await Wallet.findOneAndUpdate(
            { accountNumber: recipientAccountNumber },
            { $inc: { balance: parseFloat(amount) } },
            { session, new: true }
        );

        await session.commitTransaction();
        return res.status(200).json({ message: "Transfer completed successfully" });
    } catch (e) {
        await session.abortTransaction();
        console.log(e);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

module.exports = {
  createWallet,
  getWallet,
  creditWallet,
  debitWallet,
  transfer
};
