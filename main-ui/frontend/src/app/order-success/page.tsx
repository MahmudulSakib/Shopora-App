"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const OrderSuccess = () => {
  const searchParams = useSearchParams();
  const trackingId = searchParams.get("trackingId");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 space-y-6">
      <CheckCircle2 className="w-14 h-14 text-green-600" />
      <h1 className="text-2xl font-bold text-green-700">Order Confirmed!</h1>
      <p className="text-muted-foreground">
        Thank you for your purchase. Your order has been successfully placed.
      </p>
      {trackingId && (
        <div className="bg-muted p-4 rounded-md text-sm">
          <p>
            <span className="font-semibold">Tracking ID:</span>{" "}
            <span className="text-blue-600">{trackingId}</span>
          </p>
        </div>
      )}
      <div className="flex gap-4">
        <Link href="/profile">
          <Button variant="outline">View My Orders</Button>
        </Link>
        <Link href="/">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
