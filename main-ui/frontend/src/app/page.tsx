import React from "react";

import NavMenu from "@/components/NavMenu";
import HeroCarousel from "@/components/HeroCarousel";
import ProductsSHow from "@/components/ProductCard";

const page = () => {
  return (
    <div className="flex flex-col">
      <NavMenu />
      <HeroCarousel />
      <ProductsSHow />
    </div>
  );
};

export default page;
