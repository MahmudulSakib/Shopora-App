"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();
  const { loading, user } = useAuth();
  useEffect(() => {
    if (!loading && !user) {
      router.push("/log-in"); // Redirect to login if user is not authenticated
    }
  }, [user, loading, router]);
  if (!user) return;

  return <div>Hello World</div>;
};

export default page;
