"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/Sidebar";

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

const MAX_ITEMS = 6;

const Page = () => {
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedIds, setSelectedIds] = useState({
    newArrival: "",
    bestSelling: "",
    topRated: "",
  });

  const [cards, setCards] = useState({
    newArrival: [] as CarouselProduct[],
    bestSelling: [] as CarouselProduct[],
    topRated: [] as CarouselProduct[],
  });

  useEffect(() => {
    axios
      .get("http://localhost:8080/products")
      .then((res) => setProducts(res.data));
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const [a, b, c] = await Promise.all([
      axios.get("http://localhost:8080/card-products-newArrival"),
      axios.get("http://localhost:8080/card-products-bestSelling"),
      axios.get("http://localhost:8080/card-products-topRated"),
    ]);
    setCards({
      newArrival: a.data,
      bestSelling: b.data,
      topRated: c.data,
    });
  };

  const handleAdd = async (type: keyof typeof cards, productId: string) => {
    try {
      await axios.post(`http://localhost:8080/add-to-card-${type}`, {
        productId,
      });
      toast.success("Added");
      fetchCards();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Add failed");
    }
  };

  const handleDelete = async (type: keyof typeof cards, id: string) => {
    console.log("Deleting", { type, id });
    try {
      await axios.delete(`http://localhost:8080/card-products-${type}/${id}`);
      setCards((prev) => ({
        ...prev,
        [type]: prev[type].filter((item) => item.carousel.id !== id),
      }));
      toast.success("Deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    }
  };

  const renderCardSection = (
    title: string,
    type: keyof typeof cards,
    selectedId: string,
    setSelectedId: (id: string) => void
  ) => {
    console.log("🧩 cards[type] for", type, cards[type]);
    return (
      <section className="max-w-xl space-y-4">
        <h2 className="text-lg font-semibold capitalize text-blue-600">
          {title}
        </h2>
        <Select onValueChange={setSelectedId}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center gap-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                  <span>{product.name}</span>
                  <span>${product.price}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => handleAdd(type, selectedId)}
          disabled={cards[type].length >= MAX_ITEMS}
        >
          Add to {title}
        </Button>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {cards[type].map(({ carousel, product }) => (
            <div key={carousel.id} className="border p-3 rounded shadow">
              <img
                src={product.imageUrl}
                className="h-28 w-full object-cover rounded"
              />
              <h3 className="font-medium mt-2">{product.name}</h3>
              <p className="text-sm text-gray-600">${product.price}</p>
              <p className="text-sm text-gray-600 line-clamp-2">
                ${product.details}
              </p>
              <Button
                className="mt-2"
                variant="destructive"
                onClick={() => handleDelete(type, carousel.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-col p-10 space-y-10">
        {renderCardSection(
          "New Arrival Product Cards",
          "newArrival",
          selectedIds.newArrival,
          (id) => setSelectedIds((prev) => ({ ...prev, newArrival: id }))
        )}
        {renderCardSection(
          "Best Selling Product Cards",
          "bestSelling",
          selectedIds.bestSelling,
          (id) => setSelectedIds((prev) => ({ ...prev, bestSelling: id }))
        )}
        {renderCardSection(
          "Top Rated Product Cards",
          "topRated",
          selectedIds.topRated,
          (id) => setSelectedIds((prev) => ({ ...prev, topRated: id }))
        )}
      </div>
    </div>
  );
};

export default Page;
