import { createContext, useContext, useEffect, useState } from "react";
import { api, apiError } from "@/lib/api";

const AuthContext = createContext({ user: null, login: null, logout: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = anonymous

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(false));
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: apiError(e) };
    }
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(false);
  };

  const can = (perm) => {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes("*") || perms.includes(perm);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, can, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
