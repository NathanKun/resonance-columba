import IconButton from "@mui/material/IconButton";
import { ReactNode } from "react";

export default function StatedIconButton(props: {
  Icon: ReactNode;
  state: any;
  setState: (newVal: any) => void;
  buttonState: string;
  className?: string;
}) {
  const { Icon, state, setState, buttonState, className } = props;
  return (
    <IconButton
      className={className}
      onClick={() => setState(buttonState)}
      // sx={{ background: state === buttonState ? "grey" : null }}
      disabled={state === buttonState}
    >
      {Icon}
    </IconButton>
  );
}
