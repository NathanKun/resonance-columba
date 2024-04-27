import { GetPricesProducts } from "@/interfaces/get-prices";
import { PlayerConfig } from "@/interfaces/player-config";
import { getBargainSummary } from "@/utils/bargain-utils";
import { calculateRouteCycleV2 } from "@/utils/route-cycle-utils-v2";
import { calculateGeneralProfitIndex } from "@/utils/route-page-utils";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import { Box, Typography } from "@mui/material";
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
  const [maxBargainCount, setMaxBargainCount] = useState(3);
  const [maxRaiseCount, setMaxRaiseCount] = useState(3);
  const [maxRestockCount, setMaxRestockCount] = useState(3);
  const routeCycleInputs = useMemo(() => {
    return {
      maxBargainCount,
      maxRaiseCount,
      maxRestockCount,
    };
  }, [maxBargainCount, maxRaiseCount, maxRestockCount]);

  /* calculation */
  const bargainSummery = useMemo(
    () => getBargainSummary(playerConfig.roles, playerConfig.tradeLevel),
    [playerConfig.roles, playerConfig.tradeLevel]
  );

  const routeCycleV2 = useMemo(() => {
    try {
      return calculateRouteCycleV2(
        prices,
        playerConfig.maxLot,
        playerConfig.roles,
        playerConfig.prestige,
        playerConfig.productUnlockStatus,
        bargainSummery,
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
    bargainSummery,
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

  const nb = (number: number) => Number(number.toFixed(2));

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
        <div className="flex flex-col">
          <Typography className="py-1">多站点循环线路推荐。</Typography>
          <Typography className="py-1">开发中。</Typography>
          <Typography className="py-1">个性化设置中的议价生活技能参与计算。</Typography>
          <Typography className="py-1">由于抬砍成功与否为随机事件，计算得出的利润与疲劳皆为期望值。</Typography>
          <Typography className="py-1">
            计算得出抬砍次数是能达到最高期望利润的次数，实际操作时请按实际情况判断是否继续议价。
          </Typography>
        </div>
      </div>

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
            <Typography>期望总利润：{v2Stats.totalProfit}</Typography>
            <Typography>期望总疲劳：{nb(v2Stats.totalFatigue)}</Typography>
            <Typography>单位疲劳利润：{v2Stats.profitPerFatigue}</Typography>
            <Typography>综合参考利润：{v2Stats.generalProfitIndex}</Typography>
            <Typography>总进货书需求：{v2Stats.totalRestock}</Typography>
            {/* <Typography>总砍价次数：{v2Stats.totalBargain}</Typography>
            <Typography>总抬价次数：{v2Stats.totalRaise}</Typography> */}
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
                    疲劳：{nb(totalFatigue)} (线路 {routeFatigue} + 砍价 {nb(bargainTotalFagigue)} + 抬价{" "}
                    {nb(raiseTotalFatigue)})
                  </Typography>
                  <Typography>单位疲劳利润：{profitPerFatigue}</Typography>
                  <Typography>综合参考利润：{generalProfitIndex}</Typography>
                  <Typography>进货次数：{restock}</Typography>
                  <Typography>
                    砍价次数：{bargainCount} (疲劳：{nb(bargainTotalFagigue)})
                  </Typography>
                  <Typography>
                    抬价次数：{raiseCount} (疲劳：{nb(raiseTotalFatigue)})
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

      {/* display bargain summery */}
      <Paper>
        <Typography>个性化设置议价总结</Typography>
        <Typography>砍价率：{bargainSummery?.bargainRate}</Typography>
        <Typography>抬价率：{bargainSummery?.raiseRate}</Typography>
        <Typography>生活技能提供：</Typography>
        <Typography>砍价次数：{bargainSummery?.skillBargainCount}</Typography>
        <Typography>抬价次数：{bargainSummery?.skillRaiseCount}</Typography>
        <Typography>砍价率：{bargainSummery?.skillBargainRate}</Typography>
        <Typography>抬价率：{bargainSummery?.skillRaiseRate}</Typography>
        <Typography>砍价成功率：{bargainSummery?.skillBargainSuccessRate}</Typography>
        <Typography>抬价成功率：{bargainSummery?.skillRaiseSuccessRate}</Typography>
        <Typography>首次成功率：{bargainSummery?.skillFirstTrySuccessRate}</Typography>
        <Typography>失败后成功率：{bargainSummery?.skillAfterFailedSuccessRate}</Typography>
        <Typography>失败后疲劳减少：{bargainSummery?.skillAfterFailedLessFatigue}</Typography>
      </Paper>
    </>
  );
}
