const express = require('express');
const { signUp, signIn, makeAdmin, getAllUsers, verifyEmail, resendOtp, editProfile } = require('../controllers/user.controllers');
const isAuthentication = require('../utils/isAuthentication');
const upload = require('../config/multer');
const router = express.Router();


router.post("/signup", signUp)
router.post("/signin", signIn)
router.patch("/verify-email", verifyEmail)
router.post("/resend-otp", resendOtp)
router.patch("/new-admin/:userId", makeAdmin)
router.get("/all-users", isAuthentication, getAllUsers)
router.patch("/edit-profile", isAuthentication, upload.single("profilePicture"), editProfile)


module.exports = router;