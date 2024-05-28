import { FormulaProduce, PriceItem } from "@/interfaces/formula-page";
import { Box, Chip, Typography } from "@mui/material";
import { VariationColor } from "../MuiThemeProvider";

interface MaterialBlockProps {
  item: FormulaProduce;
  showVariation: boolean;
  findBuyPrice: (product: string) => PriceItem | null;
  getVariationColor: (variation: number) => VariationColor;
}

export default function MaterialBlock(props: MaterialBlockProps) {
  const { item, showVariation, findBuyPrice, getVariationColor } = props;
  const buy = showVariation ? findBuyPrice(item.product) : null;
  const variation = buy?.variation;
  const numRounded = Number(item.num.toFixed(2));
  return (
    <Box key={item.product} className="inline-block pr-4">
      <Typography component="span" className="align-middle">
        {item.product}
      </Typography>
      <Chip label={numRounded} size="small" className="mx-1" />
      {variation && <Chip label={`${variation}%`} size="small" color={getVariationColor(variation)} />}
    </Box>
  );
}
