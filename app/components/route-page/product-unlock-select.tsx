"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCT_UNLOCK_CONDITIONS } from "@/data/Products";
import { PlayerConfig } from "@/interfaces/player-config";
import { Box, Slider, useMediaQuery, useTheme } from "@mui/material";
import { useMemo } from "react";
interface ProductUnlockSelectProps {
  playerConfig: PlayerConfig;
  setProductUnlock: (newConfig: {
    [pdtName: string]: boolean; // product name to unlock status
  }) => void;
}

export default function ProductUnlockSelect(props: ProductUnlockSelectProps) {
  const { playerConfig, setProductUnlock } = props;
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
    return results;
  }, []);
  const unlockedProductsByCity = useMemo(() => {
    const results: {
      [city: CityName]: string[];
    } = {};
    CITIES.forEach((city) => {
      const conditions = PRODUCT_UNLOCK_CONDITIONS[city];
      if (!conditions) return;

      const unlockedProducts = Object.entries(conditions)
        .filter(([pdtName]) => (playerConfig.productUnlockStatus?.[pdtName] ?? true) === true)
        .map(([pdtName]) => pdtName);

      results[city] = unlockedProducts;
    });
    return results;
  }, [playerConfig.productUnlockStatus]);

  const onSliderChange = (city: string, value: number) => {
    const unlockableProducts = unlockableProductsByCity[city];
    // value is the index + 1 of the unlockable products, 0 means no product unlocked
    const unlockedProducts = value === 0 ? [] : unlockableProducts.slice(0, value);
    const lockedProducts = unlockableProducts.slice(value);

    const newConfig: {
      [pdtName: string]: boolean;
    } = {};
    unlockedProducts.forEach((pdtName) => {
      newConfig[pdtName] = true;
    });
    lockedProducts.forEach((pdtName) => {
      newConfig[pdtName] = false;
    });

    setProductUnlock(newConfig);
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
        const unlockedProducts = unlockedProductsByCity[city];
        const value = unlockedProducts.length;

        return (
          <Box
            key={city}
            className="flex flex-col items-center w-full md:px-12 pb-4"
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
              valueLabelFormat={(x) => (x >= 10000 ? `${(x / 10000).toFixed(0)}万` : x)}
              orientation={smallScreen ? "vertical" : "horizontal"}
              sx={
                smallScreen
                  ? {
                      '& input[type="range"]': {
                        WebkitAppearance: "slider-vertical",
                      },
                    }
                  : marks.length >= 8
                  ? {
                      // Prevent mark label overlap
                      "& .MuiSlider-markLabel": {
                        maxWidth: 80,
                        width: "max-content",
                        textWrap: "wrap",
                        textAlign: "center",
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
