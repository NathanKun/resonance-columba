import { CITIES, CityName } from "@/data/Cities";
import { SelectedCities } from "@/interfaces/prices-table";
import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

export default function useSelectedCities(props: { localStorageKey: string }) {
  const initialSelectedCities = { sourceCities: [CITIES[0]], targetCities: [CITIES[1]] };

  const [selectedCities, setSelectedCities] = useLocalStorage<SelectedCities>(
    props.localStorageKey,
    initialSelectedCities,
    {
      initializeWithValue: false,
    }
  );

  const setSourceCities = useCallback(
    (selected: CityName[]) => {
      const newSelectedCities = { ...selectedCities, sourceCities: selected };
      setSelectedCities(newSelectedCities);
    },
    [selectedCities, setSelectedCities]
  );

  const setTargetCities = useCallback(
    (selected: CityName[]) => {
      const newSelectedCities = { ...selectedCities, targetCities: selected };
      setSelectedCities(newSelectedCities);
    },
    [selectedCities, setSelectedCities]
  );

  const switchSourceAndTargetCities = useCallback(() => {
    const newSelectedCities = {
      sourceCities: selectedCities.targetCities,
      targetCities: selectedCities.sourceCities,
    };
    setSelectedCities(newSelectedCities);
  }, [selectedCities, setSelectedCities]);

  const copySourceToTargetCities = useCallback(() => {
    const newSelectedCities = {
      sourceCities: selectedCities.sourceCities,
      targetCities: selectedCities.sourceCities,
    };
    setSelectedCities(newSelectedCities);
  }, [selectedCities, setSelectedCities]);

  return { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities, copySourceToTargetCities };
}
