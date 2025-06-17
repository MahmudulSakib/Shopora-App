"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AdminSidebar from "@/components/Sidebar";
import { toast } from "sonner";

type OrderItem = {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: string;
  status: string;
  total: number;
  trackingId: string;
  createdAt: string;
  items: OrderItem[];
};

const orderStages = [
  "Order Received",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
];
const CARDS_PER_PAGE = 30;

export default function AdminOrderDetails() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:8080/admin/all-orders", {
          withCredentials: true,
        });
        setOrders(res.data);
      } catch {
        toast.error("Failed to fetch orders");
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await axios.patch(
        `http://localhost:8080/update-order-status/${orderId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success("Status updated");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch {
      toast.error("Update failed");
    }
  };

  const totalPages = Math.ceil(orders.length / CARDS_PER_PAGE);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-full px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">All Orders</h1>

        {paginatedOrders.length === 0 && (
          <p className="text-muted-foreground">No orders found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedOrders.map((order) => (
            <Card key={order.id} className="shadow-md">
              <CardHeader>
                <CardTitle>Order #{order.trackingId}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Placed: {new Date(order.createdAt).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p>
                    <strong>Name:</strong> {order.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.phone}
                  </p>
                  <p>
                    <strong>Shipping:</strong> {order.shippingAddress}
                  </p>
                  <p>
                    <strong>Payment:</strong> {order.paymentMethod}
                  </p>
                  <p>
                    <strong>Status:</strong> {order.status}
                  </p>
                  <p>
                    <strong>Total:</strong> ${(order.total / 100).toFixed(2)}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold">Items</h3>
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-4 items-center border p-2 rounded"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded"
                      />
                      <div>
                        <p>{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × $
                          {(item.price / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {orderStages.map((stage) => (
                    <Button
                      key={stage}
                      size="sm"
                      variant={
                        stage.toLowerCase() === order.status.toLowerCase()
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleStatusChange(order.id, stage)}
                    >
                      {stage}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-4 items-center">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <p className="text-sm">
              Page {currentPage} of {totalPages}
            </p>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
