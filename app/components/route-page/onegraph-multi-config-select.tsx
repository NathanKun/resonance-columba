import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import useOnegraphMultiConfig, { OnegraphMultiConfigItem } from "@/hooks/useOnegraphMultiConfig";
import type { PlayerConfig } from "@/interfaces/player-config";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ContextMenu, { ContextMenuRef } from "../context-menu";

interface OnegraphMultiConfigSelectProps {
  playerConfig: PlayerConfig;
  onPlayerConfigChange: (field: string, value: any) => void;
}

export default function OnegraphMultiConfigSelect({
  playerConfig,
  onPlayerConfigChange,
}: OnegraphMultiConfigSelectProps) {
  const IS_IOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.platform), []);

  const menuRef = useRef<ContextMenuRef>(null);
  const menuActiveConfig = useRef<OnegraphMultiConfigItem>();
  const longPressTimer = useRef<NodeJS.Timeout>();

  const { multiConfig, addMultiConfig, removeMultiConfig, applyMultiConfig, renameMultiConfig, updateMultiConfig } =
    useOnegraphMultiConfig({
      playerConfig,
      onPlayerConfigChange,
    });
  const [renameOldName, setRenameOldName] = useState<string | null>(null);
  const [openHelp, setOpenHelp] = useState(false);
  const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  const markIsTouch = () => {
    if (!isTouch) setIsTouch(true);
  };

  const handleContextMenu = (e: Parameters<ContextMenuRef["open"]>["0"], config: OnegraphMultiConfigItem) => {
    menuActiveConfig.current = config;
    menuRef.current?.open(e);
  };

  const handleStartLongPress = (e: React.TouchEvent, config: OnegraphMultiConfigItem) => {
    if (longPressTimer.current) return;
    markIsTouch();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = undefined;
      handleContextMenu(e.touches[0], config);
    }, 400);
  };

  const handleEndLongPress = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  };

  const handlePreventTouchEvent = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  const handleRemoveConfig = () => {
    if (!menuActiveConfig.current) return;
    removeMultiConfig(menuActiveConfig.current);
  };

  const handleOpenRenameDialog = () => {
    if (!menuActiveConfig.current) return;
    setRenameOldName(menuActiveConfig.current.name);
  };

  const handleRename = (name: string) => {
    if (!menuActiveConfig.current) return;
    renameMultiConfig(menuActiveConfig.current, name);
  };

  const handleUpdateConfig = () => {
    if (!menuActiveConfig.current) return;
    updateMultiConfig(menuActiveConfig.current);
  };

  const handleOpenHelp = (e: React.MouseEvent<HTMLButtonElement>) => {
    setHelpAnchorEl(e.currentTarget);
    setOpenHelp(true);
  };

  const getButtonContextmenuListener = (config: OnegraphMultiConfigItem): ComponentProps<typeof Button> =>
    IS_IOS
      ? // iOS won't dispatch contextmenu event
        {
          onTouchStart: (e) => handleStartLongPress(e, config),
          onTouchMove: handlePreventTouchEvent,
          onTouchEnd: handleEndLongPress,
          onTouchCancel: handleEndLongPress,
        }
      : // PC right click or Android long press will dispatch
        {
          onContextMenu: (e) => handleContextMenu(e, config),
          onTouchStart: markIsTouch,
        };

  return (
    <>
      <div className="sm:hidden w-full"></div>
      <ButtonGroup className="overflow-x-auto max-sm:mx-4" variant="outlined">
        {multiConfig.map((config) => (
          <Button
            className="whitespace-nowrap shrink-0"
            key={config.id}
            onClick={() => applyMultiConfig(config)}
            {...getButtonContextmenuListener(config)}
            sx={{ textTransform: "none" }}
          >
            {config.name}
          </Button>
        ))}
      </ButtonGroup>
      <div className="flex justify-center flex-nowrap -order-1 sm:-order-none">
        <Button className="ml-4 whitespace-nowrap" variant="text" onClick={addMultiConfig}>
          添加配置
        </Button>
        <IconButton className="mx-4" size="small" onClick={handleOpenHelp}>
          <HelpOutlineIcon />
        </IconButton>
      </div>
      <ContextMenu ref={menuRef} transformOrigin={isTouch ? { vertical: "top", horizontal: "right" } : undefined}>
        <MenuItem onClick={handleUpdateConfig}>更新</MenuItem>
        <MenuItem onClick={handleOpenRenameDialog}>重命名</MenuItem>
        <MenuItem onClick={handleRemoveConfig}>删除</MenuItem>
      </ContextMenu>
      <ConfigRenameDialog
        oldName={renameOldName}
        handleRename={handleRename}
        handleClose={() => setRenameOldName(null)}
      />
      <Popover
        open={openHelp}
        anchorEl={helpAnchorEl}
        onClose={() => setOpenHelp(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Typography className="m-4">
          点击“添加配置”后，当前一图流的配置会被保存到一个新配置中，点击某个配置可以重新应用该配置。
        </Typography>
        <Typography className="m-4">
          右击（移动端长按）某个配置可弹出操作菜单进行“重命名”、“删除”等操作，“更新”指的是将当前一图流配置更新到该配置。
        </Typography>
      </Popover>
    </>
  );
}

function ConfigRenameDialog({
  oldName,
  handleRename,
  handleClose,
}: {
  oldName: string | null;
  handleRename: (name: string) => void;
  handleClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleDialogClose = () => {
    setOpen(false);
    handleClose();
  };

  useEffect(() => {
    if (typeof oldName === "string") {
      setOpen(true);
      setNewName(oldName);
    }
  }, [oldName]);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setNewName(event.target.value);
  };

  const handleConfirmRename = () => {
    if (newName) {
      handleRename(newName);
      handleDialogClose();
    }
  };

  const inputRef = useRef<HTMLElement>(null);

  // auto focus
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      inputRef.current?.focus?.();
    });
  }, [open]);

  return (
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle>配置重命名</DialogTitle>
      <DialogContent>
        <TextField
          inputRef={inputRef}
          margin="dense"
          hiddenLabel
          fullWidth
          variant="standard"
          defaultValue={oldName}
          onChange={handleInputChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>取消</Button>
        <Button disabled={!newName || newName === oldName} onClick={handleConfirmRename}>
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
}
