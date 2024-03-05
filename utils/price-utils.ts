import { CITIES } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { ProductRow } from "@/interfaces/prices-table";

export const isCraftableProduct = (pdtName: string) => {
  const craft = PRODUCTS.find((pdt) => pdt.name === pdtName)?.craft;
  return craft ? true : false;
};

export const highestProfitCity = (row: ProductRow) => {
  const highestProfitCity = CITIES.reduce((a, b) =>
    (row.targetCity[a]?.singleProfit ?? 0) > (row.targetCity[b]?.singleProfit ?? 0) ? a : b
  );
  return highestProfitCity;
};
