"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Separator } from "./ui/separator";
import axios from "axios";
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

type CarouselEntry = {
  carousel: {
    id: string;
    productId: string;
    createdAt: string;
  };
  product: Product;
};

const NewArrivalCarousel = () => {
  const [products, setProducts] = useState<CarouselEntry[]>([]);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/carousel-products-newArrival"
        );
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchProducts();
  }, []);

  const filledCards: (CarouselEntry | null)[] = [...products];
  while (filledCards.length < 7) {
    filledCards.push(null);
  }

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
    <section className="pt-20">
      <h2 className="text-xl font-bold mb-4">New Products</h2>
      <Separator className="my-4" />
      <Carousel className="max-w-[100%]">
        <CarouselContent>
          {filledCards.map((item, index) => (
            <CarouselItem
              key={index}
              className="pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/4"
            >
              {item ? (
                <Card className="relative group w-full max-w-[700px] overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border">
                  <div className="w-full h-60 overflow-hidden">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-xl font-semibold">
                      {item.product.name}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2">
                      {item.product.details}
                    </p>
                    <p className="text-lg font-bold">${item.product.price}</p>
                  </CardContent>
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3">
                    <Button
                      onClick={() => handleOrder(item.product.id)}
                      className="w-40 hover:cursor-pointer bg-teal-700"
                    >
                      Order Product
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDetails(item.product.id)}
                      className="w-40 hover:cursor-pointer bg-stone-300"
                    >
                      Details
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="w-full max-w-[700px] h-[300px] flex items-center justify-center border-dashed border text-muted-foreground">
                  <span>Empty Slot</span>
                </Card>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
};

export default NewArrivalCarousel;
