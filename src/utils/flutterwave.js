const axios = require("axios");
require("dotenv").config();

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";
const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

const initiatePayment = async (amount, email, phoneNumber, fullName, reference) => {
  try {
    const payload = {
      tx_ref: reference,
      amount,
      currency: "NGN",
      payment_options: "card,ussd,bank_transfer",
      customer: {
        email,
        phonenumber: phoneNumber,
        name: fullName,
      },
      customizations: {
        title: "TechyJaunt Payment",
        description: "Wallet Fund",
        logo: process.env.APP_LOGO || "",
      },
      redirect_url: process.env.FLUTTERWAVE_REDIRECT_URL,
    };

    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      return {
        success: true,
        link: response.data.data.link,
        transactionId: response.data.data.id,
      };
    } else {
      return {
        success: false,
        message: response.data.message,
      };
    }
  } catch (error) {
    console.error("Flutterwave Payment Error:", error.response?.data || error.message);
    throw new Error("Payment initialization failed");
  }
};

const verifyPayment = async (transactionId) => {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status === "success") {
      return {
        success: true,
        status: response.data.data.status,
        amount: response.data.data.amount,
        reference: response.data.data.tx_ref,
      };
    } else {
      return {
        success: false,
        message: response.data.message,
      };
    }
  } catch (error) {
    console.error("Flutterwave Verification Error:", error.response?.data || error.message);
    throw new Error("Payment verification failed");
  }
};

module.exports = { initiatePayment, verifyPayment };
