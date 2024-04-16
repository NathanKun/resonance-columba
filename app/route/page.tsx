"use client";

import usePlayerConfig from "@/hooks/usePlayerConfig";
import useRouteCalculation from "@/hooks/useRouteCalculation";
import { calculateRouteCycle } from "@/utils/route-cycle-utils";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import { Box, ThemeProvider, Typography, useTheme } from "@mui/material";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { sendGTMEvent } from "@next/third-parties/google";
import { useContext, useMemo, useState } from "react";
import DetailedSimulationTab from "../components/route-page/tabs/detailed-simulation-tab";
import OnegraphTab from "../components/route-page/tabs/onegraph-tab";
import PlayerConfigTab from "../components/route-page/tabs/player-config-tab";
import RouteSelectionTab from "../components/route-page/tabs/route-selection-tab";
import { PriceContext } from "../price-provider";

export default function RoutePage() {
  const { prices } = useContext(PriceContext);

  /* theme */
  const theme = useTheme();

  /* tabs */
  const [tabIndex, setTabIndex] = useState(0);
  const tabNames = ["一图流", "个性化设置", "线路优选", "硬核模拟", "环路推荐", "计算说明"];
  const onTabChange = (newIndex: number) => {
    setTabIndex(newIndex);
    trackTabChange(newIndex);
  };

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

  /* route calculation */
  const {
    selectedCities,
    setSourceCities,
    setTargetCities,
    switchSourceAndTargetCities,
    cityGroupedExchangesAllTargetCities,
    cityGroupedExchangesSelectedTargetCities,
  } = useRouteCalculation({ playerConfig, prices });

  /* Route Cycle Recomendation */
  const routeCycle = useMemo(() => {
    try {
      return calculateRouteCycle(prices, playerConfig);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [prices, playerConfig]);

  /* tracking */
  const trackTabChange = (index: number) => {
    sendGTMEvent({ event: "route_page_tab_change", label: tabNames[index] });
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
          <OnegraphTab
            playerConfig={playerConfig}
            onPlayerConfigChange={onPlayerConfigChange}
            onGoBargainChange={onGoBargainChange}
          />
        </div>

        {/* 个性化设置 */}
        <div role="tabpanel" hidden={tabIndex !== 1}>
          <PlayerConfigTab
            playerConfig={playerConfig}
            onPlayerConfigChange={onPlayerConfigChange}
            setPlayerConfig={setPlayerConfig}
            setRoleResonance={setRoleResonance}
            setProductUnlock={setProductUnlock}
            uploadPlayerConfig={uploadPlayerConfig}
            downloadPlayerConfig={downloadPlayerConfig}
            onGoBargainChange={onGoBargainChange}
          />
        </div>

        {/* 线路优选 */}
        <div role="tabpanel" hidden={tabIndex !== 2}>
          <RouteSelectionTab
            playerConfig={playerConfig}
            cityGroupedExchangesAllTargetCities={cityGroupedExchangesAllTargetCities}
          />
        </div>

        {/* 详细模拟 */}
        <div role="tabpanel" hidden={tabIndex !== 3}>
          <DetailedSimulationTab
            selectedCities={selectedCities}
            setSourceCities={setSourceCities}
            setTargetCities={setTargetCities}
            switchSourceAndTargetCities={switchSourceAndTargetCities}
            cityGroupedExchangesSelectedTargetCities={cityGroupedExchangesSelectedTargetCities}
          />
        </div>

        {/* 环路推荐 */}
        <div role="tabpanel" hidden={tabIndex !== 4}>
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
        </div>

        {/* 计算说明 */}
        <div role="tabpanel" hidden={tabIndex !== 5}>
          <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
            <div className="flex flex-col">
              <Typography className="py-1">买价为砍价后税前价格。</Typography>
              <Typography className="py-1">卖价为抬价后税前价格。</Typography>
              <Typography className="py-1">利润为税后利润。</Typography>
              <Typography className="py-1">
                利润排序使用的是单位舱位利润，暂不支持单位疲劳利润或单位进货卡利润。
              </Typography>
              <Typography className="py-1">
                交易所结算页面所展示的利润是不含买入税与卖出时的利润税的，而算法计算的利润是税后的，所以模拟的利润会稍低于交易所显示的利润。
              </Typography>
              <Typography className="py-1">综合参考利润算法为：总利润 /（总疲劳消耗 + 总票数 * 33）</Typography>
            </div>
          </div>
        </div>
      </Box>
    </ThemeProvider>
  );
}
