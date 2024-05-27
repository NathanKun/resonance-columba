"use client";

import { FORMULAS } from "@/data/Formulas";
// import usePlayerConfig from "@/hooks/usePlayerConfig";
import { CityName } from "@/data/Cities";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Image from "next/image";
import { Fragment, useContext } from "react";
import { PriceContext } from "../price-provider";

interface FormulaProduce {
  product: string;
  num: number;
}

export default function FormulaPage() {
  // const playerConfig = usePlayerConfig();
  const { prices } = useContext(PriceContext);
  const formulas = FORMULAS;
  const cores = ["超载核心", "熔炉核心", "冷凝核心", "负能核心", "混响核心"];

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

  const sellPrices: {
    [product: string]: {
      price: number;
      city: CityName;
    };
  } = {};
  const buyPrices: { [product: string]: number } = {};

  const findBuyPrice = (product: string) => {
    if (buyPrices[product]) {
      return buyPrices[product];
    }

    const buy = prices[product]?.buy;
    if (!buy) {
      console.warn(`no buy price for ${product}`);
      return 0;
    }
    const buyableCity = Object.keys(buy)[0]; // only consider the first city since most products only have one buyable city
    const price = buy[buyableCity].price;

    if (!price) {
      console.warn(`no buy price for ${product} in ${buyableCity}`);
      return 0;
    }

    buyPrices[product] = price;
    return price;
  };

  const findSellPrice = (product: string) => {
    if (sellPrices[product]) {
      return sellPrices[product];
    }

    const sell = prices[product]?.sell;
    if (!sell) {
      console.warn(`no sell price for ${product}`);
      return null;
    }

    const sellableCities = Object.keys(sell);
    let sellCity = sellableCities[0];
    const sellPrice = sellableCities.reduce((acc, city) => {
      const price = sell[city].price;
      if (price && price > acc) {
        sellCity = city;
        return price;
      }
      return acc;
    }, 0);

    sellPrices[product] = {
      price: sellPrice,
      city: sellCity,
    };
    return sellPrices[product];
  };

  return (
    <Box className="m-0 md:m-8 xl:m-16">
      {Object.entries(formulas).map(([name, formula]) => {
        const sell = findSellPrice(name);
        return (
          <Accordion key={name}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ width: "33%", flexShrink: 0 }}>
                {name} - {formula[0].formulaName}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>
                {sell?.city} {sell?.price}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box className="p-2">
                {formula.map((formulaOfLevel) => {
                  const level = <span className="align-middle pr-4">{formulaOfLevel.formulaLevel}级</span>;

                  const fatigue = <Typography>疲劳值：{formulaOfLevel.fatigue}</Typography>;

                  const consumes = formulaOfLevel.consumes;
                  const consumesText = (
                    <Box>
                      <Typography>原料：</Typography>
                      {consumes.map((item) => {
                        return (
                          <Typography key={item.product}>
                            {item.product} * {item.num}
                          </Typography>
                        );
                      })}
                    </Box>
                  );

                  const consumesPrimary = consumes.flatMap((item) => toPrimaryMaterial(item));

                  // check if consumes equals consumesPrimary, if not, show consumesPrimaryText
                  let consumesPrimaryText = <></>;
                  if (JSON.stringify(consumes) !== JSON.stringify(consumesPrimary)) {
                    consumesPrimaryText = (
                      <Box>
                        <Typography>初级原料：</Typography>
                        {consumesPrimary.map((item) => {
                          return (
                            <Typography key={item.product}>
                              {item.product} * {item.num}
                            </Typography>
                          );
                        })}
                      </Box>
                    );
                  }

                  const produce = (
                    <Typography>
                      产出：{formulaOfLevel.produce.product} * {formulaOfLevel.produce.num}
                    </Typography>
                  );

                  const extraProduces = (
                    <Typography>
                      额外概率产出：
                      {formulaOfLevel.extraProduces.product} {formulaOfLevel.extraProduces.min}-
                      {formulaOfLevel.extraProduces.max} ({formulaOfLevel.extraProduces.chance * 100}%)
                    </Typography>
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

                  // materials buy price
                  const consumesPrimaryPrice = consumesPrimary.reduce((acc, item) => {
                    return acc + findBuyPrice(item.product) * item.num;
                  }, 0);

                  // profit
                  let buySellProfitText = <></>;
                  const sell = findSellPrice(formulaOfLevel.produce.product);
                  if (sell) {
                    const { price: sellPrice, city: sellCity } = sell;
                    const profit = sellPrice * formulaOfLevel.produce.num - consumesPrimaryPrice;
                    const singleProfit = profit / formulaOfLevel.produce.num;

                    buySellProfitText = (
                      <Box>
                        <Typography>购买原料价格：{consumesPrimaryPrice}</Typography>
                        <Typography>
                          卖出价格：{sellPrice} {sellCity}
                        </Typography>
                        <Typography>利润：{profit}</Typography>
                        <Typography>单件利润：{singleProfit}</Typography>
                      </Box>
                    );
                  }

                  return (
                    <Box key={name + formulaOfLevel.formulaLevel} className="p-4">
                      <Typography>
                        {level} {unlockCondition}
                      </Typography>
                      {fatigue}
                      {consumesText}
                      {consumesPrimaryText}
                      {produce}
                      {extraProduces}

                      {buySellProfitText}
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
