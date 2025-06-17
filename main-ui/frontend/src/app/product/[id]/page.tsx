"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import NavMenu from "@/components/NavMenu";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Lens } from "@/components/magicui/lens";

type Product = {
  id: string;
  name: string;
  category: string;
  details: string;
  imageUrl: string;
  price: string;
  createdAt: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string;
};

const ProductPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!id) return;

    axios
      .get<Product>(`http://localhost:8080/product/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => toast.error("Product not found"));

    axios
      .get<Review[]>(`http://localhost:8080/reviews/${id}`)
      .then((res) => setReviews(res.data));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in to add to cart");
      router.push("/log-in");
      return;
    }
    if (!product) return;
    try {
      await axios.post(
        "http://localhost:8080/add-to-cart",
        { productId: product.id, quantity: 1 },
        { withCredentials: true }
      );
      toast.success("Added to cart");
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      toast.error("Login first to submit review");
      return;
    }
    try {
      await axios.post(
        "http://localhost:8080/reviews",
        {
          productId: id,
          rating,
          comment,
        },
        { withCredentials: true }
      );
      toast.success("Review added!");
      setComment("");
      setRating(5);
      const res = await axios.get<Review[]>(
        `http://localhost:8080/reviews/${id}`
      );
      setReviews(res.data);
    } catch (err: any) {
      toast.error("Failed to submit review");
      console.error("Review error:", err.response?.data || err.message);
    }
  };

  const StarRating = ({
    rating,
    setRating,
  }: {
    rating: number;
    setRating: (value: number) => void;
  }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className={`h-6 w-6 cursor-pointer transition-colors ${
              star <= (hovered ?? rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-400"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!product) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="flex flex-col">
      <NavMenu />
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <div className="flex flex-col md:flex-row gap-8">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full md:w-1/2 h-auto object-cover rounded-xl border"
          />

          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              <span className="font-bold">Category: </span>
              {product.category}
            </p>
            <p className="text-muted-foreground">{product.details}</p>
            <p className="text-2xl font-semibold text-green-600">
              ${product.price}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Submit a Review</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Rating:</label>
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Write your review..."
            className="w-full border rounded p-2"
          />
          <Button variant="outline" onClick={handleReviewSubmit}>
            Submit Review
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="border p-4 rounded-md bg-gray-50">
              <p className="text-sm text-yellow-600 font-semibold">
                Rating: {r.rating} ⭐
              </p>
              <p className="text-gray-800">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
