import { PRODUCTS } from "@/data/Products";
import { OneGraphRouteDialogProps, OnegraphBuyCombinationStats } from "@/interfaces/route-page";
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
  profitOrder: string;
  usedLot: number;
  restockCount: number;
  profitPerRestock: number;
  isWastingRestock: boolean;
  lastNotWastingRestock: number;
}

export default function OneGraphRouteDialog(props: OneGraphRouteDialogProps) {
  const { open, setOpen, data } = props;
  if (!data) {
    return null;
  }

  const { stats, playerConfig, fromCity, toCity } = data;
  const { simpleGo: simpleGoData, goAndReturn: goAndReturnData, goAndReturnTotal: goAndReturnTotalData } = stats;
  const { bargain, returnBargain } = playerConfig;
  const { bargainFatigue: bargainFatigueGo, raiseFatigue: raiseFatigueGo, disabled: goBargainDisabled } = bargain;
  const { bargainFatigue: bargainFatigueRt, raiseFatigue: raiseFatigueRt, disabled: rtBargainDisabled } = returnBargain;
  const bargainFatigueTotalGo = goBargainDisabled ? 0 : (bargainFatigueGo ?? 0) + (raiseFatigueGo ?? 0);
  const bargainFatigueTotalRt = rtBargainDisabled ? 0 : (bargainFatigueRt ?? 0) + (raiseFatigueRt ?? 0);
  const bargainFatigueTotal = bargainFatigueTotalGo + bargainFatigueTotalRt;
  const goAndReturn = playerConfig.onegraph.goAndReturn;

  const buildDisplayData = (stats: OnegraphBuyCombinationStats): DisplayData => {
    // display products ordered base on profit
    const profitOrder = stats.combinations.map((c) => c.name).join(", ");

    // display products orderd base on in-game order
    const buyProducts = stats.combinations
      // find the index in data of the product
      .map((c) => {
        const dataIndex = PRODUCTS.findIndex((p) => p.name === c.name);
        return {
          dataIndex,
          ...c,
        };
      })
      // sort by index, to make it has the same order in game, instead of sorted by profit
      .sort((a, b) => a.dataIndex - b.dataIndex)
      // map to name for display
      .map((c) => {
        const { name, buyLot, availableLot } = c;

        if (buyLot < availableLot) {
          return `${name} (买${buyLot} / 总${availableLot})`;
        }

        return `${name}`;
      })
      .join(", ");
    return {
      profit: stats.profit,
      fatigue: stats.fatigue,
      profitPerFatigue: stats.profitPerFatigue,
      profitPerRestock: stats.profitPerRestock,
      buyProducts,
      profitOrder,
      usedLot: stats.usedLot,
      restockCount: stats.restock,
      isWastingRestock: stats.lastNotWastingRestock !== stats.restock,
      lastNotWastingRestock: stats.lastNotWastingRestock,
    } as DisplayData;
  };

  const goDisplayData = buildDisplayData(goAndReturn ? goAndReturnData[0] : simpleGoData);
  const returnDisplayData = goAndReturn ? buildDisplayData(goAndReturnData[1]) : undefined;
  const totalDisplayData = (() => {
    if (!goAndReturn) {
      return undefined;
    }
    const { profit, fatigue, profitPerFatigue, profitPerRestock, restock } = goAndReturnTotalData;
    return {
      profit,
      fatigue,
      profitPerFatigue,
      profitPerRestock,
      restockCount: restock,
    };
  })();

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Dialog fullWidth={true} maxWidth="xl" open={open} onClose={handleClose}>
        <DialogTitle className="flex items-center">
          {fromCity} <RouteOutlinedIcon className="px-4 text-6xl" /> {toCity}
        </DialogTitle>
        <DialogContent>
          <Box className="m-8">
            <DialogContentText>利润：{goDisplayData.profit}</DialogContentText>
            <DialogContentText>进货书需求：{goDisplayData.restockCount}</DialogContentText>
            {goDisplayData.isWastingRestock && (
              <DialogContentText className="text-red-500">
                进货过多！会浪费进货书。使用超过{goDisplayData.lastNotWastingRestock}本进货书后不会再产生收益。
              </DialogContentText>
            )}
            <DialogContentText>需要购买的产品：{goDisplayData.buyProducts}</DialogContentText>
            <DialogContentText>产品利润顺位：{goDisplayData.profitOrder}</DialogContentText>
            <DialogContentText>所需舱位：{goDisplayData.usedLot}</DialogContentText>
            <DialogContentText>
              疲劳：{goDisplayData.fatigue}
              {bargainFatigueTotalGo > 0 ? ` (议价占${bargainFatigueTotalGo})` : ""}
            </DialogContentText>
            <DialogContentText>利润/疲劳：{goDisplayData.profitPerFatigue}</DialogContentText>
            {goDisplayData.restockCount > 0 && (
              <DialogContentText>利润/进货书：{goDisplayData.profitPerRestock}</DialogContentText>
            )}
          </Box>
          {goAndReturn && returnDisplayData && (
            <>
              <Box className="m-8">
                <DialogContentText>回程利润：{returnDisplayData.profit}</DialogContentText>
                <DialogContentText>回程进货书需求：{returnDisplayData.restockCount}</DialogContentText>
                {returnDisplayData.isWastingRestock && (
                  <DialogContentText className="text-red-500">
                    进货过多！会浪费进货书。最多使用超过{returnDisplayData.lastNotWastingRestock}
                    本进货书后不会再产生收益。
                  </DialogContentText>
                )}
                <DialogContentText>需要购买的产品：{returnDisplayData.buyProducts}</DialogContentText>
                <DialogContentText>产品利润顺位：{returnDisplayData.profitOrder}</DialogContentText>
                <DialogContentText>所需舱位：{returnDisplayData.usedLot}</DialogContentText>
                <DialogContentText>
                  回程疲劳：{returnDisplayData.fatigue}
                  {bargainFatigueTotalRt > 0 ? ` (议价占${bargainFatigueTotalRt})` : ""}
                </DialogContentText>
                <DialogContentText>回程利润/疲劳：{returnDisplayData.profitPerFatigue}</DialogContentText>
                {returnDisplayData.restockCount > 0 && (
                  <DialogContentText>回程利润/进货书：{returnDisplayData.profitPerRestock}</DialogContentText>
                )}
              </Box>
              <Box className="m-8">
                <DialogContentText>总利润：{totalDisplayData!.profit}</DialogContentText>
                <DialogContentText>总进货书需求：{totalDisplayData!.restockCount}</DialogContentText>
                <DialogContentText>
                  总疲劳：{totalDisplayData!.fatigue}
                  {bargainFatigueTotal > 0 ? ` (议价占${bargainFatigueTotal})` : ""}
                </DialogContentText>
                <DialogContentText>
                  总利润/总疲劳：
                  {totalDisplayData!.profitPerFatigue}
                </DialogContentText>
                {totalDisplayData!.profitPerRestock > 0 && (
                  <DialogContentText>
                    总利润/总进货书：
                    {totalDisplayData!.profitPerRestock}
                  </DialogContentText>
                )}
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
