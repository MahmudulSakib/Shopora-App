"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ShoppingBasket, ShoppingCart, X, Trash2 } from "lucide-react";
import { ShimmerButton } from "./magicui/shimmer-button";
import { VideoText } from "@/components/magicui/video-text";
import SearchWithSuggestions from "./SearchInput";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type CartItem = {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: number;
};

const NavMenu = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await axios.get("http://localhost:8080/cart-items", {
        withCredentials: true,
      });
      const data = res.data as CartItem[];
      setCartItems(data);
      setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      toast.error("Failed to load cart");
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
      fetchCart();
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const deleteItem = async (productId: string) => {
    try {
      await axios.request({
        method: "DELETE",
        url: "http://localhost:8080/remove-cart-item",
        data: { productId },
        withCredentials: true,
      });

      setCartItems((prevItems) =>
        prevItems.filter((item) => item.productId !== productId)
      );
      setCartCount(
        (prevCount) =>
          prevCount -
          (cartItems.find((item) => item.productId === productId)?.quantity ||
            0)
      );

      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartCount(0);
    }

    const handleCartUpdated = () => {
      fetchCart(); // refresh cart when "Order Product" button fires event
    };

    window.addEventListener("cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [user]);

  return (
    <>
      <div className="grid grid-cols-3 pt-5 px-6">
        <div className="flex gap-2">
          <ShoppingBasket className="w-10 h-10 text-teal-800" />
          <div className="ml-[-20px] h-[50px] w-[170px]">
            <Link href="/">
              <VideoText src="https://cdn.magicui.design/ocean-small.webm">
                Shopora
              </VideoText>
            </Link>
          </div>
        </div>

        <div className="xl:mx-auto xl:min-w-[450px]">
          <SearchWithSuggestions />
        </div>

        <div className="flex justify-end items-center gap-4 text-black relative">
          {!loading && user ? (
            <Link href="/profile">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-500 text-white font-semibold text-lg shadow hover:shadow-lg transition cursor-pointer">
                {user.email.charAt(0).toUpperCase()}
              </div>
            </Link>
          ) : (
            <>
              <Link href="/log-in">
                <ShimmerButton>
                  <span className="text-sm font-medium text-white">Log In</span>
                </ShimmerButton>
              </Link>
              <Link href="/sign-up">
                <ShimmerButton>
                  <span className="text-sm font-medium text-white">
                    Sign Up
                  </span>
                </ShimmerButton>
              </Link>
            </>
          )}

          <div
            className="relative cursor-pointer"
            onClick={() => setDrawerOpen(true)}
          >
            <ShoppingCart className="w-8 h-8 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed top-0 right-0 h-full w-96 backdrop-blur-xl bg-white/20 border-l border-white/40 rounded-l-2xl shadow-xl z-50 transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/40">
          <h2 className="text-lg font-semibold text-black">Your Cart</h2>
          <X
            className="cursor-pointer text-gray-700"
            onClick={() => setDrawerOpen(false)}
          />
        </div>

        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-sm text-center text-gray-700">
              Your cart is empty
            </p>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 mb-4 bg-white/40 border border-white/20 rounded-lg p-3"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded border"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-black">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-700">${item.price}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-6 h-6 rounded bg-white/70 hover:bg-white text-black"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                  >
                    -
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                    className="w-6 h-6 rounded bg-white/70 hover:bg-white text-black"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <Trash2
                  className="w-4 h-4 text-red-600 cursor-pointer"
                  onClick={() => deleteItem(item.productId)}
                />
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-4 border-t border-white/30">
            <button
              onClick={() => {
                setDrawerOpen(false);
                router.push("/public-cart");
              }}
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-900"
            >
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NavMenu;
