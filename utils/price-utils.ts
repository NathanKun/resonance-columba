import { PRODUCTS } from "@/data/Products";

export const isCraftableProduct = (pdtName: string) => {
  const craft = PRODUCTS.find((pdt) => pdt.name === pdtName)?.craft;
  return craft ? true : false;
};
