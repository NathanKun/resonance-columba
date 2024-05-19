import { ROLE_RESONANCE_SKILLS } from "@/data/RoleResonanceSkills";
import { PlayerConfig } from "@/interfaces/player-config";
import { INITIAL_PLAYER_CONFIG, mergePlayerConfigs } from "@/utils/player-config-utils";
import { useLocalStorage } from "usehooks-ts";

export default function usePlayerConfig() {
  const [playerConfig, setPlayerConfig] = useLocalStorage<PlayerConfig>("playerConfig", INITIAL_PLAYER_CONFIG, {
    initializeWithValue: false,
    deserializer: (value) => {
      try {
        const config = value ? JSON.parse(value) : INITIAL_PLAYER_CONFIG;
        const merged = mergePlayerConfigs(config);

        // validate / fix selected resonance levels
        const roles = merged.roles;
        Object.keys(roles).forEach((role) => {
          const selectedLevel = roles[role].resonance;
          if (selectedLevel === 0) {
            return;
          }
          // check if the selected level is valid
          const availableLevels = Object.keys(ROLE_RESONANCE_SKILLS[role]).map((level) => parseInt(level));
          // if not, set it to the previous level
          if (!availableLevels.includes(selectedLevel)) {
            const previousLevel = availableLevels
              .filter((level) => level <= selectedLevel)
              .sort()
              .reverse()[0];
            if (!isNaN(previousLevel)) {
              roles[role].resonance = previousLevel;
            }
          }
        });

        return merged;
      } catch (e) {
        console.error(e);
        return INITIAL_PLAYER_CONFIG;
      }
    },
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
