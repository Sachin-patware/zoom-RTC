import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import authRoutes from "./Routes/auth.js";
import { initializeSocket } from "./controllers/socketManager.js";

const app = express();
const httpServer = createServer(app);

// ─── Middleware ────────────────────────────────────
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Socket.io ────────────────────────────────────
const io = initializeSocket(httpServer);

// ─── Routes ───────────────────────────────────────
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({ message: "ZoomRTC API is running", version: "2.0.0" });
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