import express from "express";
import { registerUser, loginUser, getProfile, changePassword,forgetPassword,resetPassword,verifyResetToken } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.post("/change-password",authMiddleware, changePassword);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-reset-token/:token", verifyResetToken);


export default router;
