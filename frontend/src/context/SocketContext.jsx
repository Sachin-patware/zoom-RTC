import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function SocketProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: accessToken
        }
      });

      newSocket.on("connect", () => {
        console.log("Connected to Socket.io server:", newSocket.id);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
