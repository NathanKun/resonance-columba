import { CityName } from "@/data/Cities";
import { PlayerConfig } from "@/interfaces/player-config";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Paper from "@mui/material/Paper";
import { SetStateAction } from "react";
import BargainInputs from "../../route-page/bargain-inputs";
import NumberInput from "../../route-page/number-input";
import ProductUnlockSelect from "../../route-page/product-unlock-select";
import RoleSkillSelects from "../../route-page/role-skill-selects";
import SyncPlayerConfigPanel from "../../route-page/sync-player-config-panel";

interface PlayerConfigTabProps {
  playerConfig: PlayerConfig;
  onPlayerConfigChange: (field: string, value: any) => void;
  setPlayerConfig: (updater: SetStateAction<PlayerConfig>) => void;
  setRoleResonance: (role: string, resonance: number) => void;
  setProductUnlock: (newConfig: { [pdtName: string]: boolean }) => void;
  uploadPlayerConfig: (config: PlayerConfig) => Promise<boolean>;
  downloadPlayerConfig: (nanoid: string) => Promise<boolean>;
  onGoBargainChange: (field: string, value: number) => void;
}

export default function PlayerConfigTab(props: PlayerConfigTabProps) {
  const {
    playerConfig,
    onPlayerConfigChange,
    setPlayerConfig,
    onGoBargainChange,
    setRoleResonance,
    setProductUnlock,
    downloadPlayerConfig,
    uploadPlayerConfig,
  } = props;

  const onPrestigeChange = (city: CityName, value: number) => {
    if (!isNaN(value)) {
      onPlayerConfigChange("prestige", { ...playerConfig.prestige, [city]: value });
    }
  };

  return (
    <Paper
      className="p-6 max-sm:px-0 max-w-4xl mx-auto my-4 w-full box-border"
      sx={{
        "& .MuiFormControl-root": {
          width: "10rem",
          margin: "0.5rem",
        },
      }}
    >
      <Box className="m-4">
        <Typography>无垠号</Typography>
        <NumberInput
          label="货舱大小"
          min={100}
          max={3000}
          defaultValue={500}
          type="integer"
          value={playerConfig.maxLot}
          setValue={(newValue) => onPlayerConfigChange("maxLot", newValue)}
        />
      </Box>

      <Box className="m-4">
        <Typography>声望等级：影响税收与单票商品购入量，目前仅支持8级以上。附属城市声望跟随主城。</Typography>
        <NumberInput
          label="修格里城"
          min={8}
          max={20}
          defaultValue={8}
          type="integer"
          value={playerConfig.prestige["修格里城"]}
          setValue={(newValue) => onPrestigeChange("修格里城", newValue)}
        />
        <NumberInput
          label="曼德矿场"
          min={8}
          max={20}
          defaultValue={8}
          type="integer"
          value={playerConfig.prestige["曼德矿场"]}
          setValue={(newValue) => onPrestigeChange("曼德矿场", newValue)}
        />
        <NumberInput
          label="澄明数据中心"
          min={8}
          max={20}
          defaultValue={8}
          type="integer"
          value={playerConfig.prestige["澄明数据中心"]}
          setValue={(newValue) => onPrestigeChange("澄明数据中心", newValue)}
        />
        <NumberInput
          label="七号自由港"
          min={8}
          max={20}
          defaultValue={8}
          type="integer"
          value={playerConfig.prestige["七号自由港"]}
          setValue={(newValue) => onPrestigeChange("七号自由港", newValue)}
        />
      </Box>

      <Box className="m-4">
        <Typography>议价</Typography>
        <BargainInputs barginConfig={playerConfig.bargain} onBargainChange={onGoBargainChange} />
      </Box>

      <Box className="m-4">
        <Typography>乘员共振</Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}></AccordionSummary>
          <AccordionDetails className="p-0">
            <RoleSkillSelects playerConfig={playerConfig} setRoleResonance={setRoleResonance} />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box className="m-4">
        <Typography>商品解锁</Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}></AccordionSummary>
          <AccordionDetails className="p-0">
            <ProductUnlockSelect playerConfig={playerConfig} setProductUnlock={setProductUnlock} />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box className="m-4">
        <Typography>数据同步</Typography>
        <SyncPlayerConfigPanel
          playerConfig={playerConfig}
          setPlayerConfig={setPlayerConfig}
          downloadPlayerConfig={downloadPlayerConfig}
          uploadPlayerConfig={uploadPlayerConfig}
        />
      </Box>
    </Paper>
  );
}
