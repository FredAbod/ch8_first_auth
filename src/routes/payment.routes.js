const express = require("express");
const { initializePayment, handleWebhook } = require("../controllers/payment.controllers");
const isAuthentication = require("../utils/isAuthentication");

const router = express.Router();

router.post("/initialize", isAuthentication, initializePayment);
router.post("/webhook", handleWebhook);

module.exports = router;
