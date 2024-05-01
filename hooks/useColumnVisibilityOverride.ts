import { CITIES } from "@/data/Cities";
import { useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";

export default function useColumnVisibilityOverride(targetCities: string[]) {
  const [manualVisibilityOverride, setManualVisibilityOverride] = useLocalStorage<{ [key: string]: boolean }>(
    "columnVisibilityOverride",
    {},
    { initializeWithValue: false }
  );

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
    setManualVisibilityOverride({ ...manualVisibilityOverride, ...newSettings });
  };

  return { columnVisibility, onColumnVisibilityChange };
}
