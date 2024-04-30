import { useLocalStorage } from "usehooks-ts";
import { nanoid } from "nanoid";
import type { PlayerConfig } from "@/interfaces/player-config";
import { pickBy, without } from "@/utils/tiny-lodash";

// Modify this if more properties need to be save in the future
const playerConfigPickKeys = ["bargain", "returnBargain", "onegraph"] as const;

export interface OnegraphMultiConfigItem {
  id: string;
  name: string;
  data: Pick<PlayerConfig, (typeof playerConfigPickKeys)[number]>;
}

export type OnegraphMultiConfig = OnegraphMultiConfigItem[];

interface UseOnegraphMultiConfigOptions {
  playerConfig: PlayerConfig;
  onPlayerConfigChange: (field: string, value: any) => void;
}

export default function useOnegraphMultiConfig({ playerConfig, onPlayerConfigChange }: UseOnegraphMultiConfigOptions) {
  const [multiConfig, setMultiConfig] = useLocalStorage<OnegraphMultiConfig>("onegraphMultiConfig", [], {
    initializeWithValue: false,
  });

  const getNewConfigName = () => {
    const reg = /^配置 (\d+)$/;
    try {
      const maxOrder = Math.max(
        0,
        ...multiConfig.map(({ name }) => {
          const match = reg.exec(name);
          const num = Number(match?.[1] ?? 0);
          return num;
        })
      );
      return `配置 ${maxOrder + 1}`;
    } catch {
      return `配置 ${multiConfig.length + 1}`;
    }
  };

  const addMultiConfig = () => {
    const newConfig: OnegraphMultiConfigItem = {
      id: nanoid(),
      name: getNewConfigName(),
      data: pickBy(playerConfig, playerConfigPickKeys),
    };
    setMultiConfig([...multiConfig, newConfig]);
  };

  const removeMultiConfig = (config: OnegraphMultiConfigItem) => {
    setMultiConfig(without(multiConfig, config));
  };

  const applyMultiConfig = (config: OnegraphMultiConfigItem) => {
    Object.entries(config.data).forEach(([key, val]) => {
      const oldConfig = playerConfig[key as keyof OnegraphMultiConfigItem["data"]];
      if (typeof oldConfig === "object" && !Array.isArray(oldConfig)) {
        onPlayerConfigChange(key, { ...oldConfig, ...val });
      } else {
        onPlayerConfigChange(key, val);
      }
    });
  };

  const renameMultiConfig = (config: OnegraphMultiConfigItem, newName: string) => {
    setMultiConfig(
      multiConfig.map((item) => {
        if (item !== config) return item;
        return { ...config, name: newName };
      })
    );
  };

  const updateMultiConfig = (config: OnegraphMultiConfigItem) => {
    setMultiConfig(
      multiConfig.map((item) => {
        if (item !== config) return item;
        return { ...config, data: pickBy(playerConfig, playerConfigPickKeys) };
      })
    );
  };

  return {
    multiConfig,
    addMultiConfig,
    removeMultiConfig,
    applyMultiConfig,
    renameMultiConfig,
    updateMultiConfig,
  };
}
