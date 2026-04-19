import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/generateTokens.js";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.error("Socket error: No token provided in handshake");
            return next(new Error("Authentication error: No token provided"));
        }
        
        try {
            // Use the centralized utility to ensure secret consistency
            const decoded = verifyAccessToken(token);
            socket.user = decoded; 
            next();
        } catch (error) {
            console.error("Socket Auth Error:", error.message, "Token received:", token ? `${token.substring(0, 10)}...` : "none");
            return next(new Error("Authentication error: Invalid Token"));
        }
    });
    // Scoped state (though ideally these should be moved to Redis/DB for full scale)
    const roomUsers = new Map(); // path -> Set of socket IDs
    const roomHosts = new Map(); // path -> socket.id (First person to join)
    const socketToRoom = new Map();
    const socketToName = new Map(); // socket.id -> name
    const timeOnline = new Map();
    const roomMessages = new Map(); // path -> Array of messages

    io.on("connection", (socket) => {

        console.log(`User Connected: ${socket.id} (ID: ${socket.user.id})`);
         
        socket.on("join-call", (path, userName) => {
            if (!path) return;

            // Store user metadata
            socketToName.set(socket.id, userName || `Guest ${socket.id.slice(0, 4)}`);
            socketToRoom.set(socket.id, path);
            timeOnline.set(socket.id, Date.now());

            // Track room users
            if (!roomUsers.has(path)) {
                roomUsers.set(path, new Set());
                roomHosts.set(path, socket.id); // The first person is the host
            }
            const currentUsers = roomUsers.get(path);
            const hostId = roomHosts.get(path);
            
            // Get data of people already in the room
            const usersInRoom = Array.from(currentUsers).map(id => ({
                id,
                name: socketToName.get(id),
                isHost: hostId === id
            }));

            // Add self to the room
            currentUsers.add(socket.id);
            socket.join(path);

            console.log(`Socket ${socket.id} joined room: ${path}`);

            // 1. Send the CURRENT user list to the joiner, plus who the host is
            socket.emit("all-users", usersInRoom, hostId);

            // 2. Notify OTHERS that someone new joined
            socket.to(path).emit("user-joined", {
                id: socket.id,
                name: socketToName.get(socket.id),
                isHost: false // New joiners to an existing room are never the host
            });

            // 3. Send message history
            if (roomMessages.has(path)) {
                socket.emit("message-history", roomMessages.get(path));
            }
        });

        // WebRTC Signaling Events
        socket.on("offer", (toId, offer) => {
            io.to(toId).emit("offer", socket.id, offer);
        });

        socket.on("answer", (toId, answer) => {
            io.to(toId).emit("answer", socket.id, answer);
        });

        socket.on("ice-candidate", (toId, candidate) => {
            io.to(toId).emit("ice-candidate", socket.id, candidate);
        });

        socket.on("chat-message", (data, sender) => {
            const { path, message } = data;
            if (!path) return;

            const messageData = { 
                message, 
                sender: sender || "Anonymous", 
                timestamp: Date.now() 
            };

            console.log(`Chat Message in ${path} from ${sender}: ${message}`);

            // Store message (In-memory - Move to DB for production persistence)
            if (!roomMessages.has(path)) {
                roomMessages.set(path, []);
            }
            const messages = roomMessages.get(path);
            messages.push(messageData);
            
            // Keep only last 100 messages in memory to prevent leak
            if (messages.length > 100) messages.shift();

            // Broadcast to everyone in the room
            io.to(path).emit("chat-message", messageData.message, messageData.sender);
        });

        // Use 'disconnecting' to know which rooms the user was in before they leave
        socket.on("disconnecting", () => {
            const path = socketToRoom.get(socket.id);
            if (path) {
                console.log(`User ${socket.id} leaving room: ${path}`);
                
                // Remove from room tracking
                const users = roomUsers.get(path);
                if (users) {
                    users.delete(socket.id);
                    if (users.size === 0) {
                        roomUsers.delete(path);
                        roomHosts.delete(path);
                    } else if (roomHosts.get(path) === socket.id) {
                        // If host leaves, assign random new host
                        const newHost = Array.from(users)[0];
                        roomHosts.set(path, newHost);
                        io.to(path).emit("new-host", newHost); // Optional: notify room of new host
                    }
                }

                socket.to(path).emit("user-left", socket.id);
                socketToRoom.delete(socket.id);
            }
            socketToName.delete(socket.id);
            timeOnline.delete(socket.id);
        });

        socket.on("disconnect", () => {
            console.log(`User Disconnected: ${socket.id}`);
        });

        // Error handling for the socket
        socket.on("error", (err) => {
            console.error(`Socket error for ${socket.id}:`, err);
        });
    });

    return io;
};
