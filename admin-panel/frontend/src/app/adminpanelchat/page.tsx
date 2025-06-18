"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AdminSidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const socket = io("http://localhost:8080");

type Message = {
  from: string;
  to: string;
  message: string;
  timestamp: number;
};

export default function AdminChatPanel() {
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msg, setMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const adminKey = "admin_chat";
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    const cached = localStorage.getItem(adminKey);
    if (cached) {
      const parsed: Message[] = JSON.parse(cached);
      const valid = parsed.filter((m) => now - m.timestamp <= oneHour);
      setMessages(valid);
      localStorage.setItem(adminKey, JSON.stringify(valid));

      const userLastMessageMap = new Map<string, number>();
      for (const msg of valid) {
        const user = msg.from === "admin@shopora.com" ? msg.to : msg.from;
        userLastMessageMap.set(user, msg.timestamp);
      }

      const sortedUsers = Array.from(userLastMessageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([email]) => email);

      setUsers(sortedUsers);
    }

    const handleMessage = (msg: Message) => {
      const msgWithTime: Message = {
        ...msg,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, msgWithTime];
        localStorage.setItem(adminKey, JSON.stringify(updated));

        const userLastMessageMap = new Map<string, number>();
        for (const m of updated) {
          const user = m.from === "admin@shopora.com" ? m.to : m.from;
          userLastMessageMap.set(user, m.timestamp);
        }

        const sortedUsers = Array.from(userLastMessageMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([email]) => email);

        setUsers(sortedUsers);

        return updated;
      });
    };

    socket.emit("register", "admin@shopora.com");
    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!loading && !user) router.push("/log-in");
  }, [user, loading, router]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
      });
    }
  }, [selectedUser]);

  const sendMsg = () => {
    if (!msg || !selectedUser) return;

    const message: Message = {
      from: "admin@shopora.com",
      to: selectedUser,
      message: msg,
      timestamp: Date.now(),
    };

    socket.emit("message", message);
    setMsg("");
  };

  if (!user) return null;

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex h-screen p-6 gap-6 bg-muted/40 w-full">
        <Card className="w-1/4 p-4 justify-start overflow-y-auto shadow-md rounded-2xl space-y-2">
          <h2 className="text-xl font-bold text-primary mb-2">Users</h2>
          {users.map((email) => (
            <div
              key={email}
              onClick={() => setSelectedUser(email)}
              className={cn(
                "cursor-pointer px-3 py-2 rounded-lg",
                selectedUser === email
                  ? "bg-primary text-white"
                  : "hover:bg-accent"
              )}
            >
              {email}
            </div>
          ))}
        </Card>

        <Card className="w-3/4 flex flex-col p-6 shadow-md rounded-2xl">
          {selectedUser ? (
            <>
              <div className="mb-3 text-sm text-muted-foreground">
                Chatting with:{" "}
                <span className="font-semibold text-primary">
                  {selectedUser}
                </span>
              </div>

              <div
                ref={scrollRef}
                className="h-full overflow-y-auto flex flex-col gap-2 pr-2"
              >
                {messages
                  .filter(
                    (m) => m.from === selectedUser || m.to === selectedUser
                  )
                  .map((m, i) => {
                    const isAdmin = m.from === "admin@shopora.com";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex",
                          isAdmin ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] px-4 py-2 rounded-xl shadow-sm",
                            isAdmin
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-gray-100 text-black rounded-bl-none"
                          )}
                        >
                          <p className="text-sm">{m.message}</p>
                          <div className="text-[10px] mt-1 text-right opacity-70">
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex mt-4 gap-2 items-center">
                <Input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMsg();
                  }}
                />
                <Button onClick={sendMsg} disabled={!msg.trim()}>
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a user to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
