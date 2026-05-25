const User = require("../models/user.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/email");

const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      otp,
      otpExpiry,
      password: hashedPassword,
    });

    await sendEmail(
      email,
      "Email Verification",
      `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`,
    );

    // Do not return the password in the response
    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
        };
    return res
      .status(201)
      .json({ message: "User created successfully", user: userResponse });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email before signing in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, firstName: user.firstName },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token: token,
      role: user.role,
    };

    return res
      .status(200)
      .json({ message: "User signed in successfully", userResponse });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const makeAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.role = "admin";
    await user.save();
    return res.status(200).json({ message: "User role updated to admin" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You're not authorized to perform this action" });
  }
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ users });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a new 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return res.status(200).json({ message: "OTP resent successfully", otp });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signUp,
  signIn,
  makeAdmin,
  resendOtp,
  verifyEmail,
  getAllUsers,
};
