import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export default function TrendCell(props: any) {
  const { renderedCellValue: value, row, column } = props;

  // if the product is craftable & the cell is in it's source city, don't show trend
  if (row.original.craftable && column.id === "source-trend") {
    return null;
  }

  let icon;

  if (value === "up") {
    icon = <TrendingUpIcon />;
  } else if (value === "down") {
    icon = <TrendingDownIcon />;
  }

  return <span style={{ display: "block", textAlign: "center" }}>{icon}</span>;
}
