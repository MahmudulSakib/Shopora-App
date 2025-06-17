"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type CartItem = {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: number;
};

type User = {
  name: string;
  email: string;
};

const Checkout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [note, setNote] = useState("");

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get<{ user: User }>(
          "http://localhost:8080/public-protected",
          {
            withCredentials: true,
          }
        );
        setUser(userRes.data.user);

        const cartRes = await axios.get<CartItem[]>(
          "http://localhost:8080/cart-items",
          {
            withCredentials: true,
          }
        );
        setCartItems(cartRes.data);
      } catch (err) {
        toast.error("Failed to load checkout data");
      }
    };

    fetchData();
  }, []);

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) {
      toast.error("Missing user or cart data");
      return;
    }

    if (!fullName || !phone || !address || !city || !postalCode) {
      toast.error("Please complete your shipping details");
      return;
    }

    const payload = {
      cartItems,
      total,
      fullName,
      phone,
      address,
      city,
      postalCode,
      note,
    };

    setLoading(true);
    try {
      if (paymentMethod === "cod") {
        const res = await axios.post<{ orderId: string; trackingId: string }>(
          "http://localhost:8080/checkout-cod",
          payload,
          {
            withCredentials: true,
          }
        );

        const { trackingId, orderId } = res.data;

        toast.success(`Order placed! Tracking ID: ${trackingId}`);
        router.push(`/order-success?trackingId=${trackingId}`);
      } else if (paymentMethod === "stripe") {
        const res = await axios.post<{ sessionUrl: string }>(
          "http://localhost:8080/checkout-stripe-session",
          payload,
          {
            withCredentials: true,
          }
        );

        const { sessionUrl } = res.data;

        // Redirect to Stripe checkout
        window.location.href = sessionUrl;
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      toast.error("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 border p-6 rounded-xl shadow">
      {/* Left: Shipping Form */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Shipping Information</h2>

        {user && (
          <div>
            <Label>Email (readonly)</Label>
            <Input type="email" value={user.email} readOnly />
          </div>
        )}

        <div>
          <Label>Full Name</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <Label>Phone Number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label>Postal Code</Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <div className="space-y-6 border-l pl-6">
        <h2 className="text-2xl font-bold">Order Summary</h2>

        <ul className="space-y-2">
          {cartItems.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <div>
                {item.name} × {item.quantity}
              </div>
              <div>${(item.price * item.quantity).toFixed(2)}</div>
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-lg font-bold pt-4 border-t">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <div className="pt-4 border-t space-y-2">
          <h3 className="text-xl font-semibold">Payment Method</h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod">Cash on Delivery</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe">Credit/Debit Card (Stripe)</Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
