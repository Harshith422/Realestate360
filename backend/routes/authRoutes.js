const express = require("express");
const { signUp, login, verifyOTP } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);

module.exports = router;
