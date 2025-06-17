"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/Sidebar";

import { toast } from "sonner";

const Page = () => {
  const [url, setUrl] = useState("");
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      "http://localhost:8080/imageUpload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    setUrl(res.data.url);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/log-in");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (searchParams.get("login") === "success" && !toastShown.current) {
      toast.success("Welcome back!");
      toastShown.current = true;
    }
  }, [searchParams]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex justify-center items-center">
      <div>
        <AdminSidebar />
      </div>
      <h1 className="text-3xl font-600 font-serif text-indigo-500">
        Welcome To Admin Dashboard
      </h1>
    </div>
  );
};

export default Page;
