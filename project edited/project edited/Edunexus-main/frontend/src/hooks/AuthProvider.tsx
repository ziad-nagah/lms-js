import { createContext, useState, useEffect, useContext } from "react";
import { api } from "@/lib/api";
import type { academicYear, user } from "@/types";

// 1. Create Context
const AuthContext = createContext<{
  user: user | null;
  setUser: React.Dispatch<React.SetStateAction<user | null>>;
  loading: boolean;
  year: academicYear | null;
}>({
  user: null,
  setUser: () => {},
  loading: true,
  year: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<user | null>(null);
  const [loading, setLoading] = useState(true); // <--- Vital for preventing "flicker"
  const [year, setYear] = useState<academicYear | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        // fetch both profile and current year in parallel
        const [profileRes, yearRes] = await Promise.allSettled([
          api.get("/users/profile"),
          api.get("/academic-years/current"),
        ]);

        if (profileRes.status === "fulfilled") {
          setUser(profileRes.value.data.user);
        } else {
          setUser(null);
        }

        if (yearRes.status === "fulfilled") {
          setYear(yearRes.value.data);
        } else {
          setYear(null);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, year }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
