"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type AuthUser = {
  id: string;
  email: string;
};

type AuthResponse = {
  user: AuthUser;
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get<AuthResponse>(
          "http://localhost:8080/public-protected",
          {
            withCredentials: true,
          }
        );
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};
