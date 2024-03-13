"use client";

import { CITIES, CityName } from "@/data/Cities";
import usePlayerConfig from "@/hooks/usePlayerConfig";
import useSelectedCities from "@/hooks/useSelectedCities";
import { CityGroupedExchanges, OneGraphRouteDialogData, OnegraphRecommendations } from "@/interfaces/route-page";
import {
  calculateAccumulatedValues,
  calculateExchanges,
  getBestRoutesByNumberOfBuyingProductTypes,
  groupeExchangesByCity,
} from "@/utils/route-page-utils";
import { Button } from "@mui/base/Button";
import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import {
  Box,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import { useContext, useMemo, useState } from "react";
import MultipleSelect from "../components/prices-table/multiple-select";
import OneGraphRouteDialog from "../components/route-page/onegraph-route-dialog";
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

  /* tabs */
  const [tabIndex, setTabIndex] = useState(0);

  /* city selects */
  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities } = useSelectedCities({
    localStorageKey: "routeSelectedCities",
  });
  const [selectedCityForReco, setSelectedCityForReco] = useState<CityName>("any");

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
  // all possible single product exchange routes
  const singleProductExchangesAllTargetCities = useMemo(
    () => calculateExchanges(playerConfig, CITIES, CITIES, prices, isV2Prices),
    [isV2Prices, playerConfig, prices]
  );

  // group by fromCity then toCity
  const cityGroupedExchangesAllTargetCities: CityGroupedExchanges = useMemo(() => {
    const results = groupeExchangesByCity(singleProductExchangesAllTargetCities);
    calculateAccumulatedValues(playerConfig, results);
    return results;
  }, [playerConfig, singleProductExchangesAllTargetCities]);

  // filter out exchanges that are not in selected source / target cities, for displaying in detailed simulation
  const cityGroupedExchangesSelectedTargetCities: CityGroupedExchanges = useMemo(() => {
    const results: any = {};
    for (const fromCity in cityGroupedExchangesAllTargetCities) {
      if (!selectedCities.sourceCities.includes(fromCity)) continue;

      results[fromCity] = {};
      for (const toCity in cityGroupedExchangesAllTargetCities[fromCity]) {
        if (!selectedCities.targetCities.includes(toCity)) continue;
        results[fromCity][toCity] = cityGroupedExchangesAllTargetCities[fromCity][toCity];
      }
    }

    return results as CityGroupedExchanges;
  }, [cityGroupedExchangesAllTargetCities, selectedCities.sourceCities, selectedCities.targetCities]);

  /* onegraph route recommendation */
  const [onegraphGoAndReturn, setOnegraphGoAndReturn] = useState(false);
  const [onegraphRouteDialogOpen, setOnegraphRouteDialogOpen] = useState(false);
  const [onegraphRouteDialogData, setOnegraphRouteDialogData] = useState<OneGraphRouteDialogData>();
  const showOneGraphRouteDialog = (fromCity: CityName, toCity: CityName) => {
    const onegraphData = onegraphRecommendations[fromCity][toCity];
    setOnegraphRouteDialogData({ fromCity, toCity, onegraphData: onegraphData });
    setOnegraphRouteDialogOpen(true);
  };
  const [onegraphMaxRestock, setMaxRestock] = useState(5);
  const onegraphRecommendations = useMemo<OnegraphRecommendations>(() => {
    const results: OnegraphRecommendations = {};
    const findOneGraphExchanges = (fromCity: CityName, toCity: CityName) => {
      const exchanges = cityGroupedExchangesAllTargetCities[fromCity][toCity];

      // find the most profitable exchanges which are just under maxRestock,
      // the combination from the first to the choosenExchangeIndex
      // is the best combination for maxRestock wanted
      if (exchanges.length === 0) {
        return undefined;
      }

      let choosenExchangeIndex = null;
      for (let i = exchanges.length - 1; i >= 0; i--) {
        if (exchanges[i].loss) {
          continue;
        }
        if (exchanges[i].restockCount <= onegraphMaxRestock) {
          choosenExchangeIndex = i;
        } else {
          break;
        }
      }

      // if no exchanges are under maxRestock, skip
      if (choosenExchangeIndex === null) {
        return undefined;
      }

      return exchanges.slice(0, choosenExchangeIndex + 1);
    };
    for (const fromCity in cityGroupedExchangesAllTargetCities) {
      for (const toCity in cityGroupedExchangesAllTargetCities[fromCity]) {
        if (!results[fromCity]) {
          results[fromCity] = {};
        }
        const goExchanges = findOneGraphExchanges(fromCity, toCity);
        if (!goExchanges) {
          continue;
        }
        results[fromCity][toCity] = {
          goExchanges,
          returnExchanges: onegraphGoAndReturn ? findOneGraphExchanges(toCity, fromCity) : undefined,
        };
      }
    }

    return results;
  }, [cityGroupedExchangesAllTargetCities, onegraphMaxRestock, onegraphGoAndReturn]);
  const topProfits = useMemo(() => {
    const profits = [];
    for (const fromCity in onegraphRecommendations) {
      for (const toCity in onegraphRecommendations[fromCity]) {
        const goExchanges = onegraphRecommendations[fromCity][toCity].goExchanges;
        const lastExchange = goExchanges[goExchanges.length - 1];
        let profit = 0;
        if (lastExchange) {
          profit = lastExchange.restockAccumulatedProfit;
        }

        // go and return: sum up the profit of the last return exchange
        if (onegraphGoAndReturn) {
          const returnExchanges = onegraphRecommendations[fromCity][toCity].returnExchanges;
          if (returnExchanges && returnExchanges.length > 0) {
            const lastReturnExchange = returnExchanges[returnExchanges.length - 1];
            if (lastReturnExchange) {
              profit += lastReturnExchange.restockAccumulatedProfit;
            }
          }
        }

        if (profit > 0) {
          profits.push(profit);
        }
      }
    }
    return [...new Set(profits)].sort((a, b) => b - a).slice(0, 3);
  }, [onegraphGoAndReturn, onegraphRecommendations]);

  /* detailed route recommendation */
  const detailedRecommendations = useMemo(() => {
    const results = [];
    for (let i = 1; i <= 7; i++) {
      results.push(
        getBestRoutesByNumberOfBuyingProductTypes(
          selectedCityForReco,
          i,
          cityGroupedExchangesAllTargetCities,
          playerConfig
        )
      );
    }
    return results;
  }, [cityGroupedExchangesAllTargetCities, playerConfig, selectedCityForReco]);

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={(_e: React.SyntheticEvent, newIndex: number) => setTabIndex(newIndex)}
            aria-label="basic tabs example"
          >
            <Tab label="一图流" />
            <Tab label="个性化设置" />
            <Tab label="最优线路详细信息" />
            <Tab label="硬核模拟" />
            <Tab label="计算说明" />
          </Tabs>
        </Box>

        {/* 一图流 */}
        <div role="tabpanel" hidden={tabIndex !== 0}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full">
            <div className="flex flex-col">
              <Typography>
                <Typography component="strong" fontSize={18}>
                  点击
                </Typography>
                表格中的数值可查看路线详情。
              </Typography>
              <Typography>强烈建议先前往个性化设置页面，填写货舱大小以及声望等级，以获得更准确的结果。</Typography>
            </div>
          </div>

          <Stack spacing={2} direction="row" className="w-1/2 mx-auto mb-2" alignItems="center">
            <Typography sx={{ textWrap: "nowrap" }}>希望最多进货次数</Typography>
            <Slider
              aria-label="希望最多进货次数"
              value={onegraphMaxRestock}
              onChange={(_e, newVal) => setMaxRestock(newVal as number)}
              min={0}
              max={30}
              size="small"
            />
            <Typography>{onegraphMaxRestock}</Typography>

            <FormControlLabel
              className="w-60"
              control={
                <Switch
                  checked={onegraphGoAndReturn}
                  onChange={(e) => {
                    setOnegraphGoAndReturn(e.target.checked);
                  }}
                />
              }
              label={<Typography>来回</Typography>}
            />
          </Stack>

          <TableContainer
            component={Paper}
            className="w-full bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-6xl mx-auto my-4"
          >
            <Table
              sx={{
                width: "auto",
                margin: "4rem auto",
                "& th, & td": {
                  border: "1px solid gray",
                  padding: "0.25rem",
                  color: prefersDarkMode ? "white" : "black",
                },
                "& td": {
                  width: "6rem",
                },
              }}
            >
              <TableHead>
                {/** header 1 - spanning 终点 cell */}
                <TableRow>
                  <TableCell align="center" colSpan={CITIES.length + 2}>
                    终点
                  </TableCell>
                </TableRow>
                {/** header 2 - city cells */}
                <TableRow>
                  <TableCell colSpan={2}></TableCell>
                  {CITIES.map((city) => (
                    <TableCell key={city} align="center">
                      {city}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {CITIES.map((fromCity, index) => (
                  <TableRow key={`onegraph-row-${fromCity}`}>
                    {/** spaning 起点 cell */}
                    {index === 0 && (
                      <TableCell component="th" rowSpan={CITIES.length}>
                        起点
                      </TableCell>
                    )}

                    {/** city name */}
                    <TableCell component="th">{fromCity}</TableCell>

                    {/** profit cells */}
                    {CITIES.map((toCity) => {
                      const key = `onegraph-row-${fromCity}-cell-${toCity}`;
                      const goExchanges = onegraphRecommendations[fromCity]?.[toCity]?.goExchanges;
                      const lastExchange = goExchanges?.[goExchanges.length - 1];
                      if (!lastExchange) {
                        return (
                          <TableCell key={key} align="center">
                            -
                          </TableCell>
                        );
                      }

                      let profit = lastExchange.restockAccumulatedProfit;
                      if (onegraphGoAndReturn) {
                        const returnExchanges = onegraphRecommendations[fromCity]?.[toCity].returnExchanges;
                        if (returnExchanges && returnExchanges.length > 0) {
                          const lastReturnExchange = returnExchanges[returnExchanges.length - 1];
                          if (lastReturnExchange) {
                            profit += lastReturnExchange.restockAccumulatedProfit;
                          }
                        }
                      }

                      const percentageToMax = Math.round((profit / topProfits[0] ?? 1) * 100);
                      let RankIcon, textClass;
                      if (profit === topProfits[0]) {
                        RankIcon = <LooksOneIcon className="text-base" />;
                        textClass = "font-black";
                      } else if (profit === topProfits[1]) {
                        RankIcon = <LooksTwoIcon className="text-base" />;
                        textClass = "font-bold";
                      } else if (profit === topProfits[2]) {
                        RankIcon = <Looks3Icon className="text-base" />;
                        textClass = "font-medium";
                      } else {
                        RankIcon = <></>;
                        textClass = "";
                      }
                      return (
                        <TableCell
                          key={key}
                          align="center"
                          sx={{
                            "&": {
                              background: `linear-gradient(90deg, ${
                                prefersDarkMode ? "darkred" : "lightcoral"
                              } ${percentageToMax}%, #0000 ${percentageToMax}%)`,
                            },
                          }}
                        >
                          <Button
                            className="w-full h-full show-onegraph-route-dialog-btn"
                            data-onegraph-route-dialog-btn={`${fromCity}-${toCity}`}
                            onClick={() => showOneGraphRouteDialog(fromCity, toCity)}
                          >
                            {RankIcon}
                            <span className={`align-middle ${textClass}`}>{profit}</span>
                          </Button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <OneGraphRouteDialog
            open={onegraphRouteDialogOpen}
            setOpen={setOnegraphRouteDialogOpen}
            data={onegraphRouteDialogData}
          />
        </div>

        {/* 个性化设置 */}
        <div role="tabpanel" hidden={tabIndex !== 1}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto my-4 w-full">
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
          </div>
        </div>

        {/* 最优线路详细信息 */}
        <div role="tabpanel" hidden={tabIndex !== 2}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full">
            <div className="flex justify-between items-center mb-4">
              <Typography component="h3">
                选择一个起始城市查看从这个城市出发的最优线路，或选择 任意 查看整体最优线路。
              </Typography>
            </div>
            <div className="flex flex-col">
              <Typography>需要填写个性化设置。</Typography>
              <Typography>选择购买的商品种类越多，所需进货书越少，但利润一般也越低。</Typography>
            </div>
          </div>

          <Box className="m-4">
            <FormControl fullWidth>
              <InputLabel id="select-source-city-for-reco-lebel">起始城市</InputLabel>
              <Select
                labelId="select-source-city-for-reco-lebel"
                id="select-source-city-for-reco"
                value={selectedCityForReco}
                label="起始城市"
                size="small"
                onChange={(e) => setSelectedCityForReco(e.target.value as CityName)}
              >
                {CITIES.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
                <MenuItem key="any" value="any">
                  任意
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {detailedRecommendations
            .slice()
            .reverse()
            .map((exchangesCombination, index) => {
              return (
                exchangesCombination.length > 0 && (
                  <Box key={`recomendation-${index}`} className="m-4">
                    <Typography>购买{detailedRecommendations.length - index}种商品</Typography>
                    <Box className="m-4">
                      <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                          <TableHead>
                            <TableRow>
                              <TableCell>起始城市</TableCell>
                              <TableCell>终点城市</TableCell>
                              <TableCell>累计利润</TableCell>
                              <TableCell>进货书需求</TableCell>
                              <TableCell>购买的商品种类</TableCell>
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
        </div>

        {/* 详细模拟 */}
        <div role="tabpanel" hidden={tabIndex !== 3}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full">
            <div className="flex justify-between items-center mb-4">
              <Typography component="h3">选择一个或多个起始城市以及终点城市，查看所有线路以及最优交易组合。</Typography>
            </div>
            <div className="flex flex-col">
              <Typography>需要填写个性化设置。</Typography>
              <Typography>路线中的产品已经按利润进行了排序，排第一的商品为利润最高的商品。</Typography>
              <Typography>累计利润为当前商品以及它上面所有商品的单批利润的和。累计仓位同理。</Typography>
              <Typography>列车长请根据补货意愿从上往下选择一个或多个商品进行购买。</Typography>
            </div>
          </div>

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
        </div>

        {/* 计算说明 */}
        <div role="tabpanel" hidden={tabIndex !== 4}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full">
            <div className="flex flex-col">
              <Typography>买价为砍价税后价格。</Typography>
              <Typography>卖价为抬价后价格。</Typography>
              <Typography>利润为税后利润。</Typography>
              <Typography>单票仓位未算入可能存在的角色生活技能的20%加成。</Typography>
              <Typography>利润排序使用的是单位仓位利润，暂不支持单位疲劳利润或单位进货卡利润。</Typography>
            </div>
          </div>
        </div>
      </Box>
    </ThemeProvider>
  );
}
