"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavMenu from "@/components/NavMenu";
import { items } from "@/constants/ProfileSidebarItems";

type ProfileData = {
  fullName: string;
  phone: string;
  shippingAddress: string;
  email: string;
};

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get<ProfileData>(
          "http://localhost:8080/user-profile",
          {
            withCredentials: true,
          }
        );
        setProfile(res.data);
        setFullName(res.data.fullName ?? "");
        setPhone(res.data.phone ?? "");
        setShippingAddress(res.data.shippingAddress ?? "");
      } catch {
        toast.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      await axios.patch(
        "http://localhost:8080/user-profile",
        {
          fullName,
          phone,
          shippingAddress,
        },
        { withCredentials: true }
      );
      toast.success("Profile updated");
      setEditing(false);
      setProfile(
        (prev) => prev && { ...prev, fullName, phone, shippingAddress }
      );
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (loading || !profile) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

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

        <main className="flex-1">
          <div className="max-w-xl mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">My Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Email (read-only)</p>
                  <p className="font-medium">{profile.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground">Full Name</p>
                  <Input
                    disabled={!editing}
                    value={fullName ?? ""}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground">Phone</p>
                  <Input
                    disabled={!editing}
                    value={phone ?? ""}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground">Address</p>
                  <Input
                    disabled={!editing}
                    value={shippingAddress ?? ""}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter shipping address"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  {editing ? (
                    <>
                      <Button onClick={handleSave}>Save</Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditing(true)}>Edit</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
