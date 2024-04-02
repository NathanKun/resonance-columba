"use client";

import { CITIES, CityName } from "@/data/Cities";
import usePlayerConfig from "@/hooks/usePlayerConfig";
import useSelectedCities from "@/hooks/useSelectedCities";
import {
  CityGroupedExchanges,
  OneGraphRouteDialogDataV2,
  OnegraphBuyCombinationStats,
  OnegraphRecommendationsV2,
  OnegraphTopProfitItem,
} from "@/interfaces/route-page";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TableViewIcon from "@mui/icons-material/TableView";
import ViewListIcon from "@mui/icons-material/ViewList";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Slider,
  Switch,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
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
import ProductUnlockSelect from "../components/route-page/product-unlock-select";
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
  const {
    playerConfig,
    setPlayerConfig,
    setRoleResonance,
    setProductUnlock,
    downloadPlayerConfig,
    uploadPlayerConfig,
  } = usePlayerConfig();

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

  const setBargainDisabled = (value: boolean, isGo: boolean) => {
    const propName = isGo ? "bargain" : "returnBargain";
    const bargainObj = playerConfig[propName];
    onPlayerConfigChange(propName, { ...bargainObj, disabled: value });
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
    showProfitPerRestock: onegraphShowProfitPerRestock,
    displayMode: onegraphDisplayMode,
  } = playerConfig.onegraph;
  const setOnegraphGoAndReturn = (value: boolean) => oneOnegraphPlayerConfigChange("goAndReturn", value);
  const setMaxRestock = (value: number) => oneOnegraphPlayerConfigChange("maxRestock", value);
  const setOnegraphShowFatigue = (value: boolean) => oneOnegraphPlayerConfigChange("showFatigue", value);
  const setOnegraphShowProfitPerRestock = (value: boolean) =>
    oneOnegraphPlayerConfigChange("showProfitPerRestock", value);
  const setOnegraphDisplayMode = (value: "table" | "list") => oneOnegraphPlayerConfigChange("displayMode", value);
  const [onegraphRouteDialogData, setOnegraphRouteDialogData] = useState<OneGraphRouteDialogDataV2>();
  const [onegraphRouteDialogOpen, setOnegraphRouteDialogOpen] = useState(false);
  // no brain brute force aller-retour calculation :)
  const onegraphBuyCombinationsGo = useMemo(
    () =>
      calculateOneGraphBuyCombinations(
        prices,
        playerConfig.maxLot,
        playerConfig.bargain,
        playerConfig.prestige,
        playerConfig.roles
      ),
    [prices, playerConfig.maxLot, playerConfig.bargain, playerConfig.prestige, playerConfig.roles]
  );
  const onegraphBuyCombinationsRt = useMemo(
    () =>
      calculateOneGraphBuyCombinations(
        prices,
        playerConfig.maxLot,
        playerConfig.returnBargain,
        playerConfig.prestige,
        playerConfig.roles
      ),
    [prices, playerConfig.maxLot, playerConfig.returnBargain, playerConfig.prestige, playerConfig.roles]
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

        const goAndRtProfit = goAndReturn.reduce((acc, cur) => acc + cur.profit, 0);
        const goAndRtFatigue = goAndReturn[0].fatigue + goAndReturn[1].fatigue;
        const goAndRtProfitPerFatigue = goAndRtFatigue > 0 ? Math.round(goAndRtProfit / goAndRtFatigue) : 0;
        const goAndRtRestockCount = goAndReturn[0].restock + goAndReturn[1].restock;
        const goProfitGeneratedByRestock = goAndReturn[0].restock * goAndReturn[0].profitPerRestock;
        const returnProfitGeneratedByRestock = goAndReturn[1].restock * goAndReturn[1].profitPerRestock;
        const totalProfitGeneratedByRestock = goProfitGeneratedByRestock + returnProfitGeneratedByRestock;
        const goAndRtProfitPerRestock =
          goAndRtRestockCount > 0 ? Math.round(totalProfitGeneratedByRestock / goAndRtRestockCount) : 0;

        const goAndReturnTotal: OnegraphBuyCombinationStats = {
          combinations: [], // dummy prop
          profit: goAndRtProfit,
          restock: goAndRtRestockCount,
          fatigue: goAndRtFatigue,
          profitPerFatigue: goAndRtProfitPerFatigue,
          profitPerRestock: goAndRtProfitPerRestock,
          usedLot: -1, // dummy prop
          lastNotWastingRestock: -1, // dummy prop
        };

        results[fromCity][toCity] = {
          simpleGo,
          goAndReturn,
          goAndReturnTotal,
        };
      }
    }

    console.debug(onegraphBuyCombinationsGo, onegraphBuyCombinationsRt, results);

    return results;
  }, [onegraphBuyCombinationsGo, onegraphMaxRestock, onegraphBuyCombinationsRt]);
  const topProfits: {
    go: OnegraphTopProfitItem[];
    goAndReturn: OnegraphTopProfitItem[];
  } = useMemo(() => {
    let goProfits: OnegraphTopProfitItem[] = [];
    let goAndReturnProfits: OnegraphTopProfitItem[] = [];
    for (const fromCity in onegraphRecommendations) {
      for (const toCity in onegraphRecommendations[fromCity]) {
        const reco = onegraphRecommendations[fromCity][toCity];
        if (!reco || !reco.simpleGo || reco.goAndReturn?.length !== 2) continue;
        goProfits.push({
          profit: reco.simpleGo.profit,
          reco,
          fromCity,
          toCity,
        });

        goAndReturnProfits.push({
          profit: reco.goAndReturnTotal.profit,
          reco,
          fromCity,
          toCity,
        });
      }
    }
    goProfits = [...new Set(goProfits)].sort((a, b) => b.profit - a.profit);
    goAndReturnProfits = [...new Set(goAndReturnProfits)].sort((a, b) => b.profit - a.profit);

    // remove same go and return route:
    // 2 items has the same profit, and the one's fromCity and toCity is the reverse of the other,
    // this happens when the go bargain config is the same as the return bargain config
    goAndReturnProfits = goAndReturnProfits.filter((item) => {
      // only need to filter on half of the list
      if (item.fromCity < item.toCity) {
        return true;
      }

      const reverseItem = goAndReturnProfits.find(
        (i) => i.profit === item.profit && i.fromCity === item.toCity && i.toCity === item.fromCity
      );
      return !reverseItem;
    });

    return { go: goProfits, goAndReturn: goAndReturnProfits };
  }, [onegraphRecommendations]);
  const showOneGraphRouteDialog = (fromCity: CityName, toCity: CityName) => {
    setOnegraphRouteDialogData({
      stats: onegraphRecommendations[fromCity][toCity],
      playerConfig,
      fromCity,
      toCity,
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
              <Typography className="py-1">
                <Typography component="strong" fontSize={18}>
                  点击
                </Typography>
                表格中的数值可查看路线详情。
              </Typography>
              <Typography className="py-1">
                强烈建议先前往个性化设置页面，填写货舱大小以及声望等级，以获得更准确的结果。
              </Typography>
              <Typography className="py-1">
                来回选项开启时，算法会以最优解自动分配进货书，显示的线路是利润最大的进货书分配方法。
              </Typography>
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

            <Box alignItems="center" className="mb-2 flex justify-center flex-wrap">
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

              <FormControlLabel
                className="w-30"
                control={
                  <Switch
                    checked={onegraphShowProfitPerRestock}
                    onChange={(e) => {
                      setOnegraphShowProfitPerRestock(e.target.checked);
                    }}
                  />
                }
                label={<Typography>显示单位进货书利润</Typography>}
              />
            </Box>

            <Box alignItems="center" className="mb-2 flex justify-center flex-wrap">
              <Typography className="m-4 grow basis-1/2 sm:grow-0 sm:basis-auto -order-2">去程</Typography>
              <BargainInputs
                barginConfig={playerConfig.bargain}
                onBargainChange={onGoBargainChange}
                className="basis-2/5 p-2 sm:w-40 sm:basis-auto"
              />
              <FormControlLabel
                className="w-30 ml-4 -order-1 sm:-order-none"
                control={
                  <Switch
                    checked={playerConfig.bargain.disabled}
                    onChange={(e) => {
                      setBargainDisabled(e.target.checked, true);
                    }}
                  />
                }
                label={<Typography>不议价</Typography>}
              />
            </Box>

            <Box alignItems="center" className="mb-2 flex justify-center flex-wrap">
              <Typography className="m-4 grow basis-1/2 sm:grow-0 sm:basis-auto -order-2">回程</Typography>
              <BargainInputs
                barginConfig={playerConfig.returnBargain}
                onBargainChange={onReturnBargainChange}
                className="basis-2/5 p-2 sm:w-40 sm:basis-auto"
              />
              <FormControlLabel
                className="w-30 ml-4 -order-1 sm:-order-none"
                control={
                  <Switch
                    checked={playerConfig.returnBargain.disabled}
                    onChange={(e) => {
                      setBargainDisabled(e.target.checked, false);
                    }}
                  />
                }
                label={<Typography>不议价</Typography>}
              />
            </Box>
          </Box>

          <Paper className="w-full shadow-xl rounded-lg backdrop-blur-lg max-w-6xl mx-auto my-4 dark:bg-neutral-900 ">
            {/* display mode toggle */}
            <ToggleButtonGroup
              value={onegraphDisplayMode}
              exclusive
              onChange={(event, newValue) => {
                if (newValue) {
                  setOnegraphDisplayMode(newValue);
                }
              }}
              aria-label="onegraph display mode"
            >
              <ToggleButton value="table" aria-label="table">
                <TableViewIcon />
                表格
              </ToggleButton>
              <ToggleButton value="list" aria-label="list">
                <ViewListIcon />
                排序
              </ToggleButton>
            </ToggleButtonGroup>

            {/* table view */}
            {onegraphDisplayMode === "table" && (
              <TableContainer component={Paper} className="dark:bg-neutral-900">
                <Table
                  className="w-auto m-0 lg:m-12"
                  sx={{
                    "& th, & td": {
                      border: "1px solid gray",
                      padding: "0.25rem",
                      color: prefersDarkMode ? "white" : "black",
                      width: "7rem",
                    },
                    "& td": {
                      width: "7rem",
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
                        <TableCell className="onegraph-cell-fromcity-cityname min-w-14">{fromCity}</TableCell>

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

                          const goAndRtStats = reco.goAndReturnTotal;
                          const profit = onegraphGoAndReturn ? goAndRtStats.profit : reco.simpleGo.profit;
                          const profitPerFatigue = onegraphGoAndReturn
                            ? goAndRtStats.profitPerFatigue
                            : reco.simpleGo.profitPerFatigue;
                          const profitPerRestock = onegraphGoAndReturn
                            ? goAndRtStats.profitPerRestock
                            : reco.simpleGo.profitPerRestock;

                          const topProfitsLocal = onegraphGoAndReturn ? topProfits.goAndReturn : topProfits.go;
                          const maxProfitOfAll = topProfitsLocal[0].profit;
                          const percentageToMax = Math.round((profit / maxProfitOfAll) * 100);
                          let RankIcon, textClass;
                          if (profit === topProfitsLocal[0].profit) {
                            RankIcon = <LooksOneIcon className="text-base" />;
                            textClass = "font-black";
                          } else if (profit === topProfitsLocal[1].profit) {
                            RankIcon = <LooksTwoIcon className="text-base" />;
                            textClass = "font-bold";
                          } else if (profit === topProfitsLocal[2].profit) {
                            RankIcon = <Looks3Icon className="text-base" />;
                            textClass = "font-medium";
                          } else {
                            RankIcon = <></>;
                            textClass = "";
                          }

                          // use 万 as unit, keep 0 decimal
                          const displayProfit = profit > 10000 ? (profit / 10000).toFixed(0) + "万" : profit;

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
                                  {displayProfit}
                                </span>

                                {onegraphShowFatigue && <span className="flex justify-center">{profitPerFatigue}</span>}

                                {onegraphShowProfitPerRestock && (
                                  <span className="flex justify-center">{profitPerRestock}</span>
                                )}
                              </Button>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* list view */}
            {onegraphDisplayMode === "list" && (
              <List className="w-full">
                {(onegraphGoAndReturn ? topProfits.goAndReturn : topProfits.go).slice(0, 10).map((item, index) => {
                  const { fromCity, toCity, reco } = item;
                  const stats = onegraphGoAndReturn ? reco.goAndReturnTotal : reco.simpleGo;
                  const { profit, profitPerFatigue, profitPerRestock } = stats;
                  const displayProfit = profit > 10000 ? (profit / 10000).toFixed(0) + "万" : profit;
                  return (
                    <ListItem key={`topprofit-${index}`} className="sm:flex-nowrap flex-wrap justify-center py-3">
                      <ListItemAvatar>
                        <Avatar>{index + 1}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        className="flex basis-3/4 justify-center sm:basis-2/5 sm:justify-start"
                        primary={
                          <>
                            {fromCity} <RouteOutlinedIcon className="px-2" /> {toCity}
                          </>
                        }
                        primaryTypographyProps={{ className: "flex items-center" }}
                      />
                      <ListItemText
                        className="sm:basis-1/5 sm:grow basis-1/4 grow-0"
                        primary={displayProfit}
                        secondary="总利润"
                      />
                      <ListItemText
                        className="sm:basis-1/5 sm:grow basis-1/4 grow-0"
                        primary={profitPerFatigue}
                        secondary="利润 / 疲劳"
                      />
                      <ListItemText
                        className="sm:basis-1/5 sm:grow basis-1/4 grow-0"
                        primary={profitPerRestock}
                        secondary="利润 / 进货书"
                      />
                      <Button onClick={() => showOneGraphRouteDialog(fromCity, toCity)}>详情</Button>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
          <OneGraphRouteDialogV2
            open={onegraphRouteDialogOpen}
            setOpen={setOnegraphRouteDialogOpen}
            data={onegraphRouteDialogData}
          />
        </div>

        {/* 个性化设置 */}
        <div role="tabpanel" hidden={tabIndex !== 1}>
          <Paper
            className="p-6 max-sm:px-0 max-w-4xl mx-auto my-4 w-full box-border"
            sx={{
              "& .MuiFormControl-root": {
                width: "10rem",
                margin: "0.5rem",
              },
            }}
          >
            <Box className="m-4">
              <Typography>无垠号</Typography>
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

            <Box className="m-4">
              <Typography>声望等级：影响税收与单票商品购入量，目前仅支持8级以上。附属城市声望跟随主城。</Typography>
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

            <Box className="m-4">
              <Typography>议价</Typography>
              <BargainInputs barginConfig={playerConfig.bargain} onBargainChange={onGoBargainChange} />
            </Box>

            <Box className="m-4">
              <Typography>乘员共振</Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}></AccordionSummary>
                <AccordionDetails className="p-0">
                  <RoleSkillSelects playerConfig={playerConfig} setRoleResonance={setRoleResonance} />
                </AccordionDetails>
              </Accordion>
            </Box>

            <Box className="m-4">
              <Typography>商品解锁</Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}></AccordionSummary>
                <AccordionDetails className="p-0">
                  <ProductUnlockSelect playerConfig={playerConfig} setProductUnlock={setProductUnlock} />
                </AccordionDetails>
              </Accordion>
            </Box>

            <Box className="m-4">
              <Typography>数据同步</Typography>
              <SyncPlayerConfigPanel
                playerConfig={playerConfig}
                setPlayerConfig={setPlayerConfig}
                downloadPlayerConfig={downloadPlayerConfig}
                uploadPlayerConfig={uploadPlayerConfig}
              />
            </Box>
          </Paper>
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
              <Typography className="py-1">需要填写个性化设置。</Typography>
              <Typography className="py-1">选择购买的商品种类越多，所需进货书越少，但利润一般也越低。</Typography>
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
              <Typography className="py-1">需要填写个性化设置。</Typography>
              <Typography className="py-1">路线中的产品已经按利润进行了排序，排第一的商品为利润最高的商品。</Typography>
              <Typography className="py-1">
                累计利润为当前商品以及它上面所有商品的单批利润的和。累计舱位同理。
              </Typography>
              <Typography className="py-1">列车长请根据补货意愿从上往下选择一个或多个商品进行购买。</Typography>
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
              <Typography className="py-1">买价为砍价后税前价格。</Typography>
              <Typography className="py-1">卖价为抬价后税前价格。</Typography>
              <Typography className="py-1">利润为税后利润。</Typography>
              <Typography className="py-1">
                利润排序使用的是单位舱位利润，暂不支持单位疲劳利润或单位进货卡利润。
              </Typography>
              <Typography className="py-1">单位进货书利润算法为：（利润 - 不进货路线利润） / 进货次数</Typography>
              <Typography className="py-1">
                交易所结算页面所展示的利润是不含买入税与卖出时的利润税的，而算法计算的利润是税后的，所以模拟的利润会稍低于交易所显示的利润。
              </Typography>
            </div>
          </div>
        </div>
      </Box>
    </ThemeProvider>
  );
}
