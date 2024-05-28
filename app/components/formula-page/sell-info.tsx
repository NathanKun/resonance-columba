import { PRODUCTS } from "@/data/Products";
import { PriceItem } from "@/interfaces/formula-page";
import { Box, Chip, Typography } from "@mui/material";
import { VariationColor } from "../MuiThemeProvider";

interface SellInfoProps {
  product: string;
  sell: PriceItem;
  getVariationColor: (variation: number) => VariationColor;
}

export default function SellInfo(props: SellInfoProps) {
  const { product, sell, getVariationColor } = props;

  if (!sell) {
    return <></>;
  }

  const { price } = sell;

  const pdt = PRODUCTS.find((item) => item.name === product);
  if (!pdt) {
    return <></>;
  }

  const sellableCities = Object.keys(pdt.sellPrices);
  if (!sellableCities.length) {
    return <></>;
  }

  let highestBasePriceCity = null;
  let highestBasePrice = 0;
  for (const city of sellableCities) {
    const price = pdt.sellPrices[city] ?? 0;
    if (price > highestBasePrice) {
      highestBasePrice = price;
      highestBasePriceCity = city;
    }
  }

  if (highestBasePrice === 0) {
    return <></>;
  }

  const theoryHighestVariation = 1.2;
  const theoryHighestPrice = Math.round(highestBasePrice * theoryHighestVariation);
  const currentPricePercentage = Math.round((price / theoryHighestPrice) * 100);

  return (
    <Box>
      <Box>
        <Typography component="span" className="align-middle">
          卖出价格：
        </Typography>
        <Typography component="span" className="mx-1 align-middle">
          {sell.city}
        </Typography>
        <Typography component="span" className="mx-1 align-middle">
          {sell.price}
        </Typography>
        <Chip label={`${sell.variation}%`} size="small" color={getVariationColor(sell.variation)} className="mx-1" />
      </Box>
      <Box>
        <Typography component="span">理论最高价格：</Typography>
        <Typography component="span" className="mx-1">
          {highestBasePriceCity}
        </Typography>
        <Typography component="span" className="mx-1">
          {theoryHighestPrice}
        </Typography>
        <Typography>当前价格占比：{currentPricePercentage}%</Typography>
      </Box>
    </Box>
  );
}
