import crypto from "crypto";
import { User } from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/generateTokens.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/sendEmail.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ═══════════════════════════════════════════════════
// SIGNUP
// ═══════════════════════════════════════════════════
export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name,
            email,
            password,
            provider: "local",
            emailVerificationToken: otp,
            emailVerificationExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, otp);
        } catch (emailErr) {
            console.error("Failed to send verification email:", emailErr.message);
        }

        res.status(201).json({
            message: "Account created! Please check your email to verify your account.",
            user
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Need to explicitly select password since select: false
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.provider === "google") {
            return res.status(400).json({ message: "This email is registered with Google. Please login with Google." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if email is verified
        if (!user.is_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in. Check your inbox.",
                code: "EMAIL_NOT_VERIFIED"
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token and update login info
        user.refreshToken = refreshToken;
        user.is_online = true;
        user.last_login = new Date();
        await user.save();

        res.status(200).json({
            message: "Login successful",
            user,
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// GOOGLE LOGIN
// ═══════════════════════════════════════════════════
export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "No credential provided" });
        }

        const ticket = await googleClient.verifyIdToken({ idToken: credential });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // Create new user — Google users are auto-verified
            user = await User.create({
                name,
                email,
                provider: "google",
                googleId,
                avatar_url: picture,
                is_verified: true,
                is_online: true,
                last_login: new Date()
            });
        } else {
            // Check provider to ensure strict segregation
            if (user.provider === "local") {
                return res.status(400).json({ message: "This email is already registered with email/password. Please login using that method." });
            }

            // Existing Google user — update Google info if necessary
            if (!user.googleId) user.googleId = googleId;
            if (!user.avatar_url && picture) user.avatar_url = picture;
            user.is_online = true;
            user.last_login = new Date();
            await user.save();
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            message: "Google login successful",
            user,
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("Google auth error:", error);
        res.status(500).json({ message: error.message || "Google authentication failed" });
    }
};

// ═══════════════════════════════════════════════════
// VERIFY OTP
// ═══════════════════════════════════════════════════
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP code are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.is_verified) {
             return res.status(400).json({ message: "Account is already verified" });
        }

        if (user.emailVerificationToken !== otp || user.emailVerificationExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP code" });
        }

        user.is_verified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        // Keep them logged in automatically if token generation is desired, 
        // but frontend usually handles redirect to login. We will return success.
        await user.save();

        res.status(200).json({ message: "Email verified successfully! You can now log in." });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// RESEND OTP
// ═══════════════════════════════════════════════════
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.is_verified) {
             return res.status(400).json({ message: "Account is already verified. No need to send OTP." });
        }

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.emailVerificationToken = otp;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        try {
            await sendVerificationEmail(email, otp);
        } catch (emailErr) {
            console.error("Failed to send resend email:", emailErr.message);
        }

        res.status(200).json({ message: "A new OTP has been sent to your email." });
    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        if (!user || user.provider === "google") {
            return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        try {
            await sendResetPasswordEmail(email, resetToken);
        } catch (emailErr) {
            console.error("Failed to send reset email:", emailErr.message);
        }

        res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: "Token and new password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully! You can now log in with your new password." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// REFRESH TOKEN
// ═══════════════════════════════════════════════════
export const refreshTokenHandler = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const user = await User.findById(decoded.id).select("+refreshToken");
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken(user._id);

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════
export const logout = async (req, res) => {
    try {
        req.user.is_online = false;
        req.user.refreshToken = undefined;
        await req.user.save();
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════
// GET ME (Current User Profile)
// ═══════════════════════════════════════════════════
export const getMe = async (req, res) => {
    res.status(200).json({ user: req.user });
};

// ═══════════════════════════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════════════════════════
export const updateProfile = async (req, res) => {
    try {
        const { name, avatar_url } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
        res.status(200).json({ message: "Profile updated", user });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: error.message });
    }
};
