"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { ShoppingBasket } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-100 border-gray-200 text-gray-700">
      <div className=" pt-22 pb-5">
        <div className="flex justify-between">
          <div>
            <div className="flex">
              <ShoppingBasket className="w-8 h-8 m-0 p-0 text-teal-800" />
              {"   "}
              <h2 className="text-2xl font-bold text-black"> Shopora</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your favorite destination for trendy fashion and quality products
              at unbeatable prices.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Shop</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#" className="hover:text-indigo-600">
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Best Sellers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Men's
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Women's
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Support</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Shipping
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Returns
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Legal</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600">
                  Terms of Service
                </a>
              </li>
            </ul>

            <div className="flex space-x-3 mt-4">
              <Button size="icon" variant="ghost">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost">
                <Youtube className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Shopora. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
