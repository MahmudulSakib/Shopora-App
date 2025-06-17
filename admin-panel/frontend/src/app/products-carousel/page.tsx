"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminSidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ProductCarousel from "@/components/ProductCarousel";

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

const Page = () => {
  const { loading, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedNewArrivalProductId, setSelectedNewArrivalProductId] =
    useState("");
  const [newArrivalCarouselProducts, setNewArrivalCarouselProducts] = useState<
    CarouselProduct[]
  >([]);

  const [selectedBestSellingProductId, setSelectedBestSellingProductId] =
    useState("");
  const [bestSellingProducts, setBestSellingProducts] = useState<
    CarouselProduct[]
  >([]);

  const [selectedTopRatedId, setSelectedTopRatedId] = useState("");
  const [topRatedProducts, setTopRatedProducts] = useState<CarouselProduct[]>(
    []
  );

  useEffect(() => {
    if (!loading && !user) router.push("/log-in");
  }, [user, loading, router]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/products")
      .then((res) => setProducts(res.data));

    axios
      .get("http://localhost:8080/carousel-products-newArrival")
      .then((res) => setNewArrivalCarouselProducts(res.data));
    axios
      .get("http://localhost:8080/carousel-products-bestSelling")
      .then((res) => setBestSellingProducts(res.data));
    axios
      .get("http://localhost:8080/carousel-products-topRated")
      .then((res) => setTopRatedProducts(res.data));
  }, []);

  const handleSubmit = async (
    url: string,
    selectedId: string,
    refresh: () => void
  ) => {
    try {
      await axios.post(url, { productId: selectedId });
      toast.success("Added to carousel");
      refresh();
    } catch {
      toast.error("Product already added");
    }
  };

  const handleDelete = async (
    url: string,
    id: string,
    updateList: React.Dispatch<React.SetStateAction<CarouselProduct[]>>
  ) => {
    try {
      await axios.delete(`${url}/${id}`);
      updateList((prev) => prev.filter((item) => item.carousel.id !== id));
      toast.success("Deleted from carousel");
    } catch {
      toast.error("Delete failed");
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-col pl-10 pt-2 space-y-10">
        <section className="max-w-xl space-y-4">
          <h2 className="text-[18px] font-bold text-indigo-600">
            Add New Arrival Product In Carousel
          </h2>
          <Select onValueChange={setSelectedNewArrivalProductId}>
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
            onClick={() =>
              handleSubmit(
                "http://localhost:8080/add-to-carousel-newArrival",
                selectedNewArrivalProductId,
                async () => {
                  const updated = await axios.get(
                    "http://localhost:8080/carousel-products-newArrival"
                  );
                  setNewArrivalCarouselProducts(updated.data);
                }
              )
            }
          >
            Add to Carousel
          </Button>
        </section>
        <ProductCarousel
          title="New Arrival Products"
          products={newArrivalCarouselProducts}
          onDelete={(id) =>
            handleDelete(
              "http://localhost:8080/carousel-products-newArrival",
              id,
              setNewArrivalCarouselProducts
            )
          }
        />

        <section className="max-w-xl space-y-4">
          <h2 className="text-[18px] font-bold text-orange-600">
            Add Best Selling Product In Carousel
          </h2>
          <Select onValueChange={setSelectedBestSellingProductId}>
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
            onClick={() =>
              handleSubmit(
                "http://localhost:8080/add-to-carousel-bestSelling",
                selectedBestSellingProductId,
                async () => {
                  const updated = await axios.get(
                    "http://localhost:8080/carousel-products-bestSelling"
                  );
                  setBestSellingProducts(updated.data);
                }
              )
            }
          >
            Add to Carousel
          </Button>
        </section>
        <ProductCarousel
          title="Best Selling Products"
          products={bestSellingProducts}
          onDelete={(id) =>
            handleDelete(
              "http://localhost:8080/carousel-products-bestSelling",
              id,
              setBestSellingProducts
            )
          }
        />

        <section className="max-w-xl space-y-4">
          <h2 className="text-[18px] font-bold text-emerald-600">
            Add Top Rated Product In Carousel
          </h2>
          <Select onValueChange={setSelectedTopRatedId}>
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
            onClick={() =>
              handleSubmit(
                "http://localhost:8080/add-to-carousel-topRated",
                selectedTopRatedId,
                async () => {
                  const updated = await axios.get(
                    "http://localhost:8080/carousel-products-topRated"
                  );
                  setTopRatedProducts(updated.data);
                }
              )
            }
          >
            Add to Carousel
          </Button>
        </section>
        <ProductCarousel
          title="Top Rated Products"
          products={topRatedProducts}
          onDelete={(id) =>
            handleDelete(
              "http://localhost:8080/carousel-products-topRated",
              id,
              setTopRatedProducts
            )
          }
        />
      </div>
    </div>
  );
};

export default Page;
