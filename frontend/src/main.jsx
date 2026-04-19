import "./polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <App />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "rgba(10, 15, 27, 0.92)",
                color: "#f8fafc",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "18px",
                padding: "14px 18px",
                backdropFilter: "blur(14px)"
              }
            }}
            />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
);
