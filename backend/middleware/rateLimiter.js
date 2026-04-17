import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 attempts per window
    message: {
        message: "Too many login attempts. Please try again after 15 minutes.",
        code: "RATE_LIMITED"
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        message: "Too many password reset requests. Please try again later.",
        code: "RATE_LIMITED"
    },
    standardHeaders: true,
    legacyHeaders: false
});
