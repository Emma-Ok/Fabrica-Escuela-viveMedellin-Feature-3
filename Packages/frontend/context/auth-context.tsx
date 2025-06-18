"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { loginUser, type LoginRequest, type User } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Leer JWT desde cookie (utilidad básica)
  const getTokenFromCookies = () => {
    const match = /(^| )jwt=([^;]+)/.exec(document.cookie);
    return match ? match[2] : null;
  };

  // Verificar si hay un token y obtener el usuario
  useEffect(() => {
    const verifyToken = async () => {
      const token = getTokenFromCookies();
      if (!token) {
        console.log("🔐 No hay token en cookies");
        setIsLoading(false);
        return;
      }

      try {
        // Decode the token to get user info
        const decodedToken = jwtDecode<{
          sub?: string;
          userId?: number | string;
          name?: string;
          userName?: string;
          email?: string;
        }>(token);
        console.log("🔍 Token decodificado:", decodedToken);
        
        // The backend uses 'sub' (subject) for userName and 'userId' claim for the ID
        const userFromToken: User = {
          id: decodedToken.userId?.toString() ?? "",
          userName: decodedToken.sub ?? "Usuario", // 'sub' contains the userName from backend
          email: decodedToken.email ?? "",
        };
        setUser(userFromToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("✅ Usuario restaurado desde token:", userFromToken);
      } catch (err) {
        console.error("⛔ Fallo al decodificar el token:", err);
        logout(); // Clear invalid token
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Función de login
  const login = async (credentials: LoginRequest) => {
    console.log("🔵 Intentando iniciar sesión con:", credentials.email);
    const { token, user: userFromLogin } = await loginUser(credentials);
    const decodedToken = jwtDecode<{
      sub?: string;
      userId?: number | string;
      name?: string;
      userName?: string;
      email?: string;
    }>(token);

    // Guardar en cookie
    document.cookie = `jwt=${token};path=/;max-age=${60 * 60 * 24}`; // 1 día
    // Configurar token globalmente
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Use the same logic as in token verification
    const loggedInUser: User = {
      id: decodedToken.userId?.toString() ?? "",
      userName: decodedToken.sub ?? userFromLogin.userName ?? "Usuario", // Prefer 'sub' from token
      email: credentials.email,
    };

    // Establecer usuario
    setUser(loggedInUser);

    console.log("✅ Login correcto, usuario:", loggedInUser);
  };

  // Función de logout
  const logout = () => {
    document.cookie = "jwt=;path=/;max-age=0";
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    console.log("👋 Sesión cerrada");
  };

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
      isLoading,
    }),
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}
