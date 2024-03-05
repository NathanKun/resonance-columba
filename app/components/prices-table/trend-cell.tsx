export default function TrendCell(props: any) {
  const { renderedCellValue: value, row, column } = props;

  // if the product is craftable & the cell is in it's source city, don't show trend
  if (row.original.craftable && column.id === "source-trend") {
    return null;
  }

  let text,
    background = "";
  if (value === "up") {
    background = "lightgreen";
    text = "↑";
  } else if (value === "down") {
    background = "lightcoral";
    text = "↓";
  }
  return (
    <span style={{ color: "white", background, padding: "5px 10px", display: "block", textAlign: "center" }}>
      {text}
    </span>
  );
}
