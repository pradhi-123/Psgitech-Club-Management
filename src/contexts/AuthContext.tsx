import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/apiClient";

interface Profile {
  id: string;
  role: "admin" | "coordinator" | "student";
  full_name: string;
  email?: string;
  roll_number?: string;
  department?: string;
  section?: string;
  year?: number;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; role?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const data = await api.get("/api/auth/me");
          setProfile(data);
          setUser({ id: data.id, role: data.role, full_name: data.full_name });
          setSession({ access_token: token });
        } catch (err) {
          localStorage.removeItem("token");
          setProfile(null);
          setUser(null);
          setSession(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      setSession({ access_token: data.token });
      setProfile(data.profile);
      setUser({ id: data.profile.id, role: data.profile.role, full_name: data.profile.full_name });
      return { error: null, role: data.profile.role };
    } catch (err: any) {
      return { error: { message: err.message || "Invalid credentials" } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    setProfile(null);
    setUser(null);
    setSession(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
