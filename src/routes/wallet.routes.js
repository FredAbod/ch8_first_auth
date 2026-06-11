const express = require("express");
const router = express.Router();

const { createWallet, getWallet, creditWallet } = require("../controllers/wallet.controllers");
const isAuthentication = require("../utils/isAuthentication");

router.post("/create", isAuthentication, createWallet);
router.get("/get", isAuthentication, getWallet);
router.post("/credit", isAuthentication, creditWallet);



module.exports = router;