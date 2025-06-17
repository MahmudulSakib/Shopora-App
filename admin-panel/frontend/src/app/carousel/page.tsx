"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import AutoPlay from "embla-carousel-autoplay";

import { X } from "lucide-react";
import AdminSidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

type CarouselImage = {
  id: string;
  imageUrl: string;
  publicId: string;
};

const Page = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const autoplay = useRef(AutoPlay({ delay: 2000, stopOnInteraction: false }));

  useEffect(() => {
    axios
      .get("http://localhost:8080/carousel-images", { withCredentials: true })
      .then((res) => setImages(res.data))
      .catch((err) => console.error("Error fetching images:", err));
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/log-in");
  }, [user, loading, router]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8080/carousel-image-upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      const { url, public_id } = res.data;
      setImages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          imageUrl: url,
          publicId: public_id,
        },
      ]);
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8080/carousel-image-delete/${id}`, {
        withCredentials: true,
      });

      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      alert("Failed to delete image");
    }
  };

  return (
    <div className="flex pl-15">
      <AdminSidebar />

      <main className="flex flex-col gap-6 w-full">
        <h1 className="text-indigo-500 text-[16px] font-bold pt-3">
          Add Carousel
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid w-full max-w-sm items-center gap-1 pb-4">
            <Label htmlFor="picture">Picture</Label>
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button
            type="submit"
            disabled={!file || uploading}
            className="hover:cursor-pointer"
          >
            {uploading ? "Uploading…" : "Submit"}
          </Button>
        </form>

        {images.length > 0 ? (
          <Carousel
            plugins={[autoplay.current]}
            className="w-[1510px] h-[300px]"
            onMouseEnter={() => autoplay.current?.stop()}
            onMouseLeave={() => autoplay.current?.reset()}
            key={images.length}
          >
            <CarouselContent>
              {images.map(({ id, imageUrl }) => (
                <CarouselItem key={id} className="basis-full">
                  <Card className="w-[1500px] h-[300px] overflow-hidden">
                    <CardContent className="p-0 w-full h-full">
                      <img
                        src={imageUrl}
                        alt="carousel"
                        className="w-full h-[300px] pt-[-40px] mt-[-24px]"
                      />
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <p className="text-gray-500">No images available</p>
        )}
        <h2 className="text-indigo-500 font-bold">Your All Carousel Images</h2>
        <div className="flex flex-col gap-4 max-w-[600px]">
          {images.map(({ id, imageUrl }) => (
            <div
              key={id}
              className="flex items-center gap-4 border p-2 rounded shadow bg-white"
            >
              <img
                src={imageUrl}
                alt="preview"
                className="w-28 h-20 object-cover rounded"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(id)}
                className="ml-auto cursor-pointer"
              >
                <X className="w-4 h-4 mr-1 " />
                Delete
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Page;
