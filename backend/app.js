import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
const io = initializeSocket(httpServer);

// ─── Routes ───────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
    res.json({ message: "ZoomRTC API is running", version: "2.0.0" });
});

app.use(express.static(path.join(__dirname, "client/build")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});
// ─── Start Server ─────────────────────────────────
const startServer = async () => {
    await connectDB();

    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
};

startServer();