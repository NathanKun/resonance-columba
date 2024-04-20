import { GetPricesProducts } from "@/interfaces/get-prices";
import { PlayerConfig } from "@/interfaces/player-config";
import { calculateRouteCycleV2 } from "@/utils/route-cycle-utils-v2";
import { calculateGeneralProfitIndex } from "@/utils/route-page-utils";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import { Box, InputAdornment, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import React, { useMemo, useState } from "react";
import NumberInput from "../number-input";

interface RouteCycleTabProps {
  playerConfig: PlayerConfig;
  prices: GetPricesProducts;
}

export default function RouteCycleTab(props: RouteCycleTabProps) {
  const { playerConfig, prices } = props;

  /* states */
  // route cycle inputs
  const [bargainRate, setBargainRate] = useState(9.5);
  const [bargainSuccessRate, setBargainSuccessRate] = useState(80);
  const [bargainOnceFatigue, setBargainOnceFatigue] = useState(8);
  const [raiseRate, setRaiseRate] = useState(8.5);
  const [raiseSuccessRate, setRaiseSuccessRate] = useState(70);
  const [raiseOnceFatigue, setRaiseOnceFatigue] = useState(8);
  const [maxBargainCount, setMaxBargainCount] = useState(3);
  const [maxRaiseCount, setMaxRaiseCount] = useState(3);
  const [maxRestockCount, setMaxRestockCount] = useState(3);
  const routeCycleInputs = useMemo(() => {
    return {
      bargainRate,
      bargainSuccessRate,
      bargainOnceFatigue,
      raiseRate,
      raiseSuccessRate,
      raiseOnceFatigue,
      maxBargainCount,
      maxRaiseCount,
      maxRestockCount,
    };
  }, [
    bargainRate,
    bargainSuccessRate,
    bargainOnceFatigue,
    maxBargainCount,
    raiseRate,
    raiseSuccessRate,
    raiseOnceFatigue,
    maxRaiseCount,
    maxRestockCount,
  ]);

  // const routeCycle = useMemo(() => {
  //   try {
  //     return calculateRouteCycle(prices, playerConfig.maxLot, playerConfig.roles, playerConfig.prestige);
  //   } catch (e) {
  //     console.error(e);
  //     return null;
  //   }
  // }, [prices, playerConfig.maxLot, playerConfig.roles, playerConfig.prestige]);

  const routeCycleV2 = useMemo(() => {
    try {
      return calculateRouteCycleV2(
        prices,
        playerConfig.maxLot,
        playerConfig.roles,
        playerConfig.prestige,
        playerConfig.productUnlockStatus,
        routeCycleInputs
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [
    prices,
    playerConfig.maxLot,
    playerConfig.roles,
    playerConfig.prestige,
    playerConfig.productUnlockStatus,
    routeCycleInputs,
  ]);

  const v2Stats = useMemo(() => {
    if (!routeCycleV2 || !routeCycleV2.length) {
      return null;
    }

    const cities = routeCycleV2.map((route) => route.fromCity);

    const totalProfit = routeCycleV2.reduce((acc, route) => acc + route.graphItem.profit, 0);
    const totalFatigue = routeCycleV2.reduce((acc, route) => acc + route.graphItem.totalFatigue, 0);
    const totalRestock = routeCycleV2.reduce((acc, route) => acc + route.graphItem.restock, 0);
    const totalBargain = routeCycleV2.reduce((acc, route) => acc + route.graphItem.bargainCount, 0);
    const totalRaise = routeCycleV2.reduce((acc, route) => acc + route.graphItem.raiseCount, 0);
    const profitPerFatigue = Math.round(totalProfit / totalFatigue);
    const generalProfitIndex = calculateGeneralProfitIndex(totalProfit, totalFatigue, totalRestock);

    return {
      cities,
      totalProfit,
      totalFatigue,
      totalRestock,
      totalBargain,
      totalRaise,
      profitPerFatigue,
      generalProfitIndex,
    };
  }, [routeCycleV2]);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
        <div className="flex flex-col">
          <Typography className="py-1">开发中。</Typography>
          <Typography className="py-1">多站点循环线路推荐。</Typography>
        </div>
      </div>
      {/* <Paper
        className="p-6 max-sm:px-0 max-w-4xl mx-auto my-4 w-full box-border"
        sx={{
          "& .MuiFormControl-root": {
            width: "10rem",
            margin: "0.5rem",
          },
        }}
      >
        {routeCycle && routeCycle.cycle && routeCycle.cycle.length > 1 && (
          <Box>
            <Typography>V1</Typography>
            <Typography>
              线路：{routeCycle.cycle.map((route) => route.fromCity).join(" -> ")}
              {" -> "}
              {routeCycle.cycle[0].fromCity}
            </Typography>
            <Typography>总利润：{routeCycle.totalProfit}</Typography>
            <Typography>总疲劳：{routeCycle.totalFatigue}</Typography>
            <Typography>单位疲劳利润：{routeCycle.profitPerFatigue}</Typography>
            <Typography>综合参考利润：{routeCycle.generalProfitIndex}</Typography>
            {routeCycle.cycle.map((route, index) => {
              const { fromCity, toCity, restock, profit, fatigue, profitPerFatigue, buys } = route;

              return (
                <Box key={`route-cycle-${fromCity}-${toCity}`}>
                  <Typography>
                    {fromCity} <RouteOutlinedIcon className="mx-2" /> {toCity}
                  </Typography>
                  <Typography>利润：{profit}</Typography>
                  <Typography>疲劳：{fatigue}</Typography>
                  <Typography>单位疲劳利润：{profitPerFatigue}</Typography>
                  <Typography>进货次数：{restock}</Typography>
                  <Typography>
                    购买: &nbsp;
                    {buys
                      .map((buy) => {
                        return buy.product + "(" + buy.lot + ")";
                      })
                      .join(", ")}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper> */}

      <Paper
        className="p-6 max-sm:px-0 max-w-4xl mx-auto my-4 w-full box-border"
        sx={{
          "& .MuiFormControl-root": {
            width: "10rem",
            margin: "0.5rem",
          },
        }}
      >
        <NumberInput
          className=""
          label="砍价比率"
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          min={0}
          max={20}
          step={0.1}
          defaultValue={0}
          type="float"
          decimalPlaces={1}
          value={bargainRate}
          setValue={setBargainRate}
        />
        <NumberInput
          className=""
          label="砍价平均成功率"
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          min={0}
          max={100}
          step={0.1}
          defaultValue={0}
          type="float"
          decimalPlaces={1}
          value={bargainSuccessRate}
          setValue={setBargainSuccessRate}
        />
        <NumberInput
          className=""
          label="单次砍价疲劳"
          min={0}
          max={10}
          step={1}
          defaultValue={0}
          type="integer"
          value={bargainOnceFatigue}
          setValue={setBargainOnceFatigue}
        />
        <NumberInput
          className=""
          label="单程砍价次数上限"
          min={0}
          max={5}
          step={1}
          defaultValue={0}
          type="integer"
          value={maxBargainCount}
          setValue={setMaxBargainCount}
        />

        <NumberInput
          className=""
          label="抬价比率"
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          min={0}
          max={20}
          step={0.1}
          defaultValue={0}
          type="float"
          decimalPlaces={1}
          value={raiseRate}
          setValue={setRaiseRate}
        />
        <NumberInput
          className=""
          label="抬价平均成功率"
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          min={0}
          max={100}
          step={0.1}
          defaultValue={0}
          type="float"
          decimalPlaces={1}
          value={raiseSuccessRate}
          setValue={setRaiseSuccessRate}
        />
        <NumberInput
          className=""
          label="单次抬价疲劳"
          min={0}
          max={10}
          step={1}
          defaultValue={0}
          type="integer"
          value={raiseOnceFatigue}
          setValue={setRaiseOnceFatigue}
        />
        <NumberInput
          className=""
          label="单程抬价次数上限"
          min={0}
          max={5}
          step={1}
          defaultValue={0}
          type="integer"
          value={maxRaiseCount}
          setValue={setMaxRaiseCount}
        />
        <NumberInput
          className=""
          label="单程进货次数上限"
          min={0}
          max={5}
          step={1}
          defaultValue={0}
          type="integer"
          value={maxRestockCount}
          setValue={setMaxRestockCount}
        />

        {routeCycleV2 && routeCycleV2.length > 1 && v2Stats && (
          <Box>
            {/* <Typography>V2</Typography> */}
            <Typography>
              线路：
              {v2Stats.cities.map((c) => {
                return (
                  <React.Fragment key={`route-city-name${c}`}>
                    {c} <RouteOutlinedIcon className="mx-2" />
                  </React.Fragment>
                );
              })}
              {v2Stats.cities[0]}
            </Typography>
            <Typography>总利润：{v2Stats.totalProfit}</Typography>
            <Typography>总疲劳：{v2Stats.totalFatigue}</Typography>
            <Typography>单位疲劳利润：{v2Stats.profitPerFatigue}</Typography>
            <Typography>综合参考利润：{v2Stats.generalProfitIndex}</Typography>
            <Typography>总进货书需求：{v2Stats.totalRestock}</Typography>
            <Typography>总砍价次数：{v2Stats.totalBargain}</Typography>
            <Typography>总抬价次数：{v2Stats.totalRaise}</Typography>
            {routeCycleV2.map((route) => {
              const { fromCity, toCity, graphItem } = route;
              const {
                bargainCount,
                bargainTotalFagigue,
                buys,
                generalProfitIndex,
                profit,
                profitPerFatigue,
                raiseCount,
                raiseTotalFatigue,
                restock,
                routeFatigue,
                totalFatigue,
              } = graphItem;

              return (
                <Box key={`route-cycle-${fromCity}-${toCity}`} className="my-4">
                  <Typography>
                    {fromCity} <RouteOutlinedIcon className="mx-2" /> {toCity}
                  </Typography>
                  <Typography>利润：{profit}</Typography>
                  <Typography>
                    疲劳：{totalFatigue} (线路 {routeFatigue} + 砍价 {bargainTotalFagigue} + 抬价 {raiseTotalFatigue})
                  </Typography>
                  <Typography>单位疲劳利润：{profitPerFatigue}</Typography>
                  <Typography>综合参考利润：{generalProfitIndex}</Typography>
                  <Typography>进货次数：{restock}</Typography>
                  <Typography>
                    砍价次数：{bargainCount} (疲劳：{bargainTotalFagigue})
                  </Typography>
                  <Typography>
                    抬价次数：{raiseCount} (疲劳：{raiseTotalFatigue})
                  </Typography>
                  <Typography>
                    购买: &nbsp;
                    {buys
                      .map((buy) => {
                        return buy.pdtName + " (" + buy.lot + ")";
                      })
                      .join(", ")}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
    </>
  );
}
