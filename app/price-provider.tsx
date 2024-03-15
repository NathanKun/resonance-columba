"use client";

import { CityName } from "@/data/Cities";
import { useHasFocus } from "@/hooks/useHasFocus";
import { GetPricesProducts } from "@/interfaces/get-prices";
import { ExchangeType, SetPriceRequest } from "@/interfaces/set-price";
import { Trend } from "@/interfaces/trend";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { sendGTMEvent } from "@next/third-parties/google";
export interface PriceContextProps {
  prices: GetPricesProducts;
  isV2Prices: boolean;
  setPrice: (props: SetPriceProps) => void;
  setUseV2Prices: (useV2: boolean) => void;
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
  isV2Prices: false,
  setPrice: () => {},
  setUseV2Prices: () => {},
} as PriceContextProps);

export default function PriceProvider({ children }: { children: React.ReactNode }) {
  const fetchInterval = 1000 * 60; // 1 minute
  const [data, setData] = useState<GetPricesProducts>({});
  const [lastFetch, setLastFetch] = useState<number | null>(0);
  // const [useV2, setUseV2] = useState<boolean>(false);
  const queryParameters = useMemo(() => {
    if (typeof window === "undefined") {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }, []);
  const useV2 = queryParameters.get("v2") === "true";
  const setUseV2 = (param: any) => {}; // fake function
  const focus = useHasFocus();

  const fetchData = useCallback((useV2: boolean) => {
    const fetchPricesUrl = useV2 ? "/api/get-prices-v2" : "/api/get-prices";
    console.info(new Date(), "fetching data " + useV2 ? "v2" : "v1");
    fetch(fetchPricesUrl)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setLastFetch(Date.now());
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
        fetchData(useV2);
        console.error("set-price failed", error);
      });

    sendGTMEvent({ event: "set_price", category: "price", action: "set" });
  };

  const setUseV2Prices = (newUseV2: boolean) => {
    setUseV2((oldUseV2: boolean) => {
      // if state changed, fetch new data
      if (oldUseV2 !== newUseV2) {
        fetchData(newUseV2);
      }
      return newUseV2;
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
      fetchData(useV2);
    }

    // set interval to fetch data
    const interval = setInterval(() => {
      // fetch data if last fetch was more than fetchInterval ago
      if (Date.now() - (lastFetch || 0) > fetchInterval) {
        fetchData(useV2);
      }
    }, fetchInterval);

    return () => clearInterval(interval); // if focus changes or lastFetch changes, clear interval
  }, [fetchInterval, lastFetch, focus, fetchData, useV2]);

  const value = { prices: data, setPrice, isV2Prices: useV2, setUseV2Prices };

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}
