"use client";

import { CityName } from "@/data/Cities";
import { Trend } from "@/interfaces/SellingPrice";
import { createContext, useEffect, useState } from "react";
import { FirestoreProducts } from "./api/get-prices/route";
import { SetPriceRequest } from "./api/set-price/route";

export interface PriceContextProps {
  prices: FirestoreProducts;
  setPrice: (product: string, city: CityName, variation: number, trend: Trend) => void;
}

export const PriceContext = createContext({
  prices: {},
  setPrice: (product: string, city: CityName, variation: number, trend: Trend) => {},
} as PriceContextProps);

export default function PriceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState({});

  const fetchData = () => {
    console.log("fetching prices");
    fetch("/api/get-prices")
      .then((res) => res.json())
      .then((res) => {
        console.log("prices fetched", res.data);
        setData(res.data);
      });
  };

  const setPrice = (product: string, city: CityName, variation: number, trend: Trend) => {
    fetch("/api/set-price", {
      method: "POST",
      body: JSON.stringify({
        product,
        city,
        variation,
        trend,
      } as SetPriceRequest),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("price set", res);
        fetchData();
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, []);

  const value = { prices: data, setPrice };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}
