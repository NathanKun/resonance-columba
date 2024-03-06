import { trends } from "@/interfaces/trend";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function TrendInput(props: any) {
  const { value: selected, save } = props;

  const onBlur = (event: any) => {
    save(selected);
  };

  return (
    <ToggleButtonGroup value={selected} exclusive aria-label="price trend" onBlur={onBlur} autoFocus size="small">
      {trends.map((trend) => (
        <ToggleButton
          key={"trend-input-toogle-button-" + trend}
          value={trend}
          aria-label="left aligned"
          onClick={() => save(trend)}
          sx={{
            "&": {
              padding: "0.25rem",
            },
          }}
        >
          {trend === "up" ? <TrendingUpIcon /> : <TrendingDownIcon />}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
