import { OneGraphRouteDialogV2Props, OnegraphBuyCombinationStats } from "@/interfaces/route-page";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import { Box } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import * as React from "react";

interface DisplayData {
  profit: number;
  fatigue: number;
  profitPerFatigue: number;
  buyProducts: string;
  usedLot: number;
  restockCount: number;
  profitPerRestock: number;
}

export default function OneGraphRouteDialogV2(props: OneGraphRouteDialogV2Props) {
  const { open, setOpen, data } = props;
  if (!data) {
    return null;
  }

  const { stats, playerConfig, fromCity, toCity } = data;
  const { simpleGo: simpleGoData, goAndReturn: goAndReturnData } = stats;
  const { combinations, fatigue, profit, profitPerFatigue, profitPerRestock, restock, usedLot } = simpleGoData;
  const { bargain } = playerConfig;
  const { bargainFatigue, raiseFatigue } = bargain;
  const goAndReturn = playerConfig.onegraph.goAndReturn;

  const buildDisplayData = (stats: OnegraphBuyCombinationStats): DisplayData => {
    return {
      profit: stats.profit,
      fatigue: stats.fatigue,
      profitPerFatigue: stats.profitPerFatigue,
      profitPerRestock: stats.profitPerRestock,
      buyProducts: stats.combinations.map((c) => c.name).join(", "),
      usedLot: stats.usedLot,
      restockCount: stats.restock,
    } as DisplayData;
  };

  const goDisplayData = buildDisplayData(goAndReturn ? goAndReturnData[0] : simpleGoData);
  const returnDisplayData = goAndReturn ? buildDisplayData(goAndReturnData[1]) : undefined;
  const totalDisplayData = (() => {
    if (!goAndReturn) {
      return undefined;
    }
    const totalProfit = goDisplayData.profit + returnDisplayData!.profit;
    const totalFatigue = goDisplayData.fatigue + returnDisplayData!.fatigue;
    const profitPerFatigue = totalProfit / totalFatigue;
    return {
      profit: totalProfit,
      fatigue: totalFatigue,
      profitPerFatigue: profitPerFatigue,
      restockCount: goDisplayData.restockCount + returnDisplayData!.restockCount,
    };
  })();

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Dialog fullWidth={true} maxWidth="xl" open={open} onClose={handleClose}>
        <DialogTitle>
          {fromCity} <RouteOutlinedIcon /> {toCity}
        </DialogTitle>
        <DialogContent>
          <Box className="m-8">
            <DialogContentText>利润：{goDisplayData.profit}</DialogContentText>
            <DialogContentText>进货书需求：{goDisplayData.restockCount}</DialogContentText>
            <DialogContentText>需要购买的产品：{goDisplayData.buyProducts}</DialogContentText>
            <DialogContentText>所需舱位：{goDisplayData.usedLot}</DialogContentText>
            <DialogContentText>
              疲劳：{goDisplayData.fatigue}
              {bargainFatigue || raiseFatigue ? ` (抬价砍价占${bargainFatigue + raiseFatigue})` : ""}
            </DialogContentText>
            <DialogContentText>利润/疲劳：{goDisplayData.profitPerFatigue}</DialogContentText>
          </Box>
          {goAndReturn && returnDisplayData && (
            <>
              <Box className="m-8">
                <DialogContentText>回程利润：{returnDisplayData.profit}</DialogContentText>
                <DialogContentText>回程进货书需求：{returnDisplayData.restockCount}</DialogContentText>
                <DialogContentText>需要购买的产品：{returnDisplayData.buyProducts}</DialogContentText>
                <DialogContentText>所需舱位：{returnDisplayData.usedLot}</DialogContentText>
                <DialogContentText>
                  回程疲劳：{returnDisplayData.fatigue}
                  {bargainFatigue || raiseFatigue ? ` (抬价砍价占${bargainFatigue + raiseFatigue})` : ""}
                </DialogContentText>
                <DialogContentText>回程利润/疲劳：{returnDisplayData.profitPerFatigue}</DialogContentText>
              </Box>
              <Box className="m-8">
                <DialogContentText>总利润：{totalDisplayData!.profit}</DialogContentText>
                <DialogContentText>总进货书需求：{totalDisplayData!.restockCount}</DialogContentText>
                <DialogContentText>
                  总疲劳：{totalDisplayData!.fatigue}
                  {bargainFatigue || raiseFatigue ? ` (抬价砍价占${(bargainFatigue + raiseFatigue) * 2})` : ""}
                </DialogContentText>
                <DialogContentText>
                  总利润/总疲劳：
                  {totalDisplayData!.profitPerFatigue}
                </DialogContentText>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>关闭</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
