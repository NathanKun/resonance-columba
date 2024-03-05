import { ProductRow } from "@/interfaces/prices-table";
import { MRT_Column, MRT_Row } from "material-react-table";
import { ReactNode } from "react";

export default function VariationCell(props: {
  renderedCellValue: ReactNode;
  row: MRT_Row<ProductRow>;
  column: MRT_Column<ProductRow, unknown>;
}) {
  const { renderedCellValue: value, row, column } = props;

  // if the product is craftable & the cell is in it's source city, don't show variation
  if (row.original.craftable && column.id === "source-variation") {
    return <span>制造</span>;
  }

  return (
    <span>
      {value}
      {value ? "%" : ""}
    </span>
  );
}
