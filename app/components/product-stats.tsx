"use client";

import { CityName, cities } from "@/data/Cities";
import { products } from "@/data/Products";
import { useContext } from "react";
import { PriceContext } from "../price-provider";

export default function ProductStats(props: { product: string }) {
  const { prices, setPrice } = useContext(PriceContext);
  const { product } = props;

  return (
    <div>
      <p>{product}</p>
      {cities.map((city: CityName) => {
        const productStats = prices[product];
        if (!productStats) {
          return <p key={city}>No data for {product}</p>;
        }

        const cityStats = productStats[city];
        if (!cityStats) {
          return (
            <p key={city}>
              No data for {product} {city}
            </p>
          );
        }

        const pdtConfig = products.find((p) => p.name === product)!;
        const basePrice = (city === pdtConfig.city ? pdtConfig.price : pdtConfig.prices[city]) ?? 0;
        const localePrice = Math.round((basePrice * cityStats.variation) / 100);

        return (
          <p key={city}>
            {city} - {cityStats.variation}% - {cityStats.trend} - {localePrice} - {cityStats.time._seconds}
          </p>
        );
      })}
    </div>
  );
}
