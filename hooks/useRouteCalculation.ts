import { CITIES } from "@/data/Cities";
import { GetPricesProducts } from "@/interfaces/get-prices";
import { PlayerConfig } from "@/interfaces/player-config";
import { SelectedCities } from "@/interfaces/prices-table";
import { CityGroupedExchanges } from "@/interfaces/route-page";
import { calculateAccumulatedValues, calculateExchanges, groupeExchangesByCity } from "@/utils/route-page-utils";
import { useMemo } from "react";
import useSelectedCities from "./useSelectedCities";

interface UseRouteCalculationProps {
  playerConfig: PlayerConfig;
  prices: GetPricesProducts;
}

interface UseRouteCalculationResult {
  selectedCities: SelectedCities;
  setSourceCities: (cities: string[]) => void;
  setTargetCities: (cities: string[]) => void;
  switchSourceAndTargetCities: () => void;
  cityGroupedExchangesAllTargetCities: CityGroupedExchanges;
  cityGroupedExchangesSelectedTargetCities: CityGroupedExchanges;
}

export default function useRouteCalculation(props: UseRouteCalculationProps): UseRouteCalculationResult {
  const { playerConfig, prices } = props;

  /* city selects */
  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities } = useSelectedCities({
    localStorageKey: "routeSelectedCities",
  });

  /* calculation */
  // all possible single product exchange routes
  const singleProductExchangesAllTargetCities = useMemo(
    () => calculateExchanges(playerConfig, CITIES, CITIES, prices),
    [prices, playerConfig]
  );

  // group by fromCity then toCity
  const cityGroupedExchangesAllTargetCities: CityGroupedExchanges = useMemo(() => {
    const results = groupeExchangesByCity(singleProductExchangesAllTargetCities);
    calculateAccumulatedValues(playerConfig, results);
    return results;
  }, [playerConfig, singleProductExchangesAllTargetCities]);

  // filter out exchanges that are not in selected source / target cities, for displaying in detailed simulation
  const cityGroupedExchangesSelectedTargetCities: CityGroupedExchanges = useMemo(() => {
    const results: any = {};
    for (const fromCity in cityGroupedExchangesAllTargetCities) {
      if (!selectedCities.sourceCities.includes(fromCity)) continue;

      results[fromCity] = {};
      for (const toCity in cityGroupedExchangesAllTargetCities[fromCity]) {
        if (!selectedCities.targetCities.includes(toCity)) continue;
        results[fromCity][toCity] = cityGroupedExchangesAllTargetCities[fromCity][toCity];
      }
    }

    return results as CityGroupedExchanges;
  }, [cityGroupedExchangesAllTargetCities, selectedCities.sourceCities, selectedCities.targetCities]);

  return {
    selectedCities,
    setSourceCities,
    setTargetCities,
    switchSourceAndTargetCities,
    cityGroupedExchangesAllTargetCities,
    cityGroupedExchangesSelectedTargetCities,
  };
}
