import { verifyAccessToken } from "../utils/generateTokens.js";
import { User } from "../models/User.js";

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized — no token provided" });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: "Not authorized — user not found" });
        }

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
        }
        return res.status(401).json({ message: "Not authorized — invalid token" });
    }
};
