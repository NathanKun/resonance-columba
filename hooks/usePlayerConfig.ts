import { PlayerConfig } from "@/interfaces/player-config";
import { SetStateAction, useEffect, useState } from "react";
const isServer = typeof window === "undefined";

export default function usePlayerConfig() {
  const localStorageKey = "playerConfig";

  const [playerConfig, setPlayerConfig] = useState<PlayerConfig>(INITIAL_PLAYER_CONFIG);

  const initialize = () => {
    if (isServer) {
      return INITIAL_PLAYER_CONFIG;
    }
    try {
      const str = localStorage.getItem(localStorageKey);
      const config = str ? JSON.parse(str) : INITIAL_PLAYER_CONFIG;

      // add missing fields after version update
      if (config.onegraph === undefined) {
        config.onegraph = INITIAL_PLAYER_CONFIG.onegraph;
      }
      if (config.returnBargain === undefined) {
        config.returnBargain = INITIAL_PLAYER_CONFIG.returnBargain;
      }

      return config;
    } catch (e) {
      console.error(e);
      return INITIAL_PLAYER_CONFIG;
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

  const uploadPlayerConfig = async (config: PlayerConfig): Promise<boolean> => {
    if (!config.nanoid) {
      return false;
    }

    try {
      const res = await fetch("/api/sync-player-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "set",
          id: config.nanoid,
          config,
        }),
      });

      if (!res.ok) {
        throw new Error("failed to upload player config");
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const downloadPlayerConfig = async (nanoid: string) => {
    try {
      const res = await fetch("/api/sync-player-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get",
          id: nanoid,
        }),
      });

      if (!res.ok) {
        throw new Error("failed to download player config");
      }

      const data = await res.json();
      if (data.data) {
        // merge it with initial config to avoid missing fields
        const mergedConfig = {
          ...INITIAL_PLAYER_CONFIG,
          ...data.data,
        };

        internalSetPlayerConfig(mergedConfig);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  /* prevents hydration error so that state is only initialized after server is defined */
  useEffect(() => {
    if (!isServer) {
      setPlayerConfig(initialize());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    playerConfig,
    setPlayerConfig: internalSetPlayerConfig,
    setRoleResonance,
    uploadPlayerConfig,
    downloadPlayerConfig,
  };
}

export const INITIAL_PLAYER_CONFIG: PlayerConfig = {
  maxLot: 500,
  bargain: {
    bargainPercent: 0,
    raisePercent: 0,
    bargainFatigue: 0,
    raiseFatigue: 0,
  },
  returnBargain: {
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
