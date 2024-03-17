import { OneGraphRouteDialogProps, OnegraphCityRecommendationDetail } from "@/interfaces/route-page";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/system/Box";
import * as React from "react";

interface DisplayData {
  profit: number;
  fatigue: number;
  profitPerFatigue: number;
  buyProducts: string;
  fillCargoProduct?: string; // if use noRestockRoute or no isForFillCargo exchange in exchanges, fillCargoProduct is undefined
  accumulatedLot: number;
  restockCount: number;
}

export default function OneGraphRouteDialog(props: OneGraphRouteDialogProps) {
  const { open, setOpen, data } = props;
  if (!data) {
    return null;
  }

  const { fromCity, toCity, onegraphData, playerConfig, goAndReturn } = data;
  const { goReco, returnReco, totalProfit, totalFatigue, totalProfitPerFatigue } = onegraphData;
  const { bargain } = playerConfig;
  const { bargainFatigue, raiseFatigue } = bargain;

  const buildDisplayData = (reco: OnegraphCityRecommendationDetail): DisplayData => {
    const hasExchanges = reco.exchanges && reco.exchanges.length > 0;
    const goDisplayData: DisplayData = {
      profit: reco.profit,
      fatigue: reco.fatigue,
      profitPerFatigue: reco.profitPerFatigue,
      buyProducts: hasExchanges
        ? reco
            .exchanges!.filter((e) => !e.isForFillCargo)
            .map((e) => e.product)
            .join(", ")
        : reco.noRestockRoute.products.join(", "),
      fillCargoProduct: reco.exchanges?.find((e) => e.isForFillCargo)?.product ?? undefined,
      accumulatedLot: hasExchanges ? reco.exchanges?.at(-1)?.restockAccumulatedLot ?? 0 : reco.noRestockRoute.totalLot,
      restockCount: hasExchanges ? reco.exchanges?.at(-1)?.restockCount ?? 0 : 0,
    };

    return goDisplayData;
  };

  const hasReturn = goAndReturn && returnReco;
  const goDisplayData = buildDisplayData(goReco);
  const returnDisplayData = goAndReturn && returnReco ? buildDisplayData(returnReco) : undefined;
  const totalDisplayData =
    goAndReturn && returnReco
      ? {
          profit: totalProfit,
          fatigue: totalFatigue,
          profitPerFatigue: totalProfitPerFatigue,
          restockCount: goDisplayData.restockCount + returnDisplayData!.restockCount,
        }
      : undefined;

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
            <DialogContentText>剩余舱位填舱产品：{goDisplayData.fillCargoProduct}</DialogContentText>
            <DialogContentText>所需舱位：{goDisplayData.accumulatedLot}</DialogContentText>
            <DialogContentText>
              疲劳：{goDisplayData.fatigue}
              {bargainFatigue || raiseFatigue ? ` (抬价砍价占${bargainFatigue + raiseFatigue})` : ""}
            </DialogContentText>
            <DialogContentText>利润/疲劳：{goDisplayData.profitPerFatigue}</DialogContentText>
          </Box>
          {hasReturn && returnDisplayData && (
            <>
              <Box className="m-8">
                <DialogContentText>回程利润：{returnDisplayData.profit}</DialogContentText>
                <DialogContentText>回程进货书需求：{returnDisplayData.restockCount}</DialogContentText>
                <DialogContentText>需要购买的产品：{returnDisplayData.buyProducts}</DialogContentText>
                <DialogContentText>剩余舱位填舱产品：{returnDisplayData.fillCargoProduct}</DialogContentText>
                <DialogContentText>所需舱位：{returnDisplayData.accumulatedLot}</DialogContentText>
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
