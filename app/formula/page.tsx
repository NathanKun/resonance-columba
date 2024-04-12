import { FORMULAS } from "@/data/Formulas";
import { Box, Typography } from "@mui/material";
// import { useContext } from "react";
// import { PriceContext } from "../price-provider";

export default function FormulaPage() {
  // const playerConfig = usePlayerConfig();
  // const { prices } = useContext(PriceContext);
  const formulas = FORMULAS;

  return (
    <Box>
      {Object.entries(formulas).map(([name, formula]) => {
        return (
          <Box key={name}>
            <Typography component="h2">{name}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}
