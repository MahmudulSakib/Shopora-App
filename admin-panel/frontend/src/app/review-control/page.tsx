"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminSidebar from "@/components/Sidebar";

type Review = {
  id: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: string;
};

const REVIEWS_PER_PAGE = 100;

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get("http://localhost:8080/admin/all-reviews", {
          withCredentials: true,
        });
        setReviews(res.data);
      } catch {
        toast.error("Failed to fetch reviews");
      }
    };

    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:8080/admin/reviews/${id}`, {
        withCredentials: true,
      });
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 px-4 pt-10 mx-auto max-w-[900px]">
        <div className="py-10 space-y-4">
          <h1 className="text-2xl font-bold">All Reviews</h1>

          {paginatedReviews.length === 0 && (
            <p className="text-muted-foreground">No reviews found.</p>
          )}

          {paginatedReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>{review.email}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(review.id)}
                >
                  <Trash2 className="text-red-500" />
                </Button>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Rating:</p>
                  <p>{review.rating} ⭐</p>
                </div>
                <Separator className="my-2" />
                <p>
                  {review.comment || (
                    <span className="italic text-muted">No comment</span>
                  )}
                </p>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <p className="text-sm">
                Page {currentPage} of {totalPages}
              </p>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
