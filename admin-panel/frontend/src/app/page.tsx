"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSearchParams } from "next/navigation";

// ui importer
import { toast } from "sonner";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import items from "@/constants/navmenu";

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
      router.push("/log-in"); // Redirect to login if user is not authenticated
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
    <div className="flex justify-start items-start">
      <div>
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="font-bold">
                  Shopora Admin Dashboard
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-[20px]">
                    {items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default Page;
