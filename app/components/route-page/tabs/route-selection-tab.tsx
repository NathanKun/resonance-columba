import { CITIES, CityName } from "@/data/Cities";
import { PlayerConfig } from "@/interfaces/player-config";
import { CityGroupedExchanges } from "@/interfaces/route-page";
import { getBestRoutesByNumberOfBuyingProductTypes } from "@/utils/route-page-utils";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useMemo, useState } from "react";

export interface RouteSelectionTabProps {
  playerConfig: PlayerConfig;
  cityGroupedExchangesAllTargetCities: CityGroupedExchanges;
}

export default function RouteSelectionTab(props: RouteSelectionTabProps) {
  /* props */
  const { playerConfig, cityGroupedExchangesAllTargetCities } = props;

  /* states */
  const [selectedCityForReco, setSelectedCityForReco] = useState<CityName>("any");

  /* calculation */
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
    <>
      <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
        <div className="flex justify-between items-center mb-4">
          <Typography component="h3">
            选择一个起始城市查看从这个城市出发的最优线路，或选择 任意 查看整体最优线路。
          </Typography>
        </div>
        <div className="flex flex-col">
          <Typography className="py-1">需要填写个性化设置。</Typography>
          <Typography className="py-1">选择购买的商品种类越多，所需进货书越少，但利润一般也越低。</Typography>
          <Typography className="py-1">
            算法对进货书的使用方式与一图流不同，以不浪费为目的，即会确保能买完所有进货的商品才会使用进货书，最后再用下一利润顺位的商品来补满仓。
          </Typography>
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
    </>
  );
}
