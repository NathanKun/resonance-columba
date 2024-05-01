import { Menu } from "@mui/material";
import { useState, forwardRef, useImperativeHandle } from "react";

export interface ContextMenuRef {
  open: (event: React.MouseEvent | Pick<React.MouseEvent, "clientX" | "clientY">) => void;
}

interface ContextMenuProps {
  children?: React.ReactNode;
  handleClose?: () => void;
}

export default forwardRef<ContextMenuRef, ContextMenuProps>(function ContextMenu(props, ref) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useImperativeHandle<ContextMenuRef, ContextMenuRef>(ref, () => {
    return {
      open: (event) => {
        (event as any).preventDefault?.();
        setPosition(
          position === null
            ? {
                top: event.clientY - 6,
                left: event.clientX + 2,
              }
            : null
        );
      },
    };
  });

  const handleClose = () => {
    setPosition(null);
    props.handleClose?.();
  };

  const handleMenuClick = ({ target }: React.MouseEvent) => {
    if (target instanceof HTMLElement && target.tagName === "LI") {
      handleClose();
    }
  };

  return (
    <Menu
      open={position !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={position ?? undefined}
      onClick={handleMenuClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {props.children}
    </Menu>
  );
});
