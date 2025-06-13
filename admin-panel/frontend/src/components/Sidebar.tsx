"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

const AdminSidebar = () => {
  const pathName = usePathname();

  return (
    <div>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-bold text-indigo-500 text-[16px] mb-5">
                <Link href="/">Shopora Admin Dashboard</Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-[20px]">
                  {items.map((item) => {
                    const isActive = pathName === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link
                            href={item.url}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                              isActive
                                ? "bg-indigo-100 text-indigo-700 font-semibold"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
};

export default AdminSidebar;
