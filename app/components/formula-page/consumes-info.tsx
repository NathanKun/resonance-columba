import { FormulaProduce, PriceItem } from "@/interfaces/formula-page";
import { Box, Typography } from "@mui/material";
import { VariationColor } from "../MuiThemeProvider";
import MaterialBlock from "./material-block";

interface ConsumesInfoProps {
  formulaOfLevelIndex: number;
  produceName: string;
  consumes: FormulaProduce[];
  consumesPrimary: FormulaProduce[];
  findBuyPrice: (product: string) => PriceItem | null;
  getVariationColor: (variation: number) => VariationColor;
}

export default function ConsumesInfo(props: ConsumesInfoProps) {
  const { consumes, consumesPrimary, formulaOfLevelIndex, produceName, findBuyPrice, getVariationColor } = props;

  return (
    <>
      <Box className="my-2">
        <Typography>原料：</Typography>
        {consumes.map((item) => {
          return (
            <MaterialBlock
              key={`${produceName}-${formulaOfLevelIndex}-consumes-${item.product}`}
              item={item}
              showVariation={false}
              findBuyPrice={findBuyPrice}
              getVariationColor={getVariationColor}
            />
          );
        })}
      </Box>
      <Box className="my-2">
        <Typography>初级原料：</Typography>
        {consumesPrimary.map((item) => {
          return (
            <MaterialBlock
              key={`${produceName}-${formulaOfLevelIndex}-consumesprimary-${item.product}`}
              item={item}
              showVariation={true}
              findBuyPrice={findBuyPrice}
              getVariationColor={getVariationColor}
            />
          );
        })}
      </Box>
    </>
  );
}
