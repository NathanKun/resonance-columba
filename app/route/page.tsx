"use client";

import { CITIES, CityName } from "@/data/Cities";
import usePlayerConfig from "@/hooks/usePlayerConfig";
import useSelectedCities from "@/hooks/useSelectedCities";
import { calculateAccumulatedValues, calculateExchanges, groupeExchangesByCity } from "@/utils/route-page-utils";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import {
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
    if (value && !isNaN(parseInt(value))) {
      onPlayerConfigChange("bargain", { ...playerConfig.bargain, [field]: parseInt(value) });
    }
  };

  const onPrestigeChange = (city: CityName, value: string) => {
    if (value && !isNaN(parseInt(value))) {
      onPlayerConfigChange("prestige", { ...playerConfig.prestige, [city]: parseInt(value) });
    }
  };

  /* calculation */
  // all possible single product exchange routes
  const singleProductExchanges = calculateExchanges(
    playerConfig,
    selectedCities.sourceCities,
    selectedCities.targetCities,
    prices,
    isV2Prices
  );

  // group by fromCity then toCity
  const cityGroupedExchanges = groupeExchangesByCity(singleProductExchanges);
  calculateAccumulatedValues(playerConfig, cityGroupedExchanges);

  return (
    <ThemeProvider theme={theme}>
      <Typography className="mx-4 my-2">个性化利润计算开发中。</Typography>
      <Typography className="mx-4 my-2">路线中的产品已经按按单批利润进行了排序。</Typography>
      <Typography className="mx-4 my-2">累计利润为当前商品以及它上面所有商品的单批利润的和。累计仓位同理。</Typography>

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

      <Box
        className="m-4"
        sx={{
          "& .MuiFormControl-root": {
            width: "10rem",
            margin: "0.5rem",
          },
        }}
      >
        <Typography>玩家配置</Typography>
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
        <Typography>砍价抬价</Typography>
        <Box className="m-4">
          <TextField
            label="砍价"
            type="number"
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            inputProps={{ min: 0, max: 20 }}
            value={playerConfig.bargain.bargainPercent}
            onChange={(e) => onBargainChange("bargainPercent", e.target.value)}
          />
          {/* <TextField
            label="砍价疲劳"
            type="number"
            size="small"
            inputProps={{ min: 0, max: 100 }}
            value={playerConfig.bargain.bargainFatigue}
            onChange={(e) => onBargainChange("bargainFatigue", e.target.value)}
          /> */}
          <TextField
            label="抬价"
            type="number"
            size="small"
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            inputProps={{ min: 0, max: 20 }}
            value={playerConfig.bargain.raisePercent}
            onChange={(e) => onBargainChange("raisePercent", e.target.value)}
          />
          {/* <TextField
            label="抬价疲劳"
            type="number"
            size="small"
            inputProps={{ min: 0, max: 100 }}
            value={playerConfig.bargain.raiseFatigue}
            onChange={(e) => onBargainChange("raiseFatigue", e.target.value)}
          /> */}
        </Box>
        <Typography>声望等级：影响税收与单票商品购入量</Typography>
        <Box className="m-4">
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
      </Box>

      {Object.keys(cityGroupedExchanges).map((fromCity) => {
        return (
          <div key={fromCity}>
            {Object.keys(cityGroupedExchanges[fromCity]).map((toCity) => {
              return (
                <div
                  key={`table-${fromCity}-${toCity}`}
                  className="p-2 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto my-2 w-full"
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
                          <TableCell align="right">数量</TableCell>
                          <TableCell align="right">单票利润</TableCell>
                          <TableCell align="right">单票累计利润</TableCell>
                          <TableCell align="right">单票累计仓位</TableCell>
                          <TableCell align="right">补货累计利润</TableCell>
                          <TableCell align="right">补货累计仓位</TableCell>
                          <TableCell align="right">补货次数</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cityGroupedExchanges[fromCity][toCity].map((row) => (
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
    </ThemeProvider>
  );
}
