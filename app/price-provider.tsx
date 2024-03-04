"use client";

import { CityName } from "@/data/Cities";
import { Trend } from "@/interfaces/SellingPrice";
import { createContext, useEffect, useState } from "react";
import { FirestoreProducts } from "./api/get-prices/route";
import { ExchangeType, SetPriceRequest } from "./api/set-price/route";

export interface PriceContextProps {
  prices: FirestoreProducts;
  setPrice: (props: SetPriceProps) => void;
}

export const PriceContext = createContext({
  prices: {},
  setPrice: (props: SetPriceProps) => {},
} as PriceContextProps);

export interface SetPriceProps {
  product: string;
  city: CityName;
  type: ExchangeType;
  variation?: number;
  trend?: Trend;
}

export default function PriceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FirestoreProducts>({});

  const fetchData = () => {
    console.log("fetching prices");
    fetch("/api/get-prices")
      .then((res) => res.json())
      .then((res) => {
        console.log("prices fetched", res.data);
        setData(res.data);
      });
  };

  const setPrice = (props: SetPriceProps) => {
    const { product, city, type, variation, trend } = props;
    // compare with current value
    const pdtData = data[product];
    const cityData = pdtData?.[type]?.[city];
    let newVariation = variation;
    let newTrend = trend;
    let changed = false;
    if (variation !== undefined) {
      changed = cityData?.variation !== variation;
    } else {
      newVariation = cityData?.variation;
    }

    if (!changed && trend !== undefined) {
      changed = cityData?.trend !== trend;
    } else {
      newTrend = cityData?.trend;
    }

    if (!changed) {
      console.log("no change in price; won't update");
      return;
    }

    fetch("/api/set-price", {
      method: "POST",
      body: JSON.stringify({
        product,
        city,
        variation: newVariation,
        trend: newTrend,
        type,
      } as SetPriceRequest),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("price set", res);
        setData(res.data);
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
