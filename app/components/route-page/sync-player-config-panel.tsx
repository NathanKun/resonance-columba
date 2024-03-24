import { INITIAL_PLAYER_CONFIG } from "@/hooks/usePlayerConfig";
import { PlayerConfig } from "@/interfaces/player-config";
import { Box, Button, TextField, Typography } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

interface SyncPlayerConfigPanelProps {
  playerConfig: PlayerConfig;
  setPlayerConfig: (config: PlayerConfig) => void;
  downloadPlayerConfig: (nanoid: string) => Promise<boolean>;
  uploadPlayerConfig: (config: PlayerConfig) => Promise<boolean>;
}

interface SnackBarState {
  open: boolean;
  text: string;
}

export default function SyncPlayerConfigPanel(props: SyncPlayerConfigPanelProps) {
  const { playerConfig, setPlayerConfig, downloadPlayerConfig, uploadPlayerConfig } = props;
  const [id, setId] = useState<string>(playerConfig.nanoid !== undefined ? playerConfig.nanoid : "");
  const [idError, setIdError] = useState<boolean>(false);
  const [snackBarState, setSnackBarState] = useState<SnackBarState>({
    open: false,
    text: "",
  });
  const { open } = snackBarState;

  const openSnackBar = (text: string) => {
    setSnackBarState({ open: true, text });
  };

  const closeSnackBar = () => {
    setSnackBarState({ open: false, text: "" });
  };

  const validateId = () => {
    return /^[A-Za-z0-9_-]{21}$/.test(id);
  };

  const onIdFieldBlur = () => {
    if (!validateId()) {
      setIdError(true);
    } else {
      setIdError(false);
    }
  };

  const handleDownload = async () => {
    // if id is valid, pass it to downloadPlayerConfig
    if (validateId()) {
      setIdError(false);
      const success = await downloadPlayerConfig(id);
      if (success) {
        openSnackBar("下载成功");
      } else {
        // TODO: show error message
        openSnackBar("下载失败，请检查ID是否正确。");
      }
    } else {
      setIdError(true);
    }
  };

  const handleUpload = async () => {
    if (playerConfig.nanoid === undefined) {
      playerConfig.nanoid = nanoid();
      setPlayerConfig(playerConfig);
      setId(playerConfig.nanoid);
      setIdError(false);
    }

    // if no nanoid, uploadPlayerConfig will generate one, otherwise it will use the existing one
    const success = await uploadPlayerConfig(playerConfig);
    if (success) {
      openSnackBar("上传成功");
    } else {
      openSnackBar("上传失败。");
    }
  };

  const handleCopy = () => {
    // copy id to clipboard
    navigator.clipboard.writeText(id);
  };

  const handleClear = () => {
    setPlayerConfig(INITIAL_PLAYER_CONFIG);
  };

  useEffect(() => {
    if (playerConfig.nanoid !== undefined) {
      setId(playerConfig.nanoid);
    }
  }, [playerConfig.nanoid]);

  return (
    <Box className="flex justify-start flex-wrap">
      <TextField
        className="w-56"
        label="ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        onBlur={onIdFieldBlur}
        error={idError}
        // disabled={playerConfig.nanoid !== undefined}
      />
      <Button className="m-4" disabled={!!id && idError} onClick={handleUpload}>
        上传
      </Button>
      <Button className="m-4" disabled={idError} onClick={handleDownload}>
        下载
      </Button>
      <Button className="m-4" disabled={idError} onClick={handleCopy}>
        复制ID
      </Button>
      <Box className="grow"></Box>
      <Button className="m-4" onClick={handleClear} color="error">
        清空本地配置
      </Button>
      <Typography className="basis-full">
        第一次上传时将ID留空，直接点击上传按钮，系统会自动生成ID。之后将ID填入到需要同步的设备，点击下载即可。
      </Typography>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        open={open}
        onClose={closeSnackBar}
        message={snackBarState.text}
        key="sync-player-config-snackbar"
      />
    </Box>
  );
}
