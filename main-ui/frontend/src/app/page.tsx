import React from "react";

import NavMenu from "@/components/NavMenu";
import HeroCarousel from "@/components/HeroCarousel";
import NewArrivalCard from "@/components/NewArrivalCard";
import NewArrivalCarousel from "@/components/NewArrivalCarousel";
import BestSellingCard from "@/components/BestSellingCard";
import BestSellingCarousel from "@/components/BestSellingCarousel";
import TopRatedCard from "@/components/TopRatedCard";
import TopRatedCarousel from "@/components/TopRatedCarousel";
import Footer from "@/components/Footer";
import HeroDescription from "@/components/HeroDescription";

const page = () => {
  return (
    <div className="flex flex-col">
      <NavMenu />
      <HeroCarousel />
      <HeroDescription />
      <NewArrivalCard />
      <NewArrivalCarousel />
      <BestSellingCard />
      <BestSellingCarousel />
      <TopRatedCard />
      <TopRatedCarousel />
      <Footer />
    </div>
  );
};

export default page;
