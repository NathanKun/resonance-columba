"use client";

import { CityName } from "@/data/Cities";
import { FirestoreProducts } from "@/interfaces/get-prices";
import { ExchangeType, SetPriceRequest } from "@/interfaces/set-price";
import { Trend } from "@/interfaces/trend";
import { createContext, useEffect, useState } from "react";

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
  const fetchInterval = 1000 * 60; // 1 minute
  const [data, setData] = useState<FirestoreProducts>({});
  const [lastFetch, setLastFetch] = useState<number | null>(0);

  const fetchData = () => {
    console.log("fetching prices");
    fetch("/api/get-prices")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setLastFetch(Date.now());
      });
  };

  const setPrice = (props: SetPriceProps) => {
    const { product, city, type, variation, trend } = props;
    // compare with current value
    const pdtData = data[product];
    const cityData = pdtData?.[type]?.[city];

    let changed = false;
    if (variation !== undefined) {
      changed = cityData?.variation !== variation;
    }

    if (!changed && trend !== undefined) {
      changed = cityData?.trend !== trend;
    }

    if (!changed) {
      return;
    }

    fetch("/api/set-price", {
      method: "POST",
      body: JSON.stringify({
        product,
        city,
        variation,
        trend,
        type,
      } as SetPriceRequest),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("set-price failed");
      })
      .then((responseJson) => {
        setData(responseJson.data);
        setLastFetch(Date.now());
      })
      .catch((error) => {
        fetchData();
        console.error("set-price failed", error);
      });
  };

  // fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // fetch data every fetchInterval
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - (lastFetch || 0) > fetchInterval) {
        fetchData();
      }
    }, fetchInterval);

    return () => clearInterval(interval);
  }, [fetchInterval, lastFetch]);

  const value = { prices: data, setPrice };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}
