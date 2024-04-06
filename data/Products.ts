import { Product, ProductUnlockConditions } from "@/interfaces/product";
import {
  GOODS_UNLOCK_CONDITIONS as goodsUnlockConditions,
  PRODUCTS as pdtData,
} from "resonance-data-columba/dist/columbabuild";

const pdts: Product[] = Object.values(pdtData) as Product[];

export const PRODUCTS: Product[] = pdts;
export const PRODUCT_UNLOCK_CONDITIONS: ProductUnlockConditions = goodsUnlockConditions;
