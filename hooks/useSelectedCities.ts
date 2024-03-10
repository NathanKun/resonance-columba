import { CITIES, CityName } from "@/data/Cities";
import { SelectedCities } from "@/interfaces/prices-table";
import { useCallback, useEffect, useState } from "react";

const isServer = typeof window === "undefined";

export default function useSelectedCities(props: { localStorageKey: string }) {
  const { localStorageKey } = props;
  const initialSelectedCities = { sourceCities: [CITIES[0]], targetCities: [CITIES[1]] };

  const [selectedCities, setSelectedCities] = useState<SelectedCities>(initialSelectedCities);

  const initialize = () => {
    if (isServer) {
      return initialSelectedCities;
    }
    const selectedCitiesStr = localStorage.getItem(localStorageKey);
    return selectedCitiesStr ? JSON.parse(selectedCitiesStr) : initialSelectedCities;
  };

  /* prevents hydration error so that state is only initialized after server is defined */
  useEffect(() => {
    if (!isServer) {
      setSelectedCities(initialize());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSelectedCitiesLsAndState = useCallback(
    (newSelectedCities: SelectedCities) => {
      const newStr = JSON.stringify(newSelectedCities);
      localStorage.setItem(localStorageKey, newStr);
      setSelectedCities(newSelectedCities);
    },
    [localStorageKey]
  );

  const setSourceCities = useCallback(
    (selected: CityName[]) => {
      const newSelectedCities = { ...selectedCities, sourceCities: selected };
      updateSelectedCitiesLsAndState(newSelectedCities);
    },
    [selectedCities, updateSelectedCitiesLsAndState]
  );

  const setTargetCities = useCallback(
    (selected: CityName[]) => {
      const newSelectedCities = { ...selectedCities, targetCities: selected };
      updateSelectedCitiesLsAndState(newSelectedCities);
    },
    [selectedCities, updateSelectedCitiesLsAndState]
  );

  const switchSourceAndTargetCities = useCallback(() => {
    const newSelectedCities = {
      sourceCities: selectedCities.targetCities,
      targetCities: selectedCities.sourceCities,
    };
    updateSelectedCitiesLsAndState(newSelectedCities);
  }, [selectedCities, updateSelectedCitiesLsAndState]);

  return { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities };
}
