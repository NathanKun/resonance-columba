"use client";

import { CITIES, CityName } from "@/data/Cities";
import usePlayerConfig from "@/hooks/usePlayerConfig";
import useSelectedCities from "@/hooks/useSelectedCities";
import { CityGroupedExchanges } from "@/interfaces/route-page";
import { calculateRouteCycle } from "@/utils/route-cycle-utils";
import { calculateAccumulatedValues, calculateExchanges, groupeExchangesByCity } from "@/utils/route-page-utils";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { Box, IconButton, ThemeProvider, Typography, useTheme } from "@mui/material";
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

  /* city selects */
  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities } = useSelectedCities({
    localStorageKey: "routeSelectedCities",
  });

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
                      <Typography className="my-4 flex items-center">
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
                                className={row.loss ? "line-through decoration-red-500 decoration-1" : ""}
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
