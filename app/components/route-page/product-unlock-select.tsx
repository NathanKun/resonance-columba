"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCT_UNLOCK_CONDITIONS } from "@/data/Products";
import { PlayerConfig } from "@/interfaces/player-config";
import { Box, Slider, useMediaQuery, useTheme } from "@mui/material";
import { useMemo } from "react";
interface ProductUnlockSelectProps {
  playerConfig: PlayerConfig;
  setProductUnlock: (pdtName: string, unlocked: boolean) => void;
}

export default function ProductUnlockSelect(props: ProductUnlockSelectProps) {
  const { playerConfig, setProductUnlock } = props;
  const { productUnlockStatus } = playerConfig;
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const unlockableProductsByCity = useMemo(() => {
    const results: {
      [city: CityName]: string[];
    } = {};
    CITIES.forEach((city) => {
      const conditions = PRODUCT_UNLOCK_CONDITIONS[city];
      if (!conditions) return;

      const unlockableProducts = Object.entries(conditions)
        .sort((a, b) => a[1].invest - b[1].invest)
        .map(([pdtName]) => pdtName);

      results[city] = unlockableProducts;
    });
    console.log(results);
    return results;
  }, []);

  const unlockedProductsToInvest = (city: string, unlockedProducts: string[]) => {
    const conditions = PRODUCT_UNLOCK_CONDITIONS[city];
    if (!conditions) return 0;

    const invest = unlockedProducts.map((pdtName) => conditions[pdtName].invest).reduce((a, b) => Math.max(a, b), 0);

    return invest;
  };

  const getUnlockedProductsOfCityFromPlayerConfig = (city: string) => {
    const conditions = PRODUCT_UNLOCK_CONDITIONS[city];
    if (!conditions) return [];

    const unlockedProducts = Object.entries(conditions)
      .filter(([pdtName]) => (productUnlockStatus?.[pdtName] ?? true) === true)
      .map(([pdtName]) => pdtName);

    return unlockedProducts;
  };

  const onSliderChange = (city: string, value: number) => {
    const unlockableProducts = unlockableProductsByCity[city];
    // value is the index + 1 of the unlockable products, 0 means no product unlocked
    const unlockedProducts = value === 0 ? [] : unlockableProducts.slice(0, value);
    console.log(city, unlockedProducts, unlockableProducts);

    unlockableProducts.forEach((pdtName) => {
      setProductUnlock(pdtName, unlockedProducts.includes(pdtName));
    });
  };

  return (
    <Box className="flex flex-col items-center">
      {CITIES.map((city) => {
        const conditions = PRODUCT_UNLOCK_CONDITIONS[city];
        if (!conditions) return null;

        // build slider marks
        let marks = [
          {
            value: 0, // index of the unlockable products, start from 1 because 0 means no product unlocked
            scale: 0, // invest value
            label: "未解锁",
          },
        ];

        Object.entries(conditions)
          .sort((a, b) => a[1].invest - b[1].invest)
          .forEach(([pdtName, product], index) => {
            const value = index + 1;
            const label = pdtName;
            const scale = product.invest;
            marks.push({ value, label, scale });
          });

        // get player's unlocked products
        const unlockedProducts = getUnlockedProductsOfCityFromPlayerConfig(city);
        const value = unlockedProducts.length;

        return (
          <Box
            key={city}
            className="flex flex-col items-center w-10/12"
            sx={
              smallScreen
                ? {
                    height: "16rem",
                  }
                : {}
            }
          >
            <h2 className="text-xl">{city}</h2>
            <Slider
              aria-label="Product Unlock"
              value={value}
              onChange={(e, value) => onSliderChange(city, value as number)}
              getAriaValueText={(value) => marks.find((mark) => mark.value === value)?.label ?? ""}
              step={null}
              marks={marks}
              scale={(x) => marks.find((mark) => mark.value === x)?.scale ?? 0}
              min={0}
              max={marks.at(-1)!.value}
              valueLabelDisplay="on"
              orientation={smallScreen ? "vertical" : "horizontal"}
              sx={
                smallScreen
                  ? {
                      '& input[type="range"]': {
                        WebkitAppearance: "slider-vertical",
                      },
                    }
                  : {}
              }
            />
          </Box>
        );
      })}
    </Box>
  );
}
