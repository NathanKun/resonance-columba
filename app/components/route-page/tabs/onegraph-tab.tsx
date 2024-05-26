import { CITIES, CityName } from "@/data/Cities";
import { PlayerConfig } from "@/interfaces/player-config";
import {
  OneGraphRouteDialogData,
  OnegraphBuyCombinationStats,
  OnegraphRecommendations,
  OnegraphTopProfit,
  OnegraphTopProfitItem,
} from "@/interfaces/route-page";
import {
  calculateGeneralProfitIndex,
  calculateOneGraphBuyCombinations,
  getOneGraphRecommendation,
} from "@/utils/route-page-utils";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import Looks3Icon from "@mui/icons-material/Looks3";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import PaletteIcon from "@mui/icons-material/Palette";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import TableViewIcon from "@mui/icons-material/TableView";
import ViewListIcon from "@mui/icons-material/ViewList";
import {
  Avatar,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Slider,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { sendGTMEvent } from "@next/third-parties/google";
import { useContext, useMemo, useState } from "react";
import { PriceContext } from "../../../price-provider";
import StatedIconButton from "../StatedIconButton";
import BargainInputs from "../bargain-inputs";
import NumberInput from "../number-input";
import OneGraphRouteDialog from "../onegraph-route-dialog";
import OnegraphMultiConfigSelect from "../onegraph-multi-config-select";

interface OnegraphTabProps {
  playerConfig: PlayerConfig;
  onPlayerConfigChange: (field: string, value: any) => void;
  onGoBargainChange: (field: string, value: number) => void;
}

export default function OnegraphTab(props: OnegraphTabProps) {
  /* constants */
  const MAX_ONEGRAPH_MAX_RESTOCK = 50;
  const MAX_ONEGRAPH_MAX_RESTOCK_SLIDER = 20;

  /* props */
  const { playerConfig, onPlayerConfigChange, onGoBargainChange } = props;
  const {
    goAndReturn: onegraphGoAndReturn,
    maxRestock: onegraphMaxRestock,
    showFatigue: onegraphShowFatigue,
    showGeneralProfitIndex: onegraphShowGeneralProfitIndex,
    enableMultiConfig: onegraphEnableMultiConfig,
    displayMode: onegraphDisplayMode,
  } = playerConfig.onegraph;

  /* context */
  const { prices } = useContext(PriceContext);

  /* theme */
  const theme = useTheme();
  const prefersDarkMode = theme.palette.mode === "dark";

  /* onegraph related player config updater */
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

  const oneOnegraphPlayerConfigChange = (field: string, value: any) => {
    onPlayerConfigChange("onegraph", { ...playerConfig.onegraph, [field]: value });
  };

  const setOnegraphGoAndReturn = (value: boolean) => oneOnegraphPlayerConfigChange("goAndReturn", value);

  const setMaxRestock = (value: number) => oneOnegraphPlayerConfigChange("maxRestock", value);

  const setOnegraphShowFatigue = (value: boolean) => oneOnegraphPlayerConfigChange("showFatigue", value);

  const setOnegraphShowGeneralProfitIndex = (value: boolean) =>
    oneOnegraphPlayerConfigChange("showGeneralProfitIndex", value);

  const setOnegraphEnableMultiConfig = (value: boolean) => oneOnegraphPlayerConfigChange("enableMultiConfig", value);

  const setOnegraphDisplayMode = (value: "table" | "list") => oneOnegraphPlayerConfigChange("displayMode", value);

  /* onegraph states */
  const [onegraphCellColorDisabled, setOnegraphCellColorDisabled] = useState(false);
  const onOnegraphCellColorDisabledButtonClick = () => {
    setOnegraphCellColorDisabled((prev) => !prev);
  };
  const [onegraphRouteDialogData, setOnegraphRouteDialogData] = useState<OneGraphRouteDialogData>();
  const [onegraphRouteDialogOpen, setOnegraphRouteDialogOpen] = useState(false);
  const [onegraphListModeSortedBy, setOnegraphListModeSortedBy] = useState<
    "byProfit" | "byProfitPerFatigue" | "byGeneralProfitIndex"
  >("byProfit");

  /* onegraph route calculations */
  // no brain brute force aller-retour calculation :)
  const onegraphBuyCombinationsGo = useMemo(
    () =>
      calculateOneGraphBuyCombinations(
        prices,
        playerConfig.maxLot,
        playerConfig.bargain,
        playerConfig.prestige,
        playerConfig.roles,
        playerConfig.productUnlockStatus
      ),
    [
      prices,
      playerConfig.maxLot,
      playerConfig.bargain,
      playerConfig.prestige,
      playerConfig.roles,
      playerConfig.productUnlockStatus,
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
        playerConfig.productUnlockStatus
      ),
    [
      prices,
      playerConfig.maxLot,
      playerConfig.returnBargain,
      playerConfig.prestige,
      playerConfig.roles,
      playerConfig.productUnlockStatus,
    ]
  );

  const onegraphRecommendations = useMemo(() => {
    const results: OnegraphRecommendations = {};
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
        const goAndRtGeneralProfitIndex = calculateGeneralProfitIndex(
          goAndRtProfit,
          goAndRtFatigue,
          goAndRtRestockCount
        );

        const goAndReturnTotal: OnegraphBuyCombinationStats = {
          combinations: [], // dummy prop
          profit: goAndRtProfit,
          restock: goAndRtRestockCount,
          fatigue: goAndRtFatigue,
          profitPerFatigue: goAndRtProfitPerFatigue,
          generalProfitIndex: goAndRtGeneralProfitIndex,
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

    // console.debug(onegraphBuyCombinationsGo, onegraphBuyCombinationsRt, results);

    return results;
  }, [onegraphBuyCombinationsGo, onegraphMaxRestock, onegraphBuyCombinationsRt]);

  const topProfits: OnegraphTopProfit = useMemo(() => {
    let goProfits: OnegraphTopProfitItem[] = [];
    let goAndReturnProfits: OnegraphTopProfitItem[] = [];
    for (const fromCity in onegraphRecommendations) {
      for (const toCity in onegraphRecommendations[fromCity]) {
        const reco = onegraphRecommendations[fromCity][toCity];
        if (!reco || !reco.simpleGo || reco.goAndReturn?.length !== 2) continue;
        goProfits.push({
          profit: reco.simpleGo.profit,
          profitPerFatigue: reco.simpleGo.profitPerFatigue,
          generalProfitIndex: reco.simpleGo.generalProfitIndex,
          reco,
          fromCity,
          toCity,
        });

        goAndReturnProfits.push({
          profit: reco.goAndReturnTotal.profit,
          profitPerFatigue: reco.goAndReturnTotal.profitPerFatigue,
          generalProfitIndex: reco.goAndReturnTotal.generalProfitIndex,
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

    const byProfit = { go: [...goProfits], goAndReturn: [...goAndReturnProfits] };

    const byProfitPerFatigue = {
      go: [...goProfits].sort((a, b) => b.profitPerFatigue - a.profitPerFatigue),
      goAndReturn: [...goAndReturnProfits].sort((a, b) => b.profitPerFatigue - a.profitPerFatigue),
    };

    const byGeneralProfitIndex = {
      go: [...goProfits].sort((a, b) => b.generalProfitIndex - a.generalProfitIndex),
      goAndReturn: [...goAndReturnProfits].sort((a, b) => b.generalProfitIndex - a.generalProfitIndex),
    };

    return {
      byProfit,
      byProfitPerFatigue,
      byGeneralProfitIndex,
    };
  }, [onegraphRecommendations]);

  /* onegraph dialog */
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

  /* tracking */
  const trackOnegraphDialogBtnClick = (fromCity: string, toCity: string) => {
    sendGTMEvent({ event: "onegraph_route_dialog_open", label: `${fromCity} to ${toCity}` });
  };

  return (
    <>
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
          <Typography className="py-1">
            总进货次数最大{MAX_ONEGRAPH_MAX_RESTOCK}，超过{MAX_ONEGRAPH_MAX_RESTOCK_SLIDER}时请通过输入框手动输入。
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
              max={MAX_ONEGRAPH_MAX_RESTOCK_SLIDER}
              size="small"
            />
            <IconButton
              onClick={() => {
                if (onegraphMaxRestock < MAX_ONEGRAPH_MAX_RESTOCK) {
                  setMaxRestock(onegraphMaxRestock + 1);
                }
              }}
              size="small"
            >
              <ArrowRightIcon />
            </IconButton>
          </Box>
          <NumberInput
            className="w-9"
            hiddenLabel
            hideSpinButton
            variant="standard"
            min={0}
            max={MAX_ONEGRAPH_MAX_RESTOCK}
            defaultValue={0}
            type="integer"
            value={onegraphMaxRestock}
            inputProps={{ className: "text-center" }}
            setValue={(newVal) => setMaxRestock(newVal)}
          />
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
                checked={onegraphShowGeneralProfitIndex}
                onChange={(e) => {
                  setOnegraphShowGeneralProfitIndex(e.target.checked);
                }}
              />
            }
            label={<Typography>显示综合参考利润</Typography>}
          />

          <FormControlLabel
            className="w-30"
            control={
              <Switch
                checked={onegraphEnableMultiConfig}
                onChange={(e) => {
                  setOnegraphEnableMultiConfig(e.target.checked);
                }}
              />
            }
            label={<Typography>启用多配置</Typography>}
          />
        </Box>

        <Box alignItems="center" className="mb-2 flex justify-center flex-wrap">
          <Typography className="m-4 grow basis-1/2 sm:grow-0 sm:basis-auto -order-2">去程</Typography>
          <BargainInputs
            barginConfig={playerConfig.bargain}
            onBargainChange={onGoBargainChange}
            className="basis-2/5 m-2 sm:w-36 sm:basis-auto"
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
            className="basis-2/5 m-2 sm:w-36 sm:basis-auto"
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

      {onegraphEnableMultiConfig ? (
        <Box alignItems="center" className="mb-2 flex justify-center flex-wrap">
          <Typography className="m-4 grow sm:grow-0 -order-2 whitespace-nowrap">配置</Typography>
          <OnegraphMultiConfigSelect playerConfig={playerConfig} onPlayerConfigChange={onPlayerConfigChange} />
        </Box>
      ) : null}

      <Paper className="w-full shadow-xl rounded-lg backdrop-blur-lg max-w-6xl mx-auto my-4 dark:bg-neutral-900 ">
        {/* display mode toggle & disable cell color btn */}
        <Box className="flex justify-between items-center">
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
          <IconButton onClick={onOnegraphCellColorDisabledButtonClick} className="p-3">
            <PaletteIcon />
          </IconButton>
        </Box>

        {/* table view */}
        {onegraphDisplayMode === "table" && (
          <TableContainer className="dark:bg-neutral-900">
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
                "& .sticky-cell": {
                  position: "sticky",
                  backgroundColor: "#fff",
                  zIndex: 2,
                },
                "& th.sticky-cell": {
                  top: 0,
                },
                "& td.sticky-cell": {
                  left: 0,
                },
                "& .sticky-cell::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  border: "solid grey",
                  pointerEvents: "none",
                },
                "& th.sticky-cell::before": {
                  bottom: -1,
                  left: 0,
                  right: 0,
                  height: 0,
                  borderWidth: "0 0 1px 0",
                },
                "& td.sticky-cell::before": {
                  top: 0,
                  bottom: 0,
                  right: -1,
                  width: 0,
                  borderWidth: "0 1px 0 0",
                },
              }}
            >
              <TableHead>
                {/** header 1 - spanning 终点 cell */}
                <TableRow>
                  <TableCell colSpan={2} rowSpan={2}></TableCell>
                  <TableCell align="center" colSpan={CITIES.length}>
                    终点
                  </TableCell>
                </TableRow>
                {/** header 2 - city cells */}
                <TableRow>
                  {CITIES.map((city) => (
                    <TableCell key={`onegraph-${city}`} align="center">
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
                      <TableCell className="onegraph-cell-fromcity-source text-center" rowSpan={CITIES.length}>
                        起点
                      </TableCell>
                    )}

                    {/** city name */}
                    <TableCell className="onegraph-cell-fromcity-cityname sticky-cell min-w-14">{fromCity}</TableCell>

                    {/** profit cells */}
                    {CITIES.map((toCity) => {
                      const key = `onegraph-row-${fromCity}-cell-${toCity}`;
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
                      const generalProfitIndex = onegraphGoAndReturn
                        ? goAndRtStats.generalProfitIndex
                        : reco.simpleGo.generalProfitIndex;

                      const topProfitsLocal = onegraphGoAndReturn
                        ? topProfits.byProfit.goAndReturn
                        : topProfits.byProfit.go;
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
                            background: onegraphCellColorDisabled
                              ? ""
                              : `linear-gradient(90deg, ${
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

                            {onegraphShowGeneralProfitIndex && (
                              <span className="flex justify-center">{generalProfitIndex}</span>
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
            {/* sort by buttons */}
            <ListItem className="sm:flex-nowrap flex-wrap justify-center p-0 sm:h-0">
              <ListItemAvatar></ListItemAvatar>
              <ListItemText
                className="flex basis-3/4 justify-center sm:basis-2/5 sm:justify-start"
                primaryTypographyProps={{ className: "flex items-center" }}
              />
              {/* desktop sort buttons */}
              <ListItemText
                className="sm:basis-1/5 sm:grow basis-1/4 sm:relative sm:-top-6 sm:block grow-0 hidden"
                primary={
                  <StatedIconButton
                    Icon={<ArrowDownwardIcon />}
                    state={onegraphListModeSortedBy}
                    setState={setOnegraphListModeSortedBy}
                    buttonState="byProfit"
                  />
                }
              />
              <ListItemText
                className="sm:basis-1/5 sm:grow basis-1/4 sm:relative sm:-top-6 sm:block grow-0 hidden"
                primary={
                  <StatedIconButton
                    Icon={<ArrowDownwardIcon />}
                    state={onegraphListModeSortedBy}
                    setState={setOnegraphListModeSortedBy}
                    buttonState="byProfitPerFatigue"
                  />
                }
              />
              <ListItemText
                className="sm:basis-1/5 sm:grow basis-1/4 sm:relative sm:-top-6 sm:block grow-0 hidden"
                primary={
                  <StatedIconButton
                    Icon={<ArrowDownwardIcon />}
                    state={onegraphListModeSortedBy}
                    setState={setOnegraphListModeSortedBy}
                    buttonState="byGeneralProfitIndex"
                  />
                }
              />
              {/* placeholder */}
              <Box className="sm:px-8 sm:py-1"></Box>
              {/* mobile sort buttons */}
              <Box className="sm:hidden">
                <Typography className="inline-block">排序：</Typography>
                <ToggleButtonGroup
                  value={onegraphListModeSortedBy}
                  exclusive
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setOnegraphListModeSortedBy(newValue);
                    }
                  }}
                  aria-label="onegraph display mode"
                >
                  <ToggleButton value="byProfit">利润</ToggleButton>
                  <ToggleButton value="byProfitPerFatigue">单位疲劳利润</ToggleButton>
                  <ToggleButton value="byGeneralProfitIndex">综合参考利润</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </ListItem>

            {(onegraphGoAndReturn
              ? topProfits[onegraphListModeSortedBy].goAndReturn
              : topProfits[onegraphListModeSortedBy].go
            )
              .slice(0, 10)
              .map((item, index) => {
                const { fromCity, toCity, reco } = item;
                const stats = onegraphGoAndReturn ? reco.goAndReturnTotal : reco.simpleGo;
                const { profit, profitPerFatigue, generalProfitIndex } = stats;
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
                          {fromCity} <RouteOutlinedIcon className="px-2 text-4xl" /> {toCity}
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
                      primary={generalProfitIndex}
                      secondary="综合参考利润"
                    />
                    <Button onClick={() => showOneGraphRouteDialog(fromCity, toCity)}>详情</Button>
                  </ListItem>
                );
              })}
          </List>
        )}
      </Paper>
      <OneGraphRouteDialog
        open={onegraphRouteDialogOpen}
        setOpen={setOnegraphRouteDialogOpen}
        data={onegraphRouteDialogData}
      />
    </>
  );
}
