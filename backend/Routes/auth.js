import express from "express";
import { protect } from "../middleware/auth.js";
import { loginLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter.js";
import {
    signup,
    login,
    googleLogin,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    refreshTokenHandler,
    logout,
    getMe,
    updateProfile
} from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", loginLimiter, login);
router.post("/google", googleLogin);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshTokenHandler);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);

export default router;
