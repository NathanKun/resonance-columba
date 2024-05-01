import { PlayerConfig } from "@/interfaces/player-config";
import { INITIAL_PLAYER_CONFIG, mergePlayerConfigs } from "@/utils/player-config-utils";
import { useLocalStorage } from "usehooks-ts";

export default function usePlayerConfig() {
  const [playerConfig, setPlayerConfig] = useLocalStorage<PlayerConfig>("playerConfig", INITIAL_PLAYER_CONFIG, {
    initializeWithValue: false,
  });

  const setRoleResonance = (role: string, resonance: number) => {
    setPlayerConfig((oldConfig) => {
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

  const setProductUnlock = (newConfig: {
    [pdtName: string]: boolean; // product name to unlock status
  }) => {
    setPlayerConfig((oldConfig) => {
      return {
        ...oldConfig,
        productUnlockStatus: {
          ...oldConfig.productUnlockStatus,
          ...newConfig,
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
        // deep merge it with initial config to avoid missing fields,
        // merge all sub-objects to avoid missing fields in sub-objects
        const mergedConfig = mergePlayerConfigs(data.data);
        setPlayerConfig(mergedConfig);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return {
    playerConfig,
    setPlayerConfig,
    setRoleResonance,
    setProductUnlock,
    uploadPlayerConfig,
    downloadPlayerConfig,
  };
}
