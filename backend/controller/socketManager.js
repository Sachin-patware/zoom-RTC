import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// Using the exact same secret key as defined in the Auth Router.
// Ideally, both should use process.env.JWT_ACCESS_SECRET.
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_fallback_change_me";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded; 
            next();
        } catch (error) {
            return next(new Error("Authentication error: Invalid Token"));
        }
    });
    let connections={}
    let messages={};
    let timeonline={};

    io.on("connection", (socket) => {
        socket.on("join-call", (path)=>{

        })
        socket.on("signal", (toid, message)=>{
            io.to(toid).emit("signal", socket.id, message);
        })
        socket.on("user-joined", (name)=>{
            
        })
        socket.on("chat-message", (data, sender)=>{
           
        })

        socket.on("disconnect", () => {
            console.log("Secured user disconnected:", socket.id);
        });
    });

    return io;
};
