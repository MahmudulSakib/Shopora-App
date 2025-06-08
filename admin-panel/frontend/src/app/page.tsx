"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import axios from "axios";

const Page = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await axios.post(
      "http://localhost:8080/log-out",
      {},
      { withCredentials: true }
    );
    router.push("/log-in");
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/log-in"); // Redirect to login if user is not authenticated
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;

  if (!user) return null;

  return (
    <div>
      <h1>Welcome {user.email}</h1>
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  );
};

export default Page;
