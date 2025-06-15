// components/ProductCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const handleOrder = () => {
    return null;
  };

  const handleDetails = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <Card className="relative group w-full max-w-sm overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border">
      <div className="w-full h-60 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="text-xl font-semibold">{product.name}</h3>
        <p className="text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <p className="text-lg font-bold">${product.price}</p>
      </CardContent>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3">
        <Button onClick={handleOrder} className="w-40">
          Order Product
        </Button>
        <Button variant="secondary" onClick={handleDetails} className="w-40">
          Details
        </Button>
      </div>
    </Card>
  );
}

// app/page.tsx or any listing page

const sampleProduct = {
  id: "1",
  name: "Nike Air Max",
  description: "Stylish and comfortable running shoes.",
  price: 129.99,
  image: "https://placehold.co/400x300", // Replace with real image URL
};

export default function ProductsSHow() {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <ProductCard product={sampleProduct} />
    </div>
  );
}
