/* @flow */

import { OutlinedInputProps, TextField } from "@mui/material";
import numbro from "numbro";
import { useEffect, useState } from "react";

// <NumberInput value={VALUE_TYPE} />
//
// NumberInput takes in a number or a null value; Null value indicates that the
// input is empty i.e., '' in traditional react <input /> world. onChange event
// also takes in the VALUE_TYPE.
type VALUE_TYPE = number | undefined;

const toFormattedString = (value: VALUE_TYPE): string => {
  if (value === undefined || value === null) {
    return "";
  }

  let boxed = numbro(value);
  if (isNaN(boxed.value())) {
    return "";
  }

  return boxed.format();
};

const toValue = (value: string): VALUE_TYPE => {
  if (!value) {
    return undefined;
  }

  const unformatted = numbro.unformat(value);
  return unformatted;
};

const normalisedValue = (value: string): VALUE_TYPE => toValue(toFormattedString(toValue(value)));

const constrainedValue = (value: VALUE_TYPE, min: VALUE_TYPE, max: VALUE_TYPE): VALUE_TYPE => {
  if (value === undefined) {
    return undefined;
  }

  if (min !== undefined && value < min) {
    return min;
  }

  if (max !== undefined && value > max) {
    return max;
  }

  return value;
};

/// react-number-input
/// <NumberInput value={0}    /> => [    0]
/// <NumberInput value={null} /> => [     ]
/// <NumberInput value={1000} /> => [ 1000]
///
/// <input /> field which maps to a value of type `number`.

type Props = {
  label: string;
  value: VALUE_TYPE;
  min: number;
  max: number;
  defaultValue: number;
  type: "integer" | "float";
  decimalPlaces?: number;
  InputProps?: Partial<OutlinedInputProps>;

  setValue: (value: number, event: any) => void;
};

export default function NumberInput(props: Props) {
  const { type, value, label, min, max, defaultValue, InputProps, setValue } = { ...props };
  const decimalPlaces = props.decimalPlaces ?? 1;

  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(toFormattedString(value));
  const displayValue = focused ? internalValue ?? "" : toFormattedString(toValue(internalValue));

  useEffect(() => {
    // Prevent changing value via props when input is focused.
    if (!focused) {
      setInternalValue(toFormattedString(value));
    }
  }, [focused, value]);

  // on blur, change the format to formatted number,
  // and apply constraints
  const onBlur = (event: any) => {
    setFocused(false);

    // constraint the value if input is a number, or return undefined
    let newValue = constrainedValue(normalisedValue(internalValue), min, max);

    // if the value is undefined, set it to the default value
    if (newValue === undefined) {
      newValue = defaultValue;
    }

    // if the type is integer, floor the number
    if (type === "integer") {
      newValue = Math.floor(newValue);
    } else {
      // if the type is float, round the number to the decimal places
      newValue = parseFloat(newValue.toFixed(decimalPlaces));
    }

    // convert the number to formatted string
    let newInternalValue = toFormattedString(newValue);

    // set internal value state
    setInternalValue(newInternalValue);

    // call setValue from props
    setValue(newValue, event);
  };

  // on focus, change the format to unformatted editable number
  const onFocus = (event: any) => {
    let value = toValue(internalValue);

    if (typeof value !== "number") {
      value = defaultValue;
    }

    setFocused(true);
    setInternalValue("" + value);
  };

  // on change, update the internal value, do not do any constraints here,
  // just let the user type in whatever they want.
  // onBlur will handle the constraints.
  const onChange = (event: any) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
  };

  return (
    <TextField
      type="tel"
      size="small"
      variant="outlined"
      label={label}
      value={displayValue}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={onChange}
      InputProps={InputProps}
    />
  );
}
