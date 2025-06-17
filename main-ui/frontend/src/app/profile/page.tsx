"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavMenu from "@/components/NavMenu";
import { items } from "@/constants/ProfileSidebarItems";

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <NavMenu />
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="sm:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex flex-1">
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } sm:block w-64 bg-slate-100 border-r min-h-screen p-4`}
        >
          <ul className="space-y-2 font-medium">
            {items.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.url}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 transition"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
          <p className="mt-2 text-gray-600">Here is your main content.</p>
        </main>
      </div>
    </div>
  );
}
