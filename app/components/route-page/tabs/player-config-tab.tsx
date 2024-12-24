import { CityName } from "@/data/Cities";
import { PlayerConfig } from "@/interfaces/player-config";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Paper from "@mui/material/Paper";
import { SetStateAction } from "react";
import { CITY_ATTACH_LIST } from "resonance-data-columba/dist/columbabuild";
import BargainInputs from "../bargain-inputs";
import GameEventConfigPanel from "../game-event-config-panel";
import NumberInput from "../number-input";
import ProductUnlockSelect from "../product-unlock-select";
import RoleSkillSelects from "../role-skill-selects";
import SyncPlayerConfigPanel from "../sync-player-config-panel";

interface PlayerConfigTabProps {
  playerConfig: PlayerConfig;
  onPlayerConfigChange: (field: string, value: any) => void;
  setPlayerConfig: (updater: SetStateAction<PlayerConfig>) => void;
  setRoleResonance: (role: string, resonance: number) => void;
  setProductUnlock: (newConfig: { [pdtName: string]: boolean }) => void;
  uploadPlayerConfig: (config: PlayerConfig) => Promise<boolean>;
  downloadPlayerConfig: (nanoid: string) => Promise<boolean>;
  onGoBargainChange: (field: string, value: number) => void;
  setGameEvent: (eventName: string, activated: boolean) => void;
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
    setGameEvent,
  } = props;

  const onPrestigeChange = (city: CityName, value: number) => {
    if (!isNaN(value)) {
      onPlayerConfigChange("prestige", { ...playerConfig.prestige, [city]: value });
    }
  };

  const cityList = Object.values(CITY_ATTACH_LIST);

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
        <Typography className="p-2">无垠号</Typography>
        <NumberInput
          label="货舱大小"
          min={100}
          max={3000}
          defaultValue={500}
          type="integer"
          value={playerConfig.maxLot}
          setValue={(newValue) => onPlayerConfigChange("maxLot", newValue)}
        />
        <NumberInput
          label="贸易等级"
          min={1}
          max={99}
          defaultValue={10}
          type="integer"
          value={playerConfig.tradeLevel}
          setValue={(newValue) => onPlayerConfigChange("tradeLevel", newValue)}
        />
      </Box>

      <Box className="m-4">
        <Typography className="p-2">
          声望等级：影响税收与单票商品购入量，目前仅支持8级以上。附属城市声望跟随主城。
        </Typography>
        {cityList.map((city) => (
          <NumberInput
            key={"prestige-input" + city}
            label={city}
            min={1}
            max={20}
            defaultValue={1}
            type="integer"
            value={playerConfig.prestige[city]}
            setValue={(newValue) => onPrestigeChange(city, newValue)}
          />
        ))}
      </Box>

      <Box className="m-4">
        <Typography className="p-2">议价</Typography>
        <BargainInputs barginConfig={playerConfig.bargain} onBargainChange={onGoBargainChange} />
      </Box>

      <Box className="m-4">
        <Typography className="p-2">乘员共振</Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}></AccordionSummary>
          <AccordionDetails className="p-0">
            <RoleSkillSelects playerConfig={playerConfig} setRoleResonance={setRoleResonance} />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box className="m-4">
        <Typography className="p-2">商品解锁</Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}></AccordionSummary>
          <AccordionDetails className="p-0">
            <ProductUnlockSelect playerConfig={playerConfig} setProductUnlock={setProductUnlock} />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box className="m-4">
        <Typography className="p-2">常驻活动</Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}></AccordionSummary>
          <AccordionDetails className="p-0">
            <GameEventConfigPanel playerConfig={playerConfig} setGameEvent={setGameEvent} />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box className="m-4">
        <Typography className="p-2">数据同步</Typography>
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
