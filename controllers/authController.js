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
    if (!user)
      return res.status(404).json({ message: "Email not registered" });

    const token = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 2 * 60 * 1000; // 2 min
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `https://from-fronted.onrender.com/reset-password/${token}`;

    await transporter.sendMail({
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Password (2 Minutes Valid)",
      html: `
        <h3>Password Reset</h3>
        <p>This link is valid for 2 minutes</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });

    res.json({ message: "Reset link sent to your email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Mail send failed" });
  }
};

/* =========================
   VERIFY TOKEN
========================= */
export const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ expired: true });

  res.json({ valid: true });
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Token expired" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
};