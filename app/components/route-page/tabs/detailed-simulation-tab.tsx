import { CITIES, CityName } from "@/data/Cities";
import { SelectedCities } from "@/interfaces/prices-table";
import { CityGroupedExchanges } from "@/interfaces/route-page";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { Box, IconButton, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MultipleSelect from "../../prices-table/multiple-select";

interface DetailedSimulationTabProps {
  selectedCities: SelectedCities;
  setSourceCities: (cities: string[]) => void;
  setTargetCities: (cities: string[]) => void;
  switchSourceAndTargetCities: () => void;
  cityGroupedExchangesSelectedTargetCities: CityGroupedExchanges;
}

export default function DetailedSimulationTab(props: DetailedSimulationTabProps) {
  const {
    selectedCities,
    setSourceCities,
    setTargetCities,
    switchSourceAndTargetCities,
    cityGroupedExchangesSelectedTargetCities,
  } = props;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-2xl mx-auto my-4 w-full box-border">
        <div className="flex justify-between items-center mb-4">
          <Typography component="h3">选择一个或多个起始城市以及终点城市，查看所有线路以及最优交易组合。</Typography>
        </div>
        <div className="flex flex-col">
          <Typography className="py-1">需要填写个性化设置。</Typography>
          <Typography className="py-1">路线中的产品已经按利润进行了排序，排第一的商品为利润最高的商品。</Typography>
          <Typography className="py-1">累计利润为当前商品以及它上面所有商品的单批利润的和。累计舱位同理。</Typography>
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
    </>
  );
}
