"use client";
import { useEffect, useState } from "react";
import axios from "axios";

type User = {
  id: string;
  email: string;
  // Add other fields as needed
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8080/protected", {
        withCredentials: true, // Ensure cookies are sent
      })
      .then((res) => {
        setUser(res.data.user); // Successfully retrieved the user data
      })
      .catch(() => {
        setUser(null); // Reset user if authentication fails
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading };
};
