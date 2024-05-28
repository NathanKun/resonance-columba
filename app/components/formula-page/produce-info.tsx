import { Formula } from "@/data/Formulas";
import { FormulaProduce, PriceItem } from "@/interfaces/formula-page";
import { Box, Chip, Typography } from "@mui/material";

interface ProduceInfoProps {
  formulaOfLevel: Formula;
  consumesPrimary: FormulaProduce[];
  findBuyPrice: (product: string) => PriceItem | null;
  findSellPrice: (product: string) => PriceItem | null;
}

export default function ProduceInfo(props: ProduceInfoProps) {
  const { formulaOfLevel, consumesPrimary, findBuyPrice, findSellPrice } = props;

  return (
    <Box className="my-2">
      <Typography>产出：</Typography>
      <Typography component="span" className="align-middle">
        {formulaOfLevel.produce.product}
      </Typography>
      <Chip label={formulaOfLevel.produce.num} size="small" className="mx-1" />
      <Typography>额外概率产出：</Typography>
      <Typography component="span" className="align-middle">
        {formulaOfLevel.extraProduces.product}
      </Typography>
      <Chip
        label={`${formulaOfLevel.extraProduces.min}-${formulaOfLevel.extraProduces.max}`}
        size="small"
        className="mx-1"
      />
      <Chip label={`${formulaOfLevel.extraProduces.chance * 100}%`} size="small" className="mx-1" />
    </Box>
  );
}
