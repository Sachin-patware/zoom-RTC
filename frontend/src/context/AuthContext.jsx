import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "zoomrtc_auth";

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [loading, setLoading] = useState(true);

  const persistSession = (nextUser, nextAccessToken, nextRefreshToken) => {
    setUser(nextUser);
    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: nextUser,
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken
        })
      );
    }
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken("");
    setRefreshToken("");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const refreshAccessToken = async (storedRefreshToken) => {
    const data = await apiRequest("/auth/refresh-token", {
      method: "POST",
      body: { refreshToken: storedRefreshToken }
    });

    return data.accessToken;
  };

  const loadProfile = async (tokenToUse) => {
    const data = await apiRequest("/auth/me", {
      token: tokenToUse
    });

    return data.user;
  };

  useEffect(() => {
    const init = async () => {
      const stored = readStoredSession();

      if (!stored?.accessToken || !stored?.refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await loadProfile(stored.accessToken);
        persistSession(currentUser, stored.accessToken, stored.refreshToken);
      } catch (error) {
        if (error?.data?.code === "TOKEN_EXPIRED" && stored.refreshToken) {
          try {
            const freshAccessToken = await refreshAccessToken(stored.refreshToken);
            const currentUser = await loadProfile(freshAccessToken);
            persistSession(currentUser, freshAccessToken, stored.refreshToken);
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = (nextUser, nextAccessToken, nextRefreshToken) => {
    persistSession(nextUser, nextAccessToken, nextRefreshToken);
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await apiRequest("/auth/logout", {
          method: "POST",
          token: accessToken
        });
      }
    } catch {
      // Clear locally even if the token has expired or the request fails.
    } finally {
      clearSession();
    }
  };

  const refreshUser = async () => {
    if (!accessToken) return;
    const currentUser = await loadProfile(accessToken);
    persistSession(currentUser, accessToken, refreshToken);
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      loading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      logout,
      refreshUser
    }),
    [user, accessToken, refreshToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
