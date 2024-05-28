"use client";

import { FORMULAS } from "@/data/Formulas";
// import usePlayerConfig from "@/hooks/usePlayerConfig";
import { FormulaProduce, PriceItem, PriceItemCache } from "@/interfaces/formula-page";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { useContext } from "react";
import { VariationColor } from "../components/MuiThemeProvider";
import ConsumesInfo from "../components/formula-page/consumes-info";
import FormulaOfLevelHead from "../components/formula-page/formula-of-level-head";
import ProduceInfo from "../components/formula-page/produce-info";
import ProfitInfo from "../components/formula-page/profit-info";
import SellInfo from "../components/formula-page/sell-info";
import { PriceContext } from "../price-provider";

export default function FormulaPage() {
  // const playerConfig = usePlayerConfig();
  const { prices } = useContext(PriceContext);
  const formulas = FORMULAS;

  const sellPrices: PriceItemCache = {};
  const buyPrices: PriceItemCache = {};

  const findBuyPrice = (product: string): PriceItem | null => {
    if (buyPrices[product]) {
      return buyPrices[product];
    }

    const buy = prices[product]?.buy;
    if (!buy) {
      return null;
    }

    const buyableCities = Object.keys(buy);
    if (buyableCities.length === 0) {
      return null;
    }

    const buyableCity = buyableCities[0]; // only consider the first city since most products only have one buyable city
    const { price, variation } = buy[buyableCity];

    if (!price) {
      return null;
    }

    buyPrices[product] = {
      price,
      city: buyableCity,
      variation,
    };
    return buyPrices[product];
  };

  const findSellPrice = (product: string): PriceItem | null => {
    if (sellPrices[product]) {
      return sellPrices[product];
    }

    const sell = prices[product]?.sell;
    if (!sell) {
      return null;
    }

    const sellableCities = Object.keys(sell);
    let sellCity = sellableCities[0];
    let sellVariation = 0;
    const sellPrice = sellableCities.reduce((acc, city) => {
      const { price, variation } = sell[city];
      if (price && price > acc) {
        sellCity = city;
        sellVariation = variation;
        return price;
      }
      return acc;
    }, 0);

    sellPrices[product] = {
      price: sellPrice,
      city: sellCity,
      variation: sellVariation,
    };
    return sellPrices[product];
  };

  const getVariationColor = (variation: number): VariationColor => {
    if (variation > 100) {
      return "variationHigh";
    } else if (variation === 100) {
      return "variationMedium";
    } else {
      return "variationLow";
    }
  };

  const toPrimaryMaterial = (item: FormulaProduce): FormulaProduce[] => {
    const { product, num } = item;
    const formula = formulas[product];
    if (!formula) {
      return [item];
    }

    const { consumes, produce } = formula.at(-1)!;
    const produceNum = produce.num;
    return consumes.flatMap((consume) => {
      // formula to produce item.product
      const { product: subProduct, num: subNum } = consume;

      // to produce num of item.product, need subNum * num / produceNum of subProduct
      const realConsume = {
        product: subProduct,
        num: (subNum * num) / produceNum,
      };

      // recursive call to get primary material
      return toPrimaryMaterial(realConsume);
    });
  };

  return (
    <Box className="m-0 md:m-8 xl:m-16">
      {Object.entries(formulas).map(([produceName, formula]) => {
        const sell = findSellPrice(produceName);
        return (
          <Accordion key={produceName}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ width: "33%", flexShrink: 0 }}>
                {produceName} - {formula[0].formulaName}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>
                {sell?.city} {sell?.price}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className="p-2">
                {sell && <SellInfo product={produceName} sell={sell} getVariationColor={getVariationColor} />}

                {formula.map((formulaOfLevel, formulaOfLevelIndex) => {
                  const consumes = formulaOfLevel.consumes;
                  const consumesPrimary = consumes.flatMap((item) => toPrimaryMaterial(item));

                  return (
                    <Box key={produceName + formulaOfLevel.formulaLevel} className="p-4">
                      <FormulaOfLevelHead
                        formulaOfLevel={formulaOfLevel}
                        formulaOfLevelIndex={formulaOfLevelIndex}
                        produceName={produceName}
                      />
                      <ConsumesInfo
                        consumes={consumes}
                        consumesPrimary={consumesPrimary}
                        formulaOfLevelIndex={formulaOfLevelIndex}
                        produceName={produceName}
                        findBuyPrice={findBuyPrice}
                        getVariationColor={getVariationColor}
                      />
                      <ProduceInfo
                        formulaOfLevel={formulaOfLevel}
                        consumesPrimary={consumesPrimary}
                        findBuyPrice={findBuyPrice}
                        findSellPrice={findSellPrice}
                      />
                      <ProfitInfo
                        formulaOfLevel={formulaOfLevel}
                        consumesPrimary={consumesPrimary}
                        findBuyPrice={findBuyPrice}
                        findSellPrice={findSellPrice}
                      />
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
