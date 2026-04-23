import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ─── STATIC FRONTEND (VERY IMPORTANT) ─────────────

// 🔥 CHANGE THIS BASED ON YOUR BUILD TOOL
const frontendPath = path.join(__dirname, "../frontend/dist");// ✅ Vite
// const frontendPath = path.join(__dirname, "client/build"); // ✅ CRA

app.use(express.static(frontendPath));

// ─── SPA FALLBACK (MOST IMPORTANT FIX) ─────────────
app.use((req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ─── Start Server ─────────────────────────────────
const startServer = async () => {
    await connectDB();

    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
};

startServer();