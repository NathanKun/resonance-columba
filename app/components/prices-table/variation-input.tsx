import OutlinedInput from "@mui/material/OutlinedInput";
import { useState } from "react";

export default function VariationInput(props: any) {
  const { value: variation, save, cancel } = props;
  const [value, setValue] = useState(variation ?? 100);

  const onBlur = (event: any) => {
    const value = event.target.value;
    if (validate(value)) {
      save(parseInt(value));
    } else {
      cancel();
    }
  };

  const validate = (value: string) => {
    if (value.endsWith("%")) {
      value = value.slice(0, -1);
    }
    const newValue = parseInt(value);
    if (isNaN(newValue) || newValue < 70 || newValue > 130) {
      return false;
    }
    return true;
  };

  return (
    <OutlinedInput
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={onBlur}
      type="number"
      autoFocus
      size="small"
      inputProps={{
        min: 70,
        max: 130,
      }}
      sx={{
        "&": {
          fontSize: "0.7rem",
        },
        '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
          "-webkit-appearance": "none",
        },
        "& input[type=number]": {
          padding: "0.3rem",
        },
      }}
    />
  );
}
