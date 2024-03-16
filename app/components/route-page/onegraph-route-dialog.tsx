import { CityProductProfitAccumulatedExchange, Exchange, OneGraphRouteDialogProps } from "@/interfaces/route-page";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/system/Box";
import * as React from "react";

export default function OneGraphRouteDialog(props: OneGraphRouteDialogProps) {
  const { open, setOpen, data } = props;
  if (!data) {
    return null;
  }

  const { fromCity, toCity, onegraphData, playerConfig } = data;
  const { goExchanges: goExchangesAll, returnExchanges: returnExchangesAll } = onegraphData;
  const { bargain } = playerConfig;
  const { bargainFatigue, raiseFatigue } = bargain;

  const goExchanges = goExchangesAll.filter((e) => !e.isForFillCargo);
  const goFillCargoExchange = goExchangesAll.find((e) => e.isForFillCargo);
  const returnExchanges = returnExchangesAll?.filter((e) => !e.isForFillCargo);
  const returnFillCargoExchange = returnExchangesAll?.find((e) => e.isForFillCargo);

  // the last exchange has the total profit and restock data
  const goLastExchange: CityProductProfitAccumulatedExchange | undefined = goExchanges.at(-1);
  if (!goLastExchange) {
    return null;
  }

  const { restockAccumulatedProfit, restockCount } = goLastExchange;
  const productsToBuy = goExchanges.map((exchange: Exchange) => exchange.product).join(", ");
  const fatigue = goLastExchange.fatigue ?? 0;
  const profitPerFatigue = goLastExchange.profitPerFatigue ?? 0;
  const accumulatedLot = goLastExchange.restockAccumulatedLot;
  const fillCargoProduct = goFillCargoExchange?.product;

  const hasReturn = returnExchanges && returnExchanges.length > 0;
  const returnLastExchange = hasReturn ? returnExchanges.at(-1) : null;
  const returnRestockAccumulatedProfit = returnLastExchange ? returnLastExchange.restockAccumulatedProfit : 0;
  const returnRestockCount = returnLastExchange ? returnLastExchange.restockCount : 0;
  const returnProductsToBuy = hasReturn ? returnExchanges.map((exchange: Exchange) => exchange.product).join(", ") : "";
  const returnFatigue = returnLastExchange ? returnLastExchange.fatigue ?? 0 : 0;
  const returnProfitPerFatigue = returnLastExchange ? returnLastExchange.profitPerFatigue ?? 0 : 0;
  const returnAccumulatedLot = returnLastExchange ? returnLastExchange.restockAccumulatedLot : 0;
  const returnFillCargoProduct = hasReturn ? returnFillCargoExchange?.product : "";

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
            <DialogContentText>利润：{restockAccumulatedProfit}</DialogContentText>
            <DialogContentText>进货书需求：{restockCount}</DialogContentText>
            <DialogContentText>需要购买的产品：{productsToBuy}</DialogContentText>
            <DialogContentText>所需舱位：{accumulatedLot}</DialogContentText>
            <DialogContentText>剩余舱位填舱产品：{fillCargoProduct}</DialogContentText>
            <DialogContentText>
              疲劳：{fatigue}
              {bargainFatigue || raiseFatigue ? ` (抬价砍价占${bargainFatigue + raiseFatigue})` : ""}
            </DialogContentText>
            <DialogContentText>利润/疲劳：{profitPerFatigue}</DialogContentText>
          </Box>
          {hasReturn && (
            <>
              <Box className="m-8">
                <DialogContentText>回程利润：{returnRestockAccumulatedProfit}</DialogContentText>
                <DialogContentText>回程进货书需求：{returnRestockCount}</DialogContentText>
                <DialogContentText>需要购买的产品：{returnProductsToBuy}</DialogContentText>
                <DialogContentText>所需舱位：{returnAccumulatedLot}</DialogContentText>
                <DialogContentText>剩余舱位填舱产品：{returnFillCargoProduct}</DialogContentText>
                <DialogContentText>
                  回程疲劳：{returnFatigue}
                  {bargainFatigue || raiseFatigue ? ` (抬价砍价占${bargainFatigue + raiseFatigue})` : ""}
                </DialogContentText>
                <DialogContentText>回程利润/疲劳：{returnProfitPerFatigue}</DialogContentText>
              </Box>
              <Box className="m-8">
                <DialogContentText>
                  总利润：{restockAccumulatedProfit + returnRestockAccumulatedProfit}
                </DialogContentText>
                <DialogContentText>总进货书需求：{restockCount + returnRestockCount}</DialogContentText>
                <DialogContentText>
                  总疲劳：{fatigue + returnFatigue}
                  {bargainFatigue || raiseFatigue ? ` (抬价砍价占${(bargainFatigue + raiseFatigue) * 2})` : ""}
                </DialogContentText>
                <DialogContentText>
                  总利润/总疲劳：
                  {Math.round((restockAccumulatedProfit + returnRestockAccumulatedProfit) / (fatigue + returnFatigue))}
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
