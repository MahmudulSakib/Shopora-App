"use client";

import React, { useState } from "react";
import Link from "next/link";

import SearchWithSuggestions from "./SearchInput";
import { ShoppingBasket, ShoppingCart } from "lucide-react";
import { ShimmerButton } from "./magicui/shimmer-button";

const NavMenu = () => {
  const [cartCount, setCartCount] = useState(3);
  return (
    <div className="grid grid-cols-3 pt-5">
      <div className="flex gap-2">
        <ShoppingBasket className="w-10 h-10 m-0 p-0" />{" "}
        <span className="text-4xl text-black">Shopora</span>
      </div>
      <div className="xl:mx-auto xl:min-w-[450px]">
        <SearchWithSuggestions />
      </div>
      <div className="flex justify-end h-7 items-center space-x-4 text-[16px] my-auto text-black">
        <ShimmerButton className="shadow-2xl">
          <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg w-[70px]">
            <Link href="#" className="hover:text-tea">
              Login
            </Link>
          </span>
        </ShimmerButton>

        <ShimmerButton className="shadow-2xl">
          <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg w-[70px]">
            <Link href="#" className="hover:text-tea">
              Sign Up
            </Link>
          </span>
        </ShimmerButton>

        <div className="relative">
          <ShoppingCart className="w-8 h-8 text-gray-700" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
              {cartCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavMenu;
