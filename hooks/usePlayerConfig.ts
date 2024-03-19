import { PlayerConfig } from "@/interfaces/player-config";
import { SetStateAction, useEffect, useState } from "react";

const isServer = typeof window === "undefined";

export default function usePlayerConfig() {
  const localStorageKey = "playerConfig";
  const initial: PlayerConfig = {
    maxLot: 500,
    bargain: {
      bargainPercent: 0,
      raisePercent: 0,
      bargainFatigue: 0,
      raiseFatigue: 0,
    },
    prestige: {
      修格里城: 8,
      曼德矿场: 8,
      澄明数据中心: 8,
      七号自由港: 8,
    },
    roles: {},
    onegraph: {
      maxRestock: 5,
      goAndReturn: false,
      showFatigue: false,
    },
  };

  const [playerConfig, setPlayerConfig] = useState<PlayerConfig>(initial);

  const initialize = () => {
    if (isServer) {
      return initial;
    }
    try {
      const str = localStorage.getItem(localStorageKey);
      const config = str ? JSON.parse(str) : initial;

      // add missing fields after version update
      if (config.onegraph === undefined) {
        config.onegraph = initial.onegraph;
      }

      return config;
    } catch (e) {
      console.error(e);
      return initial;
    }
  };

  const internalSetPlayerConfig = (updater: SetStateAction<PlayerConfig>) => {
    setPlayerConfig((oldVal) => {
      let newVal;
      if (typeof updater === "function") {
        newVal = updater(oldVal);
      } else {
        newVal = updater;
      }
      if (!isServer) {
        localStorage.setItem(localStorageKey, JSON.stringify(newVal));
      }
      return newVal;
    });
  };

  const setRoleResonance = (role: string, resonance: number) => {
    internalSetPlayerConfig((oldConfig) => {
      return {
        ...oldConfig,
        roles: {
          ...oldConfig.roles,
          [role]: {
            ...oldConfig.roles?.[role],
            resonance,
          },
        },
      };
    });
  };

  /* prevents hydration error so that state is only initialized after server is defined */
  useEffect(() => {
    if (!isServer) {
      setPlayerConfig(initialize());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { playerConfig, setPlayerConfig: internalSetPlayerConfig, setRoleResonance };
}
