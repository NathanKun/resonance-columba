"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import useSelectedCities from "@/hooks/useSelectedCities";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { IconButton, ThemeProvider, Typography, createTheme, useMediaQuery } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useContext, useMemo } from "react";
import MultipleSelect from "../components/prices-table/multiple-select";
import { PriceContext } from "../price-provider";
interface BuyConfig {
  fromCity: CityName;
  product: string;
  buyPrice: number;
  buyLot: number;
}

interface Exchange extends BuyConfig {
  toCity: CityName;
  sellPrice: number;
  singleProfit: number;
  lotProfit: number;
}

interface CityProductProfitAccumulatedExchange extends Exchange {
  accumulatedProfit: number;
  loss: boolean; // true if acculated a 0 or negative profit
  accumulatedLot: number;
}

interface CityGroupedExchanges {
  [fromCity: CityName]: {
    [toCity: CityName]: CityProductProfitAccumulatedExchange[];
  };
}

export default function RoutePage() {
  const { prices, isV2Prices } = useContext(PriceContext);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
        typography: {
          fontSize: 12,
        },
      }),
    [prefersDarkMode]
  );

  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities } = useSelectedCities({
    localStorageKey: "routeSelectedCities",
  });

  const getProductsOfCity = (city: CityName) => PRODUCTS.filter((product) => product.buyPrices[city]);

  const calculateExchanges = (fromCities: CityName[], toCities: CityName[]) => {
    const exchanges: Exchange[] = [];

    for (const fromCity of fromCities) {
      const availableProducts = getProductsOfCity(fromCity);
      const buyConfigs: BuyConfig[] = availableProducts
        // group routes by fromCity and toCity
        .flatMap<BuyConfig>((product) => {
          // not support craftable products yet
          if (product.craft) {
            return [];
          }

          // skip if no buy lot data
          const buyLot = product.buyLot?.[fromCity] ?? 0;
          if (buyLot === 0) {
            return [];
          }

          // calculate current buy price
          // skip any product that has missing data
          const currentPriceObject = prices[product.name]?.["buy"]?.[fromCity];
          if (!currentPriceObject) {
            return [];
          }

          let buyPrice = 0;

          // if v2 prices, use the price directly
          if (isV2Prices && currentPriceObject.price) {
            buyPrice = currentPriceObject.price;
          }
          // if v1 prices, calculate the price with variation and base price
          else {
            const currentVariation = currentPriceObject.variation ?? 0;
            const basePrice = product.buyPrices[fromCity] ?? 0;
            buyPrice = Math.round((basePrice * currentVariation) / 100);
          }

          // skip if buy price is 0
          if (buyPrice === 0) {
            return [];
          }

          return [
            {
              product: product.name,
              buyPrice,
              buyLot,
              fromCity,
            } as BuyConfig,
          ];
        });

      for (const toCity of toCities) {
        if (fromCity === toCity) {
          continue;
        }

        const oneRouteExchanges: Exchange[] = buyConfigs.flatMap((config) => {
          const currentPriceObject = prices[config.product]?.["sell"]?.[toCity];
          if (!currentPriceObject) {
            return [];
          }

          let sellPrice = 0;

          if (isV2Prices && currentPriceObject.price) {
            sellPrice = currentPriceObject.price;
          } else {
            const currentVariation = currentPriceObject.variation ?? 0;
            const basePrice = PRODUCTS.find((product) => product.name === config.product)?.sellPrices[toCity] ?? 0;
            sellPrice = Math.round((basePrice * currentVariation) / 100);
          }

          if (sellPrice === 0) {
            return [];
          }

          const singleProfit = Math.round(sellPrice - config.buyPrice);
          const lotProfit = Math.round(singleProfit * config.buyLot);

          return [
            {
              ...config,
              sellPrice,
              singleProfit,
              lotProfit,
              toCity,
            },
          ];
        });

        exchanges.push(...oneRouteExchanges);
      }
    }

    return exchanges;
  };

  // all possible single product exchange routes
  const singleProductExchanges = calculateExchanges(selectedCities.sourceCities, selectedCities.targetCities).sort(
    (a, b) => b.lotProfit - a.lotProfit
  );

  // group by fromCity then toCity
  const cityGroupedExchanges = singleProductExchanges.reduce<CityGroupedExchanges>(
    (acc: CityGroupedExchanges, exchange: Exchange) => {
      if (!acc[exchange.fromCity]) {
        acc[exchange.fromCity] = {};
      }

      if (!acc[exchange.fromCity][exchange.toCity]) {
        acc[exchange.fromCity][exchange.toCity] = [];
      }

      acc[exchange.fromCity][exchange.toCity].push({
        ...exchange,
        accumulatedProfit: 0,
        loss: false,
        accumulatedLot: 0,
      });
      return acc;
    },
    {}
  );

  // sort each toCity exchanges by lotProfit, then calculate accumulatedProfit
  for (const fromCity in cityGroupedExchanges) {
    for (const toCity in cityGroupedExchanges[fromCity]) {
      cityGroupedExchanges[fromCity][toCity] = cityGroupedExchanges[fromCity][toCity].sort(
        (a, b) => b.lotProfit - a.lotProfit
      );

      let accumulatedProfit = 0;
      let accumulatedLot = 0;
      for (let i = 0; i < cityGroupedExchanges[fromCity][toCity].length; i++) {
        const exchange = cityGroupedExchanges[fromCity][toCity][i];

        accumulatedProfit += exchange.lotProfit;
        accumulatedLot += exchange.buyLot;

        exchange.accumulatedProfit = accumulatedProfit;
        exchange.loss = exchange.lotProfit <= 0;
        exchange.accumulatedLot = accumulatedLot;
      }
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Typography className="mx-4 my-2">利润计算：无税收 无抬价 无议价 无进货卡。个性化利润计算开发中。</Typography>
      <Typography className="mx-4 my-2">路线中的产品已经按按单批利润进行了排序。</Typography>
      <Typography className="mx-4 my-2">累计利润为当前商品以及它上面所有商品的单批利润的和。累计仓位同理。</Typography>

      <div className="m-4">
        <MultipleSelect
          label="原产地"
          name="sourceCities"
          allOptions={CITIES}
          selectedOptions={selectedCities.sourceCities}
          handleChange={(selected: CityName[]) => setSourceCities(selected)}
        />
        <MultipleSelect
          label="目标城市"
          name="targetCities"
          allOptions={CITIES}
          selectedOptions={selectedCities.targetCities}
          handleChange={(selected: CityName[]) => setTargetCities(selected)}
        />
        <IconButton onClick={switchSourceAndTargetCities} size="small">
          <SyncAltIcon />
        </IconButton>
      </div>

      {Object.keys(cityGroupedExchanges).map((fromCity) => {
        return (
          <div key={fromCity}>
            {Object.keys(cityGroupedExchanges[fromCity]).map((toCity) => {
              return (
                <div
                  key={`table-${fromCity}-${toCity}`}
                  className="p-2 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto my-2 w-full"
                >
                  <Typography className="my-4">
                    {fromCity}
                    <RouteOutlinedIcon className="mx-2" />
                    {toCity}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          <TableCell>产品</TableCell>
                          <TableCell align="right">买价</TableCell>
                          <TableCell align="right">卖价</TableCell>
                          <TableCell align="right">数量</TableCell>
                          <TableCell align="right">单票利润</TableCell>
                          <TableCell align="right">累计利润</TableCell>
                          <TableCell align="right">累计仓位</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cityGroupedExchanges[fromCity][toCity].map((row) => (
                          <TableRow
                            key={`row-${row.product}-${row.fromCity}-${row.toCity}`}
                            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                            className={row.loss ? "line-through" : ""}
                          >
                            <TableCell component="th" scope="row">
                              {row.product}
                            </TableCell>
                            <TableCell align="right">{row.buyPrice}</TableCell>
                            <TableCell align="right">{row.sellPrice}</TableCell>
                            <TableCell align="right">{row.buyLot}</TableCell>
                            <TableCell align="right">{row.lotProfit}</TableCell>
                            <TableCell align="right">{row.accumulatedProfit}</TableCell>
                            <TableCell align="right">{row.accumulatedLot}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              );
            })}
          </div>
        );
      })}
    </ThemeProvider>
  );
}
