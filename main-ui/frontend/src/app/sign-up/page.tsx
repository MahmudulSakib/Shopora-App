"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const SignUpCard = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:8080/public-sign-up",
        { email, password },
        { withCredentials: true }
      );
      toast.success("Signed up successfully!");
      router.push("/log-in");
    } catch (err) {
      toast.error("Signup failed. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto mt-20">
      <form onSubmit={handleSignup}>
        <CardHeader>
          <CardTitle>Create a new account</CardTitle>
          <CardDescription>
            Sign up with your email and password
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-3">
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
          <span className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/log-in" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </span>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignUpCard;
