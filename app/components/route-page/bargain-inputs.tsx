import { PlayerConfig } from "@/interfaces/player-config";
import InputAdornment from "@mui/material/InputAdornment";
import NumberInput from "./number-input";

export default function BargainInputs(props: {
  playerConfig: PlayerConfig;
  onBargainChange: (field: string, value: number) => void;
}) {
  const { playerConfig, onBargainChange } = props;
  return (
    <>
      <NumberInput
        label="抬价"
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        min={0}
        max={20}
        step={0.1}
        defaultValue={0}
        type="float"
        decimalPlaces={1}
        value={playerConfig.bargain.raisePercent}
        setValue={(newValue) => onBargainChange("raisePercent", newValue)}
      />
      <NumberInput
        label="抬价疲劳"
        min={0}
        max={100}
        defaultValue={0}
        type="integer"
        value={playerConfig.bargain.raiseFatigue}
        setValue={(newValue) => onBargainChange("raiseFatigue", newValue)}
      />
      <NumberInput
        label="砍价"
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        min={0}
        step={0.1}
        max={20}
        defaultValue={0}
        type="float"
        decimalPlaces={1}
        value={playerConfig.bargain.bargainPercent}
        setValue={(newValue) => onBargainChange("bargainPercent", newValue)}
      />
      <NumberInput
        label="砍价疲劳"
        min={0}
        max={100}
        defaultValue={0}
        type="integer"
        value={playerConfig.bargain.bargainFatigue}
        setValue={(newValue) => onBargainChange("bargainFatigue", newValue)}
      />
    </>
  );
}
