"use client";

import { CityName } from "@/data/Cities";
import { useHasFocus } from "@/hooks/useHasFocus";
import { GetPricesProducts } from "@/interfaces/get-prices";
import { ExchangeType, SetPriceRequest } from "@/interfaces/set-price";
import { Trend } from "@/interfaces/trend";
import { createContext, useEffect, useState } from "react";

export interface PriceContextProps {
  prices: GetPricesProducts;
  setPrice: (props: SetPriceProps) => void;
}

export const PriceContext = createContext({
  prices: {},
  setPrice: () => {},
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
  const [data, setData] = useState<GetPricesProducts>({});
  const [lastFetch, setLastFetch] = useState<number | null>(0);
  const focus = useHasFocus();

  const fetchData = () => {
    console.info(new Date(), "fetching data");
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

  // when focus changes or lastFetch changes, do:
  useEffect(() => {
    // if the window is not focused, do not fetch data & do not set interval
    if (!focus) {
      return;
    }

    // has focus & last fetch was more than fetchInterval ago, fetch data
    if (focus && Date.now() - (lastFetch || 0) > fetchInterval) {
      fetchData();
    }

    // set interval to fetch data
    const interval = setInterval(() => {
      // fetch data if last fetch was more than fetchInterval ago
      if (Date.now() - (lastFetch || 0) > fetchInterval) {
        fetchData();
      }
    }, fetchInterval);

    return () => clearInterval(interval); // if focus changes or lastFetch changes, clear interval
  }, [fetchInterval, lastFetch, focus]);

  const value = { prices: data, setPrice };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}
