import { PricesTableHiddenProducts } from "@/interfaces/prices-table";
import { useLocalStorage } from "usehooks-ts";

export default function usePricesTableHiddenProducts() {
  const initialConfig: PricesTableHiddenProducts = {};

  const [config, setConfig] = useLocalStorage<PricesTableHiddenProducts>("pricesTableHiddenProducts", initialConfig, {
    initializeWithValue: false,
  });

  return { pricesTableHiddenProducts: config, setPricesTableHiddenProducts: setConfig };
}
