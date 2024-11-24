import { EVENTS } from "@/data/Event";
import { PlayerConfig } from "@/interfaces/player-config";
import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import { useMemo } from "react";

interface GameEventConfigPanelProps {
  playerConfig: PlayerConfig;
  setGameEvent: (eventName: string, activated: boolean) => void;
}

export default function GameEventConfigPanel(props: GameEventConfigPanelProps) {
  const { playerConfig, setGameEvent } = props;

  const allConfigurableEvents = useMemo(() => {
    return EVENTS.filter((event) => event.playConfigurable);
  }, []);

  console.log("GameEventConfigPanel", EVENTS, allConfigurableEvents);

  return (
    <Box className="m-4">
      {allConfigurableEvents.map((event) => (
        <Box key={"GameEventConfigPanel-" + event.name} className="m-2 flex">
          <FormControlLabel
            className=""
            control={
              <Switch
                checked={playerConfig.events[event.name]?.activated ?? false}
                onChange={(e) => {
                  setGameEvent(event.name, e.target.checked);
                }}
              />
            }
            label={
              <Typography>
                {event.name} {event.description}
              </Typography>
            }
          />
        </Box>
      ))}
    </Box>
  );
}
