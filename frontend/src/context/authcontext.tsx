import React, { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser } from "@/lib/api"; // ton api.ts
import { User } from "@/types";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Charger depuis localStorage au démarrage
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!user); // si user déjà dans localStorage, pas besoin de loader

  useEffect(() => {
    const init = async () => {
      if (!user) {
        try {
          const currentUser = await getCurrentUser(); // vérifie côté backend
          setUser(currentUser);
          if (currentUser) localStorage.setItem("currentUser", JSON.stringify(currentUser));
        } catch (err) {
          setUser(null);
          localStorage.removeItem("currentUser");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // Met à jour localStorage à chaque changement de user
  useEffect(() => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
