import { GetPricesProducts } from "@/interfaces/get-prices";
import { PlayerConfig } from "@/interfaces/player-config";
import { calculateRouteCycle } from "@/utils/route-cycle-utils";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import { Box, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import { useMemo } from "react";

interface RouteCycleTabProps {
  playerConfig: PlayerConfig;
  prices: GetPricesProducts;
}

export default function RouteCycleTab(props: RouteCycleTabProps) {
  const { playerConfig, prices } = props;

  const routeCycle = useMemo(() => {
    try {
      return calculateRouteCycle(prices, playerConfig);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [prices, playerConfig]);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
        <div className="flex flex-col">
          <Typography className="py-1">开发中。</Typography>
          <Typography className="py-1">多站点循环线路推荐。</Typography>
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
        {routeCycle && routeCycle.cycle && routeCycle.cycle.length > 1 && (
          <Box>
            <Typography>
              线路：{routeCycle.cycle.map((route) => route.fromCity).join(" -> ")}
              {" -> "}
              {routeCycle.cycle[0].fromCity}
            </Typography>
            <Typography>总利润：{routeCycle.totalProfit}</Typography>
            <Typography>总疲劳：{routeCycle.totalFatigue}</Typography>
            <Typography>单位疲劳利润：{routeCycle.profitPerFatigue}</Typography>
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
      </Paper>
    </>
  );
}
