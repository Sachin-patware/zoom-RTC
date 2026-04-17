import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_fallback_change_me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_fallback_change_me";

export const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_SECRET);
};
