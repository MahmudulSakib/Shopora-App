"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MessageCircle, Send, ArrowDown } from "lucide-react";

const socket = io("http://localhost:8080");

type Message = {
  from: string;
  to: string;
  message: string;
  timestamp: number;
};

export default function UserChat() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const userKey = user ? `chat_${user.email}` : "";

  useEffect(() => {
    if (!user) return;

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const cached = localStorage.getItem(userKey);
    if (cached) {
      const parsed: Message[] = JSON.parse(cached);
      const valid = parsed.filter((m) => now - m.timestamp <= oneHour);
      setMessages(valid);
      localStorage.setItem(userKey, JSON.stringify(valid));
    }

    const handleMessage = (msg: Message) => {
      const messageWithTime = { ...msg, timestamp: Date.now() };
      setMessages((prev) => {
        const updated = [...prev, messageWithTime];
        localStorage.setItem(userKey, JSON.stringify(updated));
        return updated;
      });
    };

    socket.emit("register", user.email);
    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [user]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!user || !newMsg.trim()) return;
    const message: Message = {
      from: user.email,
      to: "admin@shopora.com",
      message: newMsg.trim(),
      timestamp: Date.now(),
    };
    socket.emit("message", message);
    setNewMsg("");
  };

  const handleClickChatIcon = () => {
    if (!user) {
      toast.error("Please log in to chat.");
      return;
    }
    setChatOpen((prev) => !prev);
    setTimeout(() => {
      const container = scrollRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <>
      <Button
        onClick={handleClickChatIcon}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 z-50 shadow-xl bg-white text-black hover:bg-gray-100 transition cursor-pointer"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {user && chatOpen && (
        <Card className="fixed bottom-24 right-4 w-80 h-[500px] flex flex-col p-4 z-50 rounded-2xl shadow-2xl border backdrop-blur-lg bg-white/60 text-black">
          <div className="text-xs mb-2 text-black">
            {messages.some((m) => m.from === "admin@shopora.com")
              ? "✅ Admin connected"
              : "💬 Waiting for admin"}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-scroll pr-1 space-y-2 pt-2 custom-scroll"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[75%] px-4 py-2 text-sm rounded-lg shadow ${
                  m.from === user.email
                    ? "ml-auto  text-black rounded-br-none border-1 bg-lime-100"
                    : "mr-auto backdrop-blur-lg bg-white text-black rounded-bl-none border"
                }`}
              >
                <div>{m.message}</div>
                <div className="text-[10px] mt-1 text-right opacity-60">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:bg-white transition"
          >
            <ArrowDown className="w-4 h-4 text-black" />
          </button>

          <div className="flex gap-2 mt-3">
            <Input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Type your message..."
              className="flex-1 text-sm bg-white text-black placeholder:text-gray-500"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMsg.trim()}
              className="px-3 bg-black text-white hover:bg-gray-800"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 9999px;
        }
      `}</style>
    </>
  );
}
