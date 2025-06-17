"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import Link from "next/link";
import { TypingAnimation } from "./magicui/typing-animation";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
};

const SearchWithSuggestions = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const fetchSuggestions = debounce(async (q: string) => {
    if (!q.trim()) return setSuggestions([]);
    try {
      const res = await axios.get<Product[]>(
        `http://localhost:8080/products-for-searchbox?q=${q}`
      );
      setSuggestions(res.data);
    } catch (err) {
      console.error("Search error", err);
    }
  }, 300);

  useEffect(() => {
    fetchSuggestions(query);
    return () => fetchSuggestions.cancel();
  }, [query]);

  return (
    <div className="relative max-w-[450px] pt-1">
      {!query && !isFocused && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none z-10">
          <TypingAnimation
            children="Search for iPhone, Shoes, Laptop..."
            duration={60}
            className="font-normal text-sm text-black"
          />
        </div>
      )}

      <Input
        type="text"
        value={query}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onChange={(e) => setQuery(e.target.value)}
        className="relative z-20 placeholder-transparent border border-black focus-visible:ring-2 focus-visible:ring-black"
      />

      {suggestions.length > 0 && isFocused && (
        <div className="absolute w-full mt-2 bg-white border rounded shadow z-50 max-h-48 overflow-y-auto">
          {suggestions.map((product) => (
            <Link href={`/product/${product.id}`} key={product.id}>
              <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded-md"
                />
                <div className="flex-1 truncate">{product.name}</div>
                <span className="text-muted-foreground text-xs">
                  ${product.price}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchWithSuggestions;
