"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { useRouter } from "next/navigation";

import AdminSidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  details: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
};

const Page = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = products.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    if (!loading && !user) router.push("/log-in");
    else if (user) fetchProducts();
  }, [user, loading]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/products", {
        withCredentials: true,
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setPrice("");
    setDetails("");
    setImageFile(null);
    setVideoFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !editingId) return alert("Please select an image.");

    setUploading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("details", details);
    if (imageFile) formData.append("file", imageFile);
    if (videoFile) formData.append("video", videoFile);

    try {
      if (editingId) {
        await axios.patch(
          `http://localhost:8080/products/${editingId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
        alert("Product updated!");
      } else {
        await axios.post("http://localhost:8080/add-products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        alert("Product uploaded!");
      }
      fetchProducts();
      resetForm();
      setCurrentPage(1);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price);
    setDetails(product.details);
    setImageFile(null);
    setVideoFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`http://localhost:8080/products/${id}`, {
        withCredentials: true,
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setCurrentPage(1);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7;

    let startPage = Math.max(currentPage - 3, 1);
    let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (!user) return null;

  return (
    <div className="flex px-10">
      <AdminSidebar />
      <div className="w-full pt-10">
        <Card className="max-w-[1800px] pl-10 pr-10">
          <CardHeader>
            <CardTitle className="text-indigo-600">
              {editingId ? "Edit Product" : "Add Product"}
            </CardTitle>
            <CardDescription>
              {editingId ? "Update product details." : "Create a new product."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-6">
              <Label>Product Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Label>Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <Label>Price ($)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <Label>Details</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
              />
              <Label>Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  className="w-40 mt-2 rounded"
                />
              )}
              <Label>Video</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-10">
              <Button type="submit" className="min-w-[400px] cursor-pointer">
                {uploading
                  ? "Uploading..."
                  : editingId
                  ? "Update Product"
                  : "Add Product"}
              </Button>
              {editingId && (
                <Button
                  variant="ghost"
                  type="button"
                  className="min-w-[400px] cursor-pointer"
                  onClick={resetForm}
                >
                  Cancel Edit
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        {products.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {currentProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-indigo-600 font-semibold">
                    ${product.price}
                  </p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <p className="text-sm mt-1">{product.details}</p>
                  {product.videoUrl && (
                    <video controls className="w-full mt-2 rounded">
                      <source src={product.videoUrl} type="video/mp4" />
                    </video>
                  )}
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => handleEdit(product)}>Edit</Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 flex-wrap pt-10 pb-10">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &laquo; Prev
            </Button>

            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className="w-10 h-10 p-0"
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next &raquo;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
