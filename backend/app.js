import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Imports
import connectDB from "./config/db.js";
import authRoutes from "./Routes/auth.js";
import meetingRoutes from "./Routes/meeting.js";
import { initializeSocket } from "./controllers/socketManager.js";

const app = express();
const httpServer = createServer(app);

// ─── Middleware ────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Socket.io ────────────────────────────────────
initializeSocket(httpServer);

// ─── API Routes ───────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// ─── Start Server ─────────────────────────────────
const startServer = async () => {
    await connectDB();

    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
};

startServer();