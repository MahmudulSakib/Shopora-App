"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "./ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  details: string;
  imageUrl: string;
  price: string;
  createdAt: string;
};

type CarouselProduct = {
  carousel: {
    id: string;
    productId: string;
    createdAt: string;
  };
  product: Product;
};

const BestSellingCard = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [newArrivalCardProducts, setNewArrivalCardProducts] = useState<
    CarouselProduct[]
  >([]);

  useEffect(() => {
    axios
      .get<CarouselProduct[]>("http://localhost:8080/card-products-bestSelling")
      .then((res) => setNewArrivalCardProducts(res.data));
  }, []);
  const handleOrder = async (productId: string) => {
    if (!user) {
      toast.error("Please log in to order");
      router.push("/log-in");
      return;
    }

    try {
      await axios.post(
        "http://localhost:8080/add-to-cart",
        { productId, quantity: 1 },
        { withCredentials: true }
      );

      toast.success("Added to cart!");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      toast.error("Failed to add to cart");
      console.error(err);
    }
  };
  const handleDetails = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <div className="flex flex-col pt-20">
      <h1 className="text-xl font-bold">Best Selling Product</h1>
      <Separator className="my-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {newArrivalCardProducts.map(({ product }) => (
          <Card
            key={product.id}
            className="relative group w-full max-w-[700px] overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border"
          >
            <div className="w-full h-60 overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <CardContent className="p-4 space-y-2">
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-muted-foreground line-clamp-2">
                {product.details}
              </p>
              <p className="text-lg font-bold">${product.price}</p>
            </CardContent>

            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3">
              <Button
                onClick={() => handleOrder(product.id)}
                className="w-40 hover:cursor-pointer bg-teal-700"
              >
                Order Product
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDetails(product.id)}
                className="w-40 hover:cursor-pointer bg-stone-300"
              >
                Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BestSellingCard;
