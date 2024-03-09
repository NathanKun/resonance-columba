import { PriceContext } from "@/app/price-provider";
import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import { pink } from "@mui/material/colors";
import { alpha } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import { Fragment, useContext, useState } from "react";

export default function V2PricesSwitch() {
  const { isV2Prices, setUseV2Prices } = useContext(PriceContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pathname = usePathname();
  const allowedPaths = ["/"];

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setUseV2Prices(checked);

    if (checked) {
      setDialogOpen(true);
    }
  };

  return (
    allowedPaths.includes(pathname) && ( // Only show the switch on pages which use price data
      <Fragment>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={isV2Prices}
                onChange={handleChange}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: pink[300],
                    "&:hover": {
                      backgroundColor: alpha(pink[300], 0.5),
                    },
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: pink[300],
                  },
                }}
              />
            }
            label={<Typography fontSize="14px">新版数据</Typography>}
          />
        </FormGroup>
        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          aria-labelledby="v2-prices-usage-alert-dialog-title"
          aria-describedby="v2-prices-usage-alert-dialog-description"
        >
          <DialogTitle id="v2-prices-usage-alert-dialog-title">{"神秘的索思学会数据传输技术？"}</DialogTitle>
          <DialogContent>
            <DialogContentText className="pb-2">科伦巴商会与索思学会达成协作</DialogContentText>
            <DialogContentText className="pb-2">
              利用索斯学会神秘的数据传输技术，位于各地的商会似乎可以更快速的将当地交易所数据传输到科伦巴商会的数据中心，
              而不再需要各位列车长手动输入数据。
            </DialogContentText>
            <DialogContentText className="pb-2">
              对于该技术的原理科伦巴商会完全不清楚，也无法保证数据的准确性。
            </DialogContentText>
            <DialogContentText className="pb-2">
              若发现数据有误，请在讨论区中反馈给科伦巴商会，或在Github中提交issue。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} autoFocus>
              知道啦知道啦
            </Button>
          </DialogActions>
        </Dialog>
      </Fragment>
    )
  );
}
