import { CITIES } from "@/data/Cities";
import { useCallback, useEffect, useMemo, useState } from "react";

const isServer = typeof window === "undefined";

export default function useColumnVisibilityOverride(targetCities: string[]) {
  const localStorageKey = "columnVisibilityOverride";
  const [manualVisibilityOverride, setManualVisibilityOverride] = useState<{ [key: string]: boolean }>({});

  // LC related
  const initialize = () => {
    if (isServer) {
      return {};
    }
    const data = localStorage.getItem(localStorageKey);
    return data ? JSON.parse(data) : {};
  };

  const updateColumnVisibilityOverrideLsAndState = useCallback(
    (newSettings: any) => {
      const newStr = JSON.stringify(newSettings);
      localStorage.setItem(localStorageKey, newStr);
      setManualVisibilityOverride(newSettings);
    },
    [localStorageKey]
  );

  /* prevents hydration error so that state is only initialized after server is defined */
  useEffect(() => {
    if (!isServer) {
      setManualVisibilityOverride(initialize());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // col visibility calculation
  const baseColumnVisibility = useMemo(() => {
    const visibleCities = targetCities;
    const invisibleCities = CITIES.filter((city) => !visibleCities?.includes(city));
    const result: { [key: string]: boolean } = {};
    invisibleCities.forEach((city) => {
      result[city + "-group"] = false;
      result[`targetCity-${city}-variation`] = false;
      result[`targetCity-${city}-trend`] = false;
      result[`targetCity-${city}-time`] = false;
      result[`targetCity-${city}-singleprofit`] = false;
      result[`targetCity-${city}-price`] = false;
    });
    return result;
  }, [targetCities]);

  const columnVisibility = useMemo(() => {
    // merge base visibility with manual override
    // except if a column is already false in base, don't allow it to be true
    const result = { ...baseColumnVisibility };
    Object.keys(manualVisibilityOverride).forEach((key) => {
      if (baseColumnVisibility[key] === false) {
        return;
      }
      result[key] = manualVisibilityOverride[key];
    });
    return result;
  }, [baseColumnVisibility, manualVisibilityOverride]);

  const onColumnVisibilityChange = (updater: any): void => {
    const newSettings = updater();
    updateColumnVisibilityOverrideLsAndState({ ...manualVisibilityOverride, ...newSettings });
  };

  return { columnVisibility, onColumnVisibilityChange };
}
