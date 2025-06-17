"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavMenu from "@/components/NavMenu";
import { items } from "@/constants/ProfileSidebarItems";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type CartItem = {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: number;
};

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const fetchCartItems = async () => {
    try {
      const res = await axios.get<CartItem[]>(
        "http://localhost:8080/cart-items",
        {
          withCredentials: true,
        }
      );
      setCartItems(res.data);
    } catch {
      toast.error("Failed to fetch cart items");
    }
  };

  const deleteCartItem = async (productId: string) => {
    try {
      await axios.request({
        method: "DELETE",
        url: "http://localhost:8080/remove-cart-item",
        data: { productId },
        withCredentials: true,
      });
      setCartItems((prev) =>
        prev.filter((item) => item.productId !== productId)
      );
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await axios.patch(
        "http://localhost:8080/update-cart-item",
        { productId, quantity },
        { withCredentials: true }
      );
      fetchCartItems();
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  useEffect(() => {
    if (user) fetchCartItems();
  }, [user]);

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
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
          <div className="max-w-5xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
            <Separator className="mb-6" />

            {cartItems.length === 0 ? (
              <p className="text-muted-foreground">Your cart is empty.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Card key={item.productId} className="border shadow">
                      <CardContent className="flex items-center gap-4 p-4">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-md border"
                        />
                        <div className="flex-1 space-y-1">
                          <h2 className="text-lg font-semibold">{item.name}</h2>
                          <p className="text-muted-foreground">
                            Price: ${item.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            -
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                          >
                            +
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteCartItem(item.productId)}
                            size="icon"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <p className="text-lg font-semibold">
                    Total: ${total.toFixed(2)}
                  </p>
                  <Link href="/checkout">
                    <Button className="bg-black text-white hover:bg-gray-900">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
