import { PricesTableHiddenProducts, ProductRow } from "@/interfaces/prices-table";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import { MRT_Column, MRT_Row } from "material-react-table";
import { ReactNode } from "react";

const HideProductButton = (props: { hidden: boolean; onClick: () => void }) => {
  const { hidden, onClick } = props;

  return (
    <IconButton onClick={onClick} size="small" className="py-0 text-xs">
      {hidden ? <VisibilityOff /> : <Visibility />}
    </IconButton>
  );
};

const ProductNameCell = (
  showHideProductButton: boolean,
  pricesTableHiddenProduct: PricesTableHiddenProducts,
  setPricesTableHiddenProducts: (hiddenProducts: PricesTableHiddenProducts) => void
) => {
  const cmp = (props: {
    renderedCellValue: ReactNode;
    row: MRT_Row<ProductRow>;
    column: MRT_Column<ProductRow, unknown>;
  }) => {
    const { renderedCellValue: value, row, column } = props;
    const city = row.original.sourceCity;
    const productName = row.original.productName;
    const isHidden = showHideProductButton && pricesTableHiddenProduct[city]?.includes(productName);
    const hideOnClick = () => {
      if (isHidden) {
        const newHiddenProducts = {
          ...pricesTableHiddenProduct,
          [city]: pricesTableHiddenProduct[city].filter((p) => p !== productName),
        };
        setPricesTableHiddenProducts(newHiddenProducts);
      } else {
        const newHiddenProducts = {
          ...pricesTableHiddenProduct,
          [city]: [...(pricesTableHiddenProduct[city] || []), productName],
        };
        setPricesTableHiddenProducts(newHiddenProducts);
      }
    };

    return (
      <>
        {showHideProductButton && <HideProductButton hidden={isHidden} onClick={hideOnClick} />}
        <span>{value}</span>
      </>
    );
  };

  cmp.displayName = "ProductNameCell";

  return cmp;
};

export default ProductNameCell;
