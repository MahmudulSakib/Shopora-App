"use client";

import React, { useState, useEffect, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import axios from "axios";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type CarouselImage = {
  id: string;
  imageUrl: string;
  publicId: string;
};

function HeroCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

  useEffect(() => {
    axios
      .get<CarouselImage[]>("http://localhost:8080/carousel-images", {
        withCredentials: true,
      })
      .then((res) => setImages(res.data))
      .catch((err) => console.error("Error fetching images:", err));
  }, []);

  return (
    <div className="max-w-[1800px] max-h-[400px] mx-auto pt-20">
      <Carousel
        plugins={[plugin.current]}
        className=""
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {images.map(({ id, imageUrl }) => (
            <CarouselItem key={id} className="basis-full">
              <Card className="max-w-[1800px] max-h-[400px] overflow-hidden">
                <CardContent className="p-0 w-full h-full">
                  <img
                    src={imageUrl}
                    alt="carousel"
                    className="w-full h-[400px] pt-[-30px] mt-[-24px]"
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export default HeroCarousel;
