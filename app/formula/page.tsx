"use client";

import { FORMULAS } from "@/data/Formulas";
// import usePlayerConfig from "@/hooks/usePlayerConfig";
import { CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Chip, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Image from "next/image";
import { Fragment, useContext } from "react";
import FatigueIcon from "../components/icons/FatigueIcon";
import { PriceContext } from "../price-provider";

interface FormulaProduce {
  product: string;
  num: number;
}

interface PriceItem {
  price: number;
  city: CityName;
  variation: number;
}

interface PriceItemCache {
  [product: string]: PriceItem;
}

export default function FormulaPage() {
  // const playerConfig = usePlayerConfig();
  const { prices } = useContext(PriceContext);
  const formulas = FORMULAS;
  const cores = ["超载核心", "熔炉核心", "冷凝核心", "负能核心", "混响核心"];

  const sellPrices: PriceItemCache = {};
  const buyPrices: PriceItemCache = {};

  const findBuyPrice = (product: string) => {
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

  const findSellPrice = (product: string) => {
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

  const getVariationColor = (variation: number) => {
    if (variation > 100) {
      return "variationHigh";
    } else if (variation === 100) {
      return "variationMedium";
    } else {
      return "variationLow";
    }
  };

  const MaterialBlock = (item: FormulaProduce, showVariation: boolean) => {
    const buy = showVariation ? findBuyPrice(item.product) : null;
    const variation = buy?.variation;
    return (
      <Box key={item.product} className="inline-block pr-4">
        <Typography component="span" className="align-middle">
          {item.product}
        </Typography>
        <Chip label={item.num} size="small" className="mx-1" />
        {variation && <Chip label={`${variation}%`} size="small" color={getVariationColor(variation)} />}
      </Box>
    );
  };

  const TheoryHighestSellPriceBlock = (product: string, currentHighestPrice: number) => {
    const pdt = PRODUCTS.find((item) => item.name === product);
    if (!pdt) {
      return <></>;
    }

    const sellableCities = Object.keys(pdt.sellPrices);
    if (!sellableCities.length) {
      return <></>;
    }

    let highestBasePriceCity = null;
    let highestBasePrice = 0;
    for (const city of sellableCities) {
      const price = pdt.sellPrices[city] ?? 0;
      if (price > highestBasePrice) {
        highestBasePrice = price;
        highestBasePriceCity = city;
      }
    }

    if (highestBasePrice === 0) {
      return <></>;
    }

    const theoryHighestVariation = 1.2;
    const theoryHighestPrice = Math.round(highestBasePrice * theoryHighestVariation);
    const currentPricePercentage = Math.round((currentHighestPrice / theoryHighestPrice) * 100);

    return (
      <Fragment>
        <Typography component="span">理论最高价格：</Typography>
        <Typography component="span" className="mx-1">
          {highestBasePriceCity}
        </Typography>
        <Typography component="span" className="mx-1">
          {theoryHighestPrice}
        </Typography>
        <Typography>当前价格占比：{currentPricePercentage}%</Typography>
      </Fragment>
    );
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
                {sell && (
                  <Box>
                    <Box>
                      <Typography component="span" className="align-middle">
                        卖出价格：
                      </Typography>
                      <Typography component="span" className="mx-1 align-middle">
                        {sell.city}
                      </Typography>
                      <Typography component="span" className="mx-1 align-middle">
                        {sell.price}
                      </Typography>
                      <Chip
                        label={`${sell.variation}%`}
                        size="small"
                        color={getVariationColor(sell.variation)}
                        className="mx-1"
                      />
                    </Box>
                    <Box>{TheoryHighestSellPriceBlock(produceName, sell.price)}</Box>
                  </Box>
                )}

                {formula.map((formulaOfLevel) => {
                  const level = <span className="align-middle pr-4">{formulaOfLevel.formulaLevel}级</span>;

                  const fatigue = (
                    <span className="align-middle pr-4">
                      <FatigueIcon className="align-middle mr-1" />
                      <span className="align-middle">{formulaOfLevel.fatigue}</span>
                    </span>
                  );

                  const unlockCondition = (
                    <span>
                      {cores.map((core) => {
                        const condition = (formulaOfLevel.unlockCondition as any)[core] as number;
                        if (condition > 1) {
                          return (
                            <Fragment key={core}>
                              <Image
                                src={`/engine-cores/${core}.png`}
                                alt={core}
                                width={24}
                                height={24}
                                className="align-middle"
                              />
                              <span className="align-middle pl-1 pr-2">Lv{condition}</span>
                            </Fragment>
                          );
                        }
                        return <></>;
                      })}
                    </span>
                  );

                  const consumes = formulaOfLevel.consumes;
                  const consumesText = (
                    <Fragment>
                      <Typography>原料：</Typography>
                      {consumes.map((item) => {
                        return MaterialBlock(item, false);
                      })}
                    </Fragment>
                  );

                  const consumesPrimary = consumes.flatMap((item) => toPrimaryMaterial(item));
                  const consumesPrimaryText = (
                    <Fragment>
                      <Typography>初级原料：</Typography>
                      {consumesPrimary.map((item) => {
                        return MaterialBlock(item, true);
                      })}
                    </Fragment>
                  );

                  const produce = (
                    <Fragment>
                      <Typography>产出：</Typography>
                      <Typography component="span" className="align-middle">
                        {formulaOfLevel.produce.product}
                      </Typography>
                      <Chip label={formulaOfLevel.produce.num} size="small" className="mx-1" />
                    </Fragment>
                  );

                  const extraProduces = (
                    <Fragment>
                      <Typography>额外概率产出：</Typography>
                      <Typography component="span" className="align-middle">
                        {formulaOfLevel.extraProduces.product}
                      </Typography>
                      <Chip
                        label={`${formulaOfLevel.extraProduces.min}-${formulaOfLevel.extraProduces.max}`}
                        size="small"
                        className="mx-1"
                      />
                      <Chip label={`${formulaOfLevel.extraProduces.chance * 100}%`} size="small" className="mx-1" />
                    </Fragment>
                  );

                  // profit
                  let buySellProfitText = <></>;
                  const sell = findSellPrice(formulaOfLevel.produce.product);
                  if (sell) {
                    // materials buy price
                    const consumesPrimaryPrice = Math.round(
                      consumesPrimary.reduce((acc, item) => {
                        const buy = findBuyPrice(item.product);
                        if (buy) {
                          const { price } = buy;
                          return acc + price * item.num;
                        } else {
                          console.warn(`no buy price for ${item.product}`);
                          return acc;
                        }
                      }, 0)
                    );

                    // sell price
                    const { price: sellPrice } = sell;

                    // profit
                    const profit = Math.round(sellPrice * formulaOfLevel.produce.num) - consumesPrimaryPrice;
                    const singleProfit = Math.round(profit / formulaOfLevel.produce.num);

                    // extra produces profit
                    const extraProducesAvg =
                      (formulaOfLevel.extraProduces.chance *
                        (formulaOfLevel.extraProduces.max + formulaOfLevel.extraProduces.min)) /
                      2;
                    const extraProducesProfit = Math.round(extraProducesAvg * sellPrice);
                    const totalProfit = profit + extraProducesProfit;

                    buySellProfitText = (
                      <Fragment>
                        <Typography>购买原料价格：{consumesPrimaryPrice}</Typography>
                        <Box className="my-1">
                          <Typography>利润：{totalProfit}</Typography>
                          <Typography className="ml-4">固定产出利润：{profit}</Typography>
                          <Typography className="ml-4">额外产出期望利润：{extraProducesProfit}</Typography>
                          <Typography>单件利润：{singleProfit}</Typography>
                          <Typography>额外产出期望利润：{extraProducesProfit}</Typography>
                        </Box>
                      </Fragment>
                    );
                  }

                  return (
                    <Box key={produceName + formulaOfLevel.formulaLevel} className="p-4">
                      <Typography>
                        {level} {fatigue} {unlockCondition}
                      </Typography>
                      <Box className="my-2">{consumesText}</Box>
                      <Box className="my-2">{consumesPrimaryText}</Box>
                      <Box className="my-2">
                        {produce}
                        {extraProduces}
                      </Box>
                      <Box className="my-2">{buySellProfitText}</Box>
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
