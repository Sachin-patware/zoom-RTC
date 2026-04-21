import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

export function SocketProvider({ children }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && accessToken && !socket) {
      const newSocket = io(SOCKET_URL, {
        auth: { token: accessToken },
        autoConnect: false // Don't connect until RoomPage is entered
      });

      newSocket.on("connect", () => {
        console.log("On-Demand Socket Connected:", newSocket.id);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err.message);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [isAuthenticated, accessToken, socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
