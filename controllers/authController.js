import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Register user
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User Email InValid" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "User Password Invalid" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "User Login successfully",
      user: { id: user._id, username: user.username, token }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get profile (Only id, username, email)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clean response with only required fields
    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
    });

  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User Email InValid" });

  try {
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with that email does not exist" });
    }

    // 🔑 Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // ⏱️ Token valid for ONLY 2 minutes
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset (Valid for 2 minutes)",
      html: `
        <p>You requested a password reset.</p>
        <p>This link is valid for <b>2 minutes only</b>.</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If expired, please request a new reset link.</p>
      `,
    });

    res.status(200).json({
      message: "Password reset link sent. Valid for 2 minutes.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({ resetPasswordToken: token });

    // ❌ Token not found
    if (!user) {
      return res.status(400).json({
        message: "Invalid reset link. Please request a new one.",
      });
    }

    // ⏱️ Token expired
    if (user.resetPasswordExpires < Date.now()) {
      // 🔥 Invalidate old token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(400).json({
        message: "Reset link expired. Please generate a new reset link.",
        expired: true,
      });
    }

    // ✅ Token valid → reset password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Password has been successfully reset",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ expired: true });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(500).json({ expired: true });
  }
};
