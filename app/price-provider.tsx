"use client";

import { CityName } from "@/data/Cities";
import useHasFocus from "@/hooks/useHasFocus";
import { GetPricesProducts } from "@/interfaces/get-prices";
import { ExchangeType, SetPriceRequest } from "@/interfaces/set-price";
import { Trend } from "@/interfaces/trend";
import { createContext, useCallback, useEffect, useState } from "react";

import { revertLowBandwidthData } from "@/utils/price-api-compressor";
import { sendGTMEvent } from "@next/third-parties/google";
export interface PriceContextProps {
  prices: GetPricesProducts;
  setPrice: (props: SetPriceProps) => void;
}

interface SetPriceProps {
  product: string;
  city: CityName;
  type: ExchangeType;
  variation?: number;
  trend?: Trend;
}

export const PriceContext = createContext({
  prices: {},
  setPrice: () => {},
} as PriceContextProps);

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) {
    throw new Error(`request failed with ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export default function PriceProvider({ children }: { children: React.ReactNode }) {
  const fetchInterval = 1000 * 60 * 3; // 3 min
  const [data, setData] = useState<GetPricesProducts>({});
  const [lastFetch, setLastFetch] = useState<number | null>(0);
  const focus = useHasFocus();

  const fetchData = useCallback(() => {
    console.info(new Date(), "fetching data");
    fetch("/api/get-prices")
      .then(parseJsonResponse)
      .then((res) => {
        if (!res?.data) {
          throw new Error("price data is missing");
        }
        return revertLowBandwidthData(res.data);
      })
      .then((res) => {
        setData(res);
        setLastFetch(Date.now());
      })
      .catch((error) => {
        console.error("failed to fetch prices", error);
      });
  }, []);

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
      .then(parseJsonResponse)
      .then((res) => {
        if (!res?.data) {
          throw new Error("price data is missing");
        }
        return revertLowBandwidthData(res.data);
      })
      .then((res) => {
        setData(res);
        setLastFetch(Date.now());
      })
      .catch((error) => {
        fetchData();
        console.error("set-price failed", error);
      });

    sendGTMEvent({ event: "set_price", category: "price", action: "set" });
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
  }, [fetchInterval, lastFetch, focus, fetchData]);

  const value = { prices: data, setPrice };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}
