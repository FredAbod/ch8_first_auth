const express = require('express');
const { signUp, signIn, makeAdmin, getAllUsers } = require('../controllers/user.controllers');
const isAuthentication = require('../utils/isAuthentication');
const router = express.Router();


router.post("/signup", signUp)
router.post("/signin", signIn)
router.patch("/new-admin/:userId", makeAdmin)
router.get("/all-users", isAuthentication, getAllUsers)


module.exports = router;