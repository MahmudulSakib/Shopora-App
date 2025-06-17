"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type StripeSessionData = {
  orderId: string;
  trackingId: string;
  fullName: string;
  phone: string;
  shippingAddress: string;
  note?: string;
  total: number;
  cartItems: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
};

const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const finalizeOrder = async () => {
      const sessionId = searchParams.get("sessionId");
      const orderId = searchParams.get("orderId");
      const trackingId = searchParams.get("trackingId");

      if (!sessionId || !orderId || !trackingId) {
        toast.error("Missing payment confirmation data.");
        return;
      }

      try {
        const sessionRes = await axios.get<StripeSessionData>(
          "http://localhost:8080/stripe-session-details",
          {
            params: { sessionId },
            withCredentials: true,
          }
        );

        const sessionData = sessionRes.data;

        await axios.post(
          "http://localhost:8080/checkout-stripe-save",
          {
            stripeSessionId: sessionId,
            orderId,
            trackingId,
            cartItems: sessionData.cartItems,
            total: sessionData.total,
            fullName: sessionData.fullName,
            phone: sessionData.phone,
            shippingAddress: sessionData.shippingAddress,
            note: sessionData.note,
          },
          { withCredentials: true }
        );

        toast.success("Order placed successfully!");
        router.push(`/order-success?trackingId=${trackingId}`);
      } catch (err) {
        toast.error("Failed to finalize your order.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    finalizeOrder();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      <p className="text-lg font-semibold">Finalizing your payment...</p>
    </div>
  );
};

export default PaymentSuccess;
