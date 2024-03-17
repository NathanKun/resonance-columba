// on a same version, the output of this function should be the same,

import { CITIES } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { GetPricesProducts, LbGetPricesProducts } from "@/interfaces/get-prices";

// so api and web will have the same product id mapping
const PRODUCT_NAME_MAPPING: { [key: number]: string } = (() => {
  const mapping: { [key: number]: string } = {};
  let count = 0;
  for (const p of PRODUCTS) {
    mapping[++count] = p.name;
  }
  return mapping;
})();

const CITY_NAME_MAPPING: { [key: number]: string } = (() => {
  const mapping: { [key: number]: string } = {};
  let count = 0;
  for (const c of CITIES) {
    mapping[++count] = c;
  }
  return mapping;
})();

const productNameToId = (name: string): number | string => {
  for (const id in PRODUCT_NAME_MAPPING) {
    if (PRODUCT_NAME_MAPPING[id] === name) {
      return parseInt(id);
    }
  }
  return name;
};

const productIdToName = (id: number | string): string => {
  const idNum = parseInt(id as string);
  if (isNaN(idNum)) {
    return id as string;
  }

  return PRODUCT_NAME_MAPPING[idNum];
};

const cityNameToId = (name: string): number | string => {
  for (const id in CITY_NAME_MAPPING) {
    if (CITY_NAME_MAPPING[id] === name) {
      return parseInt(id);
    }
  }
  return name;
};

const cityIdToName = (id: number | string): string => {
  const idNum = parseInt(id as string);
  if (isNaN(idNum)) {
    return id as string;
  }

  return CITY_NAME_MAPPING[idNum];
};

export const lowBandwidthResponse = (data: GetPricesProducts): LbGetPricesProducts => {
  const lbData: LbGetPricesProducts = {};
  for (const pdtName in data) {
    const pdtId = productNameToId(pdtName);
    lbData[pdtId] = {};
    for (const type in data[pdtName]) {
      const lbType = type === "buy" ? "b" : "s";
      lbData[pdtId][lbType] = {};
      for (const city in data[pdtName][type]) {
        const cityId = cityNameToId(city);
        const cityData = data[pdtName][type][city];
        lbData[pdtId][lbType][cityId] = {
          t: cityData.trend === "up" ? 1 : 0,
          v: cityData.variation,
          ti: cityData.time,
          p: cityData.price,
        };
      }
    }
  }

  return lbData;
};

export const revertLowBandwidthData = (lbData: LbGetPricesProducts): GetPricesProducts => {
  const data: GetPricesProducts = {};
  for (const pdtId in lbData) {
    const pdtName = productIdToName(pdtId);
    data[pdtName] = {};
    for (const lbType in lbData[pdtId]) {
      const type = lbType === "b" ? "buy" : "sell";
      data[pdtName][type] = {};
      for (const cityId in lbData[pdtId][lbType]) {
        const city = cityIdToName(cityId);
        const cityData = lbData[pdtId][lbType][cityId];
        data[pdtName][type][city] = {
          trend: cityData.t === 1 ? "up" : "down",
          variation: cityData.v,
          time: cityData.ti,
          price: cityData.p,
        };
      }
    }
  }

  return data;
};
