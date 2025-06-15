"use client";

import React, { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  details: string;
  imageUrl: string;
  price: string;
  createdAt: string;
};

type CarouselProduct = {
  carousel: {
    id: string;
    productId: string;
    createdAt: string;
  };
  product: Product;
};

const NewArrivalCard = () => {
  const [newArrivalCarouselProducts, setNewArrivalCarouselProducts] = useState<
    CarouselProduct[]
  >([]);

  useEffect;
  return <div></div>;
};

export default NewArrivalCard;
