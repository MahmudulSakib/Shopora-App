"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavMenu from "@/components/NavMenu";
import { items } from "@/constants/ProfileSidebarItems";

type Order = {
  id: string;
  trackingId: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
};

const OrdersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get<Order[]>(
          "http://localhost:8080/user-orders",
          {
            withCredentials: true,
          }
        );
        setOrders(res.data);
      } catch (err) {
        toast.error("Failed to load orders");
        console.error(err);
      }
    };

    fetchOrders();
  }, []);

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
          <div className="max-w-5xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-6">My Orders</h1>

            {!orders ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground">
                You haven’t placed any orders yet.
              </p>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex justify-between items-center">
                        <div>
                          <span className="text-muted-foreground">
                            Tracking ID:
                          </span>{" "}
                          <span className="font-mono">{order.trackingId}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 border rounded-md p-3"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right font-medium">
                            ${((item.price / 100) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-3 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="uppercase">
                            {order.paymentMethod}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="capitalize">{order.status}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-foreground pt-2">
                          <span>Total:</span>
                          <span>${(order.total / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrdersPage;
