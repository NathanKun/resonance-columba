"use client";

import { CITIES, CityName } from "@/data/Cities";
import usePlayerConfig from "@/hooks/usePlayerConfig";
import useSelectedCities from "@/hooks/useSelectedCities";
import { CityGroupedExchanges } from "@/interfaces/route-page";
import {
  calculateAccumulatedValues,
  calculateExchanges,
  getBestRoutesByNumberOfBuyingProductTypes,
  groupeExchangesByCity,
} from "@/utils/route-page-utils";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
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

export default function RoutePage() {
  const { prices, isV2Prices } = useContext(PriceContext);

  /* theme */
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

  /* city selects */
  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities } = useSelectedCities({
    localStorageKey: "routeSelectedCities",
  });

  /* player config */
  const { playerConfig, setPlayerConfig } = usePlayerConfig();

  const onPlayerConfigChange = (field: string, value: any) => {
    setPlayerConfig((prev) => ({ ...prev, [field]: value }));
  };

  const onBargainChange = (field: string, value: string) => {
    if (value && !isNaN(parseFloat(value))) {
      onPlayerConfigChange("bargain", { ...playerConfig.bargain, [field]: parseFloat(value) });
    }
  };

  const onPrestigeChange = (city: CityName, value: string) => {
    if (value && !isNaN(parseInt(value))) {
      onPlayerConfigChange("prestige", { ...playerConfig.prestige, [city]: parseInt(value) });
    }
  };

  /* calculation */
  // when no source city is selected, use all cities as source cities
  const fromCities = useMemo(
    () => (selectedCities.sourceCities.length >= 1 ? [selectedCities.sourceCities[0]] : CITIES),
    [selectedCities.sourceCities]
  );

  // all possible single product exchange routes
  const singleProductExchangesAllTargetCities = useMemo(
    () => calculateExchanges(playerConfig, fromCities, CITIES, prices, isV2Prices),
    [isV2Prices, playerConfig, prices, fromCities]
  );

  // group by fromCity then toCity
  const cityGroupedExchangesAllTargetCities: CityGroupedExchanges = groupeExchangesByCity(
    singleProductExchangesAllTargetCities
  );
  calculateAccumulatedValues(playerConfig, cityGroupedExchangesAllTargetCities);

  // filter out exchanges that are not in selected target cities, for displaying in detailed simulation
  const cityGroupedExchangesSelectedTargetCities: CityGroupedExchanges = {};
  for (const fromCity in cityGroupedExchangesAllTargetCities) {
    cityGroupedExchangesSelectedTargetCities[fromCity] = {};
    for (const toCity in cityGroupedExchangesAllTargetCities[fromCity]) {
      if (selectedCities.targetCities.includes(toCity)) {
        cityGroupedExchangesSelectedTargetCities[fromCity][toCity] =
          cityGroupedExchangesAllTargetCities[fromCity][toCity];
      }
    }
  }

  /* route recommendation */
  const recommendations = [];
  for (let i = 1; i <= 7; i++) {
    recommendations.push(
      getBestRoutesByNumberOfBuyingProductTypes(fromCities, i, cityGroupedExchangesAllTargetCities, playerConfig)
    );
  }
  // console.log(cityGroupedExchangesAllTargetCities, fromCities, recommendations);

  return (
    <ThemeProvider theme={theme}>
      <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <Typography component="h2">科伦巴商会友情提示</Typography>
        </div>
        <div className="flex flex-col">
          <Typography>买价为砍价税后价格。</Typography>
          <Typography>卖价为抬价后价格。</Typography>
          <Typography>利润为税后利润。</Typography>
          <Typography>单票仓位未算入可能存在的角色生活技能的20%加成。</Typography>
          <Typography>利润排序使用的是单位仓位利润，暂不支持单位疲劳利润或单位进货卡利润。</Typography>
        </div>
      </div>
      <Box
        className="m-4"
        sx={{
          "& .MuiFormControl-root": {
            width: "10rem",
            margin: "0.5rem",
          },
        }}
      >
        <Typography>无垠号</Typography>
        <Box className="m-4">
          <TextField
            label="货舱大小"
            type="number"
            size="small"
            value={playerConfig.maxLot}
            onChange={(e) => onPlayerConfigChange("maxLot", e.target.value)}
            inputProps={{ min: 0, max: 9999 }}
          />
        </Box>

        <Typography>声望等级：影响税收与单票商品购入量，目前仅支持8级以上。附属城市声望跟随主城。</Typography>
        <Box className="m-4">
          {/* <NumberInputIntroduction /> */}
          <TextField
            label="修格里城"
            type="number"
            size="small"
            inputProps={{ min: 8, max: 20 }}
            value={playerConfig.prestige["修格里城"]}
            onChange={(e) => onPrestigeChange("修格里城", e.target.value)}
          />
          <TextField
            label="曼德矿场"
            type="number"
            size="small"
            inputProps={{ min: 8, max: 20 }}
            value={playerConfig.prestige["曼德矿场"]}
            onChange={(e) => onPrestigeChange("曼德矿场", e.target.value)}
          />
          <TextField
            label="澄明数据中心"
            type="number"
            size="small"
            inputProps={{ min: 8, max: 20 }}
            value={playerConfig.prestige["澄明数据中心"]}
            onChange={(e) => onPrestigeChange("澄明数据中心", e.target.value)}
          />
          <TextField
            label="七号自由港"
            type="number"
            size="small"
            inputProps={{ min: 8, max: 20 }}
            value={playerConfig.prestige["七号自由港"]}
            onChange={(e) => onPrestigeChange("七号自由港", e.target.value)}
          />
        </Box>

        <Typography>抬价 砍价</Typography>
        <Box className="m-4">
          <TextField
            label="抬价"
            type="number"
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            inputProps={{ min: 0, max: 20, step: 0.1 }}
            value={playerConfig.bargain.raisePercent}
            onChange={(e) => onBargainChange("raisePercent", e.target.value)}
          />
          <TextField
            label="抬价疲劳"
            type="number"
            size="small"
            inputProps={{ min: 0, max: 100 }}
            value={playerConfig.bargain.raiseFatigue}
            onChange={(e) => onBargainChange("raiseFatigue", e.target.value)}
          />
          <TextField
            label="砍价"
            type="number"
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            inputProps={{ min: 0, max: 20, step: 0.1 }}
            value={playerConfig.bargain.bargainPercent}
            onChange={(e) => onBargainChange("bargainPercent", e.target.value)}
          />
          <TextField
            label="砍价疲劳"
            type="number"
            size="small"
            inputProps={{ min: 0, max: 100 }}
            value={playerConfig.bargain.bargainFatigue}
            onChange={(e) => onBargainChange("bargainFatigue", e.target.value)}
          />
        </Box>
      </Box>

      <Box className="m-4">
        <Typography>线路</Typography>
        <Box className="m-4">
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
        </Box>
      </Box>

      <Accordion className="">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
          最优线路推荐
        </AccordionSummary>
        <AccordionDetails>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full">
            <div className="flex justify-between items-center mb-4">
              <Typography component="h3">
                选择
                <Typography fontSize={20} component="strong">
                  一个
                </Typography>
                起始城市查看从这个城市出发的最优线路，或清空起始城市查看整体最优线路。
              </Typography>
            </div>
          </div>

          {recommendations.map((exchangesCombination, index) => {
            return (
              exchangesCombination.length > 0 && (
                <Box key={`recomendation-${index}`} className="m-4">
                  <Typography>购买{index + 1}种商品</Typography>
                  <Box className="m-4">
                    <TableContainer component={Paper}>
                      <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                          <TableRow>
                            <TableCell>起始城市</TableCell>
                            <TableCell>终点城市</TableCell>
                            <TableCell>累计利润</TableCell>
                            <TableCell>进货卡需求</TableCell>
                            <TableCell>商品种类</TableCell>
                            <TableCell>剩余空仓购买</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {exchangesCombination
                            .slice(0, 3) // only show top 3
                            .map((row, index) => (
                              <TableRow
                                key={`recommendation-${index}-${row.fromCity}-${row.toCity}-option-${index}`}
                                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                              >
                                <TableCell>{row.fromCity}</TableCell>
                                <TableCell>{row.toCity}</TableCell>
                                <TableCell>{row.profitOfCombination}</TableCell>
                                <TableCell>{row.restockCount}</TableCell>
                                <TableCell>
                                  {row.choosenExchanges
                                    .filter((exchange) => !exchange.isForFillCargo)
                                    .map((exchange) => exchange.product)
                                    .join(", ")}
                                </TableCell>
                                <TableCell>
                                  {row.choosenExchanges
                                    .filter((exchange) => exchange.isForFillCargo)
                                    .map((exchange) => exchange.product)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )
            );
          })}
        </AccordionDetails>
      </Accordion>
      <Accordion className="mb-12">
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
          详细模拟
        </AccordionSummary>
        <AccordionDetails>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full">
            <div className="flex justify-between items-center mb-4">
              <Typography component="h3">选择一个或多个起始城市以及终点城市，查看所有线路以及最优交易组合。</Typography>
            </div>
            <div className="flex flex-col">
              <Typography>路线中的产品已经按利润进行了排序，排第一的商品为利润最高的商品。</Typography>
              <Typography>累计利润为当前商品以及它上面所有商品的单批利润的和。累计仓位同理。</Typography>
              <Typography>列车长请根据补货意愿从上往下选择一个或多个商品进行购买。</Typography>
            </div>
          </div>

          {Object.keys(cityGroupedExchangesSelectedTargetCities).map((fromCity) => {
            return (
              <div key={fromCity}>
                {Object.keys(cityGroupedExchangesSelectedTargetCities[fromCity]).map((toCity) => {
                  return (
                    <div
                      key={`table-${fromCity}-${toCity}`}
                      className="p-2 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-5xl mx-auto my-2 w-full"
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
                              <TableCell align="right">单票仓位</TableCell>
                              <TableCell align="right">单票利润</TableCell>
                              <TableCell align="right">单票累计利润</TableCell>
                              <TableCell align="right">单票累计仓位</TableCell>
                              <TableCell align="right">补货累计利润</TableCell>
                              <TableCell align="right">补货累计仓位</TableCell>
                              <TableCell align="right">补货次数</TableCell>
                              <TableCell align="right">疲劳</TableCell>
                              <TableCell align="right">单位疲劳利润</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {cityGroupedExchangesSelectedTargetCities[fromCity][toCity].map((row) => (
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
                                <TableCell align="right">{row.restockAccumulatedProfit}</TableCell>
                                <TableCell align="right">{row.restockAccumulatedLot}</TableCell>
                                <TableCell align="right">{row.restockCount}</TableCell>
                                <TableCell align="right">{row.fatigue}</TableCell>
                                <TableCell align="right">{row.profitPerFatigue}</TableCell>
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
        </AccordionDetails>
      </Accordion>
    </ThemeProvider>
  );
}
