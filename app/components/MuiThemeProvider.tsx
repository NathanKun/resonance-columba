"use client";

import { PaletteMode, ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import { green, grey, red } from "@mui/material/colors";
import { useEffect, useState } from "react";

declare module "@mui/material/styles" {
  interface Palette {
    variationLow: Palette["primary"];
    variationHigh: Palette["primary"];
    variationMedium: Palette["primary"];
  }

  interface PaletteOptions {
    variationLow?: PaletteOptions["primary"];
    variationHigh?: PaletteOptions["primary"];
    variationMedium?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    variationLow: true;
    variationHigh: true;
    variationMedium: true;
  }
}

export default function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const buildTheme = (mode: PaletteMode) => {
    let theme = createTheme({
      palette: {
        mode,
      },
      typography: {
        fontSize: 12,
      },
    });

    // add custom colors
    theme = createTheme(theme, {
      palette: {
        variationLow: theme.palette.augmentColor({
          color: {
            main: red[500],
            light: "lightcoral",
            dark: "darkred",
          },
          name: "variationLow",
        }),
        variationHigh: theme.palette.augmentColor({
          color: {
            main: green[500],
            light: "lightgreen",
            dark: "darkgreen",
          },
          name: "variationHigh",
        }),
        variationMedium: theme.palette.augmentColor({
          color: {
            main: grey[500],
            light: "lightgrey",
            dark: "darkgrey",
          },
          name: "variationMedium",
        }),
      },
    });

    return theme;
  };

  const [theme, setTheme] = useState(buildTheme("light"));

  // https://mui.com/material-ui/customization/dark-mode/#system-preference
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    setTheme(buildTheme(prefersDarkMode ? "dark" : "light"));
  }, [prefersDarkMode]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
