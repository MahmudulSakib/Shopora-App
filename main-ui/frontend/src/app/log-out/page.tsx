"use client";

import React, { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await axios.post(
          "http://localhost:8080/public-log-out",
          {},
          { withCredentials: true }
        );
        router.push("/");
      } catch (error) {
        console.error("Logout failed:", error);
        router.push("/log-in");
      }
    };

    logout();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Logging out...</p>
    </div>
  );
};

export default LogoutPage;
