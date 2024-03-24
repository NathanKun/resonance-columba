"use client";

import { CITIES, CityName } from "@/data/Cities";
import usePlayerConfig from "@/hooks/usePlayerConfig";
import useSelectedCities from "@/hooks/useSelectedCities";
import { CityGroupedExchanges, OneGraphRouteDialogDataV2, OnegraphRecommendationsV2 } from "@/interfaces/route-page";
import {
  calculateAccumulatedValues,
  calculateExchanges,
  calculateOneGraphBuyCombinations,
  getBestRoutesByNumberOfBuyingProductTypes,
  getOneGraphRecommendation,
  groupeExchangesByCity,
} from "@/utils/route-page-utils";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
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
import { sendGTMEvent } from "@next/third-parties/google";
import { useContext, useMemo, useState } from "react";
import MultipleSelect from "../components/prices-table/multiple-select";
import BargainInputs from "../components/route-page/bargain-inputs";
import NumberInput from "../components/route-page/number-input";
import OneGraphRouteDialogV2 from "../components/route-page/onegraph-route-dialog-v2";
import RoleSkillSelects from "../components/route-page/role-skill-selects";
import SyncPlayerConfigPanel from "../components/route-page/sync-player-config-panel";
import { PriceContext } from "../price-provider";

export default function RoutePage() {
  const { prices } = useContext(PriceContext);

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
  const tabNames = ["一图流", "个性化设置", "最优线路详细信息", "硬核模拟", "计算说明"];
  const onTabChange = (newIndex: number) => {
    setTabIndex(newIndex);
    trackTabChange(newIndex);
  };

  /* city selects */
  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities } = useSelectedCities({
    localStorageKey: "routeSelectedCities",
  });
  const [selectedCityForReco, setSelectedCityForReco] = useState<CityName>("any");

  /* player config */
  const { playerConfig, setPlayerConfig, setRoleResonance, downloadPlayerConfig, uploadPlayerConfig } =
    usePlayerConfig();

  const onPlayerConfigChange = (field: string, value: any) => {
    setPlayerConfig((prev) => ({ ...prev, [field]: value }));
  };

  const onGoBargainChange = (field: string, value: number) => {
    if (!isNaN(value)) {
      onPlayerConfigChange("bargain", { ...playerConfig.bargain, [field]: value });
    }
  };

  const onReturnBargainChange = (field: string, value: number) => {
    if (!isNaN(value)) {
      onPlayerConfigChange("returnBargain", { ...playerConfig.returnBargain, [field]: value });
    }
  };

  const onPrestigeChange = (city: CityName, value: number) => {
    if (!isNaN(value)) {
      onPlayerConfigChange("prestige", { ...playerConfig.prestige, [city]: value });
    }
  };

  const oneOnegraphPlayerConfigChange = (field: string, value: any) => {
    onPlayerConfigChange("onegraph", { ...playerConfig.onegraph, [field]: value });
  };

  /* calculation */
  // all possible single product exchange routes
  const singleProductExchangesAllTargetCities = useMemo(
    () => calculateExchanges(playerConfig, CITIES, CITIES, prices),
    [prices, playerConfig]
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
  const {
    goAndReturn: onegraphGoAndReturn,
    maxRestock: onegraphMaxRestock,
    showFatigue: onegraphShowFatigue,
  } = playerConfig.onegraph;
  const setOnegraphGoAndReturn = (value: boolean) => oneOnegraphPlayerConfigChange("goAndReturn", value);
  const setMaxRestock = (value: number) => oneOnegraphPlayerConfigChange("maxRestock", value);
  const setOnegraphShowFatigue = (value: boolean) => oneOnegraphPlayerConfigChange("showFatigue", value);
  const [onegraphRouteDialogData, setOnegraphRouteDialogData] = useState<OneGraphRouteDialogDataV2>();
  const [onegraphRouteDialogOpen, setOnegraphRouteDialogOpen] = useState(false);
  const [onegraphGoBarginDisabled, setOnegraphGoBarginDisabled] = useState(false);
  const [onegraphRtBarginDisabled, setOnegraphRtBarginDisabled] = useState(false);
  // no brain brute force aller-retour calculation :)
  const onegraphBuyCombinationsGo = useMemo(
    () =>
      calculateOneGraphBuyCombinations(
        prices,
        playerConfig.maxLot,
        playerConfig.bargain,
        playerConfig.prestige,
        playerConfig.roles,
        onegraphGoBarginDisabled
      ),
    [
      prices,
      playerConfig.maxLot,
      playerConfig.bargain,
      playerConfig.prestige,
      playerConfig.roles,
      onegraphGoBarginDisabled,
    ]
  );
  const onegraphBuyCombinationsRt = useMemo(
    () =>
      calculateOneGraphBuyCombinations(
        prices,
        playerConfig.maxLot,
        playerConfig.returnBargain,
        playerConfig.prestige,
        playerConfig.roles,
        onegraphRtBarginDisabled
      ),
    [
      prices,
      playerConfig.maxLot,
      playerConfig.returnBargain,
      playerConfig.prestige,
      playerConfig.roles,
      onegraphRtBarginDisabled,
    ]
  );
  const onegraphRecommendations = useMemo(() => {
    const results: OnegraphRecommendationsV2 = {};
    for (const fromCity of CITIES) {
      results[fromCity] = {};
      for (const toCity of CITIES) {
        if (fromCity === toCity) continue;
        let reco = getOneGraphRecommendation(onegraphMaxRestock, false, fromCity, toCity, onegraphBuyCombinationsGo);
        if (!reco || reco.length === 0) continue;
        const simpleGo = reco[0];

        reco = getOneGraphRecommendation(
          onegraphMaxRestock,
          true,
          fromCity,
          toCity,
          onegraphBuyCombinationsGo,
          onegraphBuyCombinationsRt
        );

        if (!reco || reco.length !== 2) continue;
        const goAndReturn = reco;

        results[fromCity][toCity] = {
          simpleGo,
          goAndReturn,
        };
      }
    }

    console.debug(onegraphBuyCombinationsGo, onegraphBuyCombinationsRt, results);

    return results;
  }, [onegraphBuyCombinationsGo, onegraphMaxRestock, onegraphBuyCombinationsRt]);
  const topProfits: { go: number[]; goAndReturn: number[] } = useMemo(() => {
    let goProfits = [];
    let goAndReturnProfits = [];
    for (const fromCity in onegraphRecommendations) {
      for (const toCity in onegraphRecommendations[fromCity]) {
        const reco = onegraphRecommendations[fromCity][toCity];
        if (!reco || !reco.simpleGo || reco.goAndReturn?.length !== 2) continue;
        goProfits.push(reco.simpleGo.profit);
        goAndReturnProfits.push(reco.goAndReturn[0].profit + reco.goAndReturn[1].profit);
      }
    }
    goProfits = [...new Set(goProfits)].sort((a, b) => b - a).slice(0, 3);
    goAndReturnProfits = [...new Set(goAndReturnProfits)].sort((a, b) => b - a).slice(0, 3);
    return { go: goProfits, goAndReturn: goAndReturnProfits };
  }, [onegraphRecommendations]);
  const showOneGraphRouteDialog = (fromCity: CityName, toCity: CityName) => {
    setOnegraphRouteDialogData({
      stats: onegraphRecommendations[fromCity][toCity],
      playerConfig,
      fromCity,
      toCity,
      goBargainDisabled: onegraphGoBarginDisabled,
      rtBargainDisabled: onegraphRtBarginDisabled,
    });
    setOnegraphRouteDialogOpen(true);
    trackOnegraphDialogBtnClick(fromCity, toCity);
  };

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

  /* tracking */
  const trackTabChange = (index: number) => {
    sendGTMEvent({ event: "route_page_tab_change", label: tabNames[index] });
  };

  const trackOnegraphDialogBtnClick = (fromCity: string, toCity: string) => {
    sendGTMEvent({ event: "onegraph_route_dialog_open", label: `${fromCity} to ${toCity}` });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={(_e: React.SyntheticEvent, newIndex: number) => onTabChange(newIndex)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {tabNames.map((tabName, index) => (
              <Tab label={tabName} key={`tab-${index}`} />
            ))}
          </Tabs>
        </Box>

        {/* 一图流 */}
        <div role="tabpanel" hidden={tabIndex !== 0}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
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

          <Box>
            <Box alignItems="center" className="mb-2 flex justify-center flex-wrap">
              <Typography sx={{ textWrap: "nowrap" }}>总进货次数</Typography>
              <Box className="flex justify-center">
                <IconButton
                  onClick={() => {
                    if (onegraphMaxRestock > 0) {
                      setMaxRestock(onegraphMaxRestock - 1);
                    }
                  }}
                  size="small"
                >
                  <ArrowLeftIcon />
                </IconButton>
                <Slider
                  className="w-32 sm:w-60"
                  aria-label="总进货次数"
                  value={onegraphMaxRestock}
                  onChange={(_e, newVal) => setMaxRestock(newVal as number)}
                  min={0}
                  max={50}
                  size="small"
                />
                <IconButton
                  onClick={() => {
                    if (onegraphMaxRestock < 30) {
                      setMaxRestock(onegraphMaxRestock + 1);
                    }
                  }}
                  size="small"
                >
                  <ArrowRightIcon />
                </IconButton>
              </Box>
              <Typography>{onegraphMaxRestock}</Typography>
            </Box>

            <Stack spacing={2} direction="row" alignItems="center" className="mb-2 justify-center">
              <FormControlLabel
                className="w-30"
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

              <FormControlLabel
                className="w-30"
                control={
                  <Switch
                    checked={onegraphShowFatigue}
                    onChange={(e) => {
                      setOnegraphShowFatigue(e.target.checked);
                    }}
                  />
                }
                label={<Typography>显示单位疲劳利润</Typography>}
              />
            </Stack>

            <Box
              alignItems="center"
              className="mb-2 flex justify-center flex-wrap"
              sx={{
                "& .MuiFormControl-root": {
                  width: "7rem",
                  margin: "0.5rem",
                },
              }}
            >
              <Typography className="p-4">去程</Typography>
              <BargainInputs barginConfig={playerConfig.bargain} onBargainChange={onGoBargainChange} />
              <FormControlLabel
                className="w-30 pl-4"
                control={
                  <Switch
                    checked={onegraphGoBarginDisabled}
                    onChange={(e) => {
                      setOnegraphGoBarginDisabled(e.target.checked);
                    }}
                  />
                }
                label={<Typography>不议价</Typography>}
              />
            </Box>

            <Box
              alignItems="center"
              className="mb-2 flex justify-center flex-wrap"
              sx={{
                "& .MuiFormControl-root": {
                  width: "7rem",
                  margin: "0.5rem",
                },
              }}
            >
              <Typography className="p-4">回程</Typography>
              <BargainInputs barginConfig={playerConfig.returnBargain} onBargainChange={onReturnBargainChange} />
              <FormControlLabel
                className="w-30 pl-4"
                control={
                  <Switch
                    checked={onegraphRtBarginDisabled}
                    onChange={(e) => {
                      setOnegraphRtBarginDisabled(e.target.checked);
                    }}
                  />
                }
                label={<Typography>不议价</Typography>}
              />
            </Box>
          </Box>

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
                "& .onegraph-cell-fromcity-source": {
                  width: "2rem",
                },
                "& .onegraph-cell-fromcity-cityname": {
                  width: "7rem",
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
                    <TableCell key={`onegraphv2-${city}`} align="center">
                      {city}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {CITIES.map((fromCity, index) => (
                  <TableRow key={`onegraphv2-row-${fromCity}`}>
                    {/** spaning 起点 cell */}
                    {index === 0 && (
                      <TableCell className="onegraph-cell-fromcity-source" rowSpan={CITIES.length}>
                        起点
                      </TableCell>
                    )}

                    {/** city name */}
                    <TableCell className="onegraph-cell-fromcity-cityname">{fromCity}</TableCell>

                    {/** profit cells */}
                    {CITIES.map((toCity) => {
                      const key = `onegraphv2-row-${fromCity}-cell-${toCity}`;
                      const EmptyCell = () => (
                        <TableCell key={key} align="center">
                          -
                        </TableCell>
                      );
                      if (fromCity === toCity) {
                        return EmptyCell();
                      }

                      const reco = onegraphRecommendations[fromCity]?.[toCity];
                      if (!reco) {
                        return EmptyCell();
                      }

                      const profit = onegraphGoAndReturn
                        ? reco.goAndReturn.reduce((acc, cur) => acc + cur.profit, 0)
                        : reco.simpleGo.profit;
                      const fatigue = onegraphGoAndReturn
                        ? reco.goAndReturn[0].fatigue + reco.goAndReturn[1].fatigue
                        : reco.simpleGo.fatigue;
                      const profitPerFatigue = Math.round(profit / fatigue);

                      const topProfitsLocal = onegraphGoAndReturn ? topProfits.goAndReturn : topProfits.go;
                      const maxProfitOfAll = topProfitsLocal[0];
                      const percentageToMax = Math.round((profit / maxProfitOfAll) * 100);
                      let RankIcon, textClass;
                      if (profit === topProfitsLocal[0]) {
                        RankIcon = <LooksOneIcon className="text-base" />;
                        textClass = "font-black";
                      } else if (profit === topProfitsLocal[1]) {
                        RankIcon = <LooksTwoIcon className="text-base" />;
                        textClass = "font-bold";
                      } else if (profit === topProfitsLocal[2]) {
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
                            background: `linear-gradient(90deg, ${
                              prefersDarkMode ? "darkred" : "lightcoral"
                            } ${percentageToMax}%, #0000 ${percentageToMax}%)`,
                          }}
                        >
                          <Button
                            className="w-full h-full block p-0"
                            color="inherit"
                            onClick={() => showOneGraphRouteDialog(fromCity, toCity)}
                          >
                            <span className={`flex justify-center items-center ${textClass}`}>
                              {RankIcon}
                              {profit}
                            </span>

                            {onegraphShowFatigue && <span className="flex justify-center">{profitPerFatigue}</span>}
                          </Button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <OneGraphRouteDialogV2
            open={onegraphRouteDialogOpen}
            setOpen={setOnegraphRouteDialogOpen}
            data={onegraphRouteDialogData}
          />
        </div>

        {/* 个性化设置 */}
        <div role="tabpanel" hidden={tabIndex !== 1}>
          <div className="bg-white dark:bg-gray-800 p-6 max-sm:px-0 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto my-4 w-full box-border">
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
                <NumberInput
                  label="货舱大小"
                  min={100}
                  max={3000}
                  defaultValue={500}
                  type="integer"
                  value={playerConfig.maxLot}
                  setValue={(newValue) => onPlayerConfigChange("maxLot", newValue)}
                />
              </Box>

              <Typography>声望等级：影响税收与单票商品购入量，目前仅支持8级以上。附属城市声望跟随主城。</Typography>
              <Box className="m-4">
                <NumberInput
                  label="修格里城"
                  min={8}
                  max={20}
                  defaultValue={8}
                  type="integer"
                  value={playerConfig.prestige["修格里城"]}
                  setValue={(newValue) => onPrestigeChange("修格里城", newValue)}
                />
                <NumberInput
                  label="曼德矿场"
                  min={8}
                  max={20}
                  defaultValue={8}
                  type="integer"
                  value={playerConfig.prestige["曼德矿场"]}
                  setValue={(newValue) => onPrestigeChange("曼德矿场", newValue)}
                />
                <NumberInput
                  label="澄明数据中心"
                  min={8}
                  max={20}
                  defaultValue={8}
                  type="integer"
                  value={playerConfig.prestige["澄明数据中心"]}
                  setValue={(newValue) => onPrestigeChange("澄明数据中心", newValue)}
                />
                <NumberInput
                  label="七号自由港"
                  min={8}
                  max={20}
                  defaultValue={8}
                  type="integer"
                  value={playerConfig.prestige["七号自由港"]}
                  setValue={(newValue) => onPrestigeChange("七号自由港", newValue)}
                />
              </Box>

              <Typography>议价</Typography>
              <Box className="m-4">
                <BargainInputs barginConfig={playerConfig.bargain} onBargainChange={onGoBargainChange} />
              </Box>

              <Typography>乘员共振</Typography>
              <Box className="m-4 max-sm:mx-0">
                <RoleSkillSelects playerConfig={playerConfig} setRoleResonance={setRoleResonance} />
              </Box>

              <Typography>数据同步</Typography>
              <Box className="m-4 max-sm:mx-0">
                <SyncPlayerConfigPanel
                  playerConfig={playerConfig}
                  setPlayerConfig={setPlayerConfig}
                  downloadPlayerConfig={downloadPlayerConfig}
                  uploadPlayerConfig={uploadPlayerConfig}
                />
              </Box>
            </Box>
          </div>
        </div>

        {/* 最优线路详细信息 */}
        <div role="tabpanel" hidden={tabIndex !== 2}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
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
                    <Box className="m-4 max-sm:mx-0">
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
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
            <div className="flex justify-between items-center mb-4">
              <Typography component="h3">选择一个或多个起始城市以及终点城市，查看所有线路以及最优交易组合。</Typography>
            </div>
            <div className="flex flex-col">
              <Typography>需要填写个性化设置。</Typography>
              <Typography>路线中的产品已经按利润进行了排序，排第一的商品为利润最高的商品。</Typography>
              <Typography>累计利润为当前商品以及它上面所有商品的单批利润的和。累计舱位同理。</Typography>
              <Typography>列车长请根据补货意愿从上往下选择一个或多个商品进行购买。</Typography>
            </div>
          </div>

          <Box className="m-4 flex justify-center items-center">
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
                      className="p-2 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-5xl mx-auto my-2 w-full box-border"
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
                              <TableCell align="right">单票舱位</TableCell>
                              <TableCell align="right">单票利润</TableCell>
                              <TableCell align="right">单票累计利润</TableCell>
                              <TableCell align="right">单票累计舱位</TableCell>
                              <TableCell align="right">补货累计利润</TableCell>
                              <TableCell align="right">补货累计舱位</TableCell>
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
                                <TableCell scope="row">{row.product}</TableCell>
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
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
            <div className="flex flex-col">
              <Typography>买价为砍价后税前价格。</Typography>
              <Typography>卖价为抬价后税前价格。</Typography>
              <Typography>利润为税后利润。</Typography>
              <Typography>利润排序使用的是单位舱位利润，暂不支持单位疲劳利润或单位进货卡利润。</Typography>
            </div>
          </div>
        </div>
      </Box>
    </ThemeProvider>
  );
}
