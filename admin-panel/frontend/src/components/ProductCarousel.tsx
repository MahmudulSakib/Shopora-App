"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

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

interface ProductCarouselProps {
  title: string;
  products: CarouselEntry[];
  onDelete: (id: string) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  products,
  onDelete,
}) => {
  const filledCards = [...products];
  while (filledCards.length < 7) {
    filledCards.push(null as any);
  }

  return (
    <section className="px-10">
      <h2 className="text-xl font-bold text-indigo-600 mb-4">{title}</h2>
      <Carousel className="max-w-[1700px]">
        <CarouselContent className="-ml-2">
          {filledCards.map((item, index) => (
            <CarouselItem
              key={index}
              className="pl-2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6"
            >
              <div className="p-2">
                <Card className="h-full">
                  <CardContent className="p-4 flex flex-col h-full justify-between">
                    {item ? (
                      <>
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-32 object-cover rounded"
                        />
                        <h3 className="text-md font-semibold mt-2 line-clamp-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-indigo-400">
                          ${item.product.price}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.product.details}
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(item.carousel.id)}
                          className="mt-2"
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <div className="w-full h-32 bg-muted rounded mb-2" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
};

export default ProductCarousel;
