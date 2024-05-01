"use client";

import { PaletteMode, ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";

export default function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const buildTheme = (mode: PaletteMode) =>
    createTheme({
      palette: {
        mode,
      },
      typography: {
        fontSize: 12,
      },
    });

  const [theme, setTheme] = useState(buildTheme("light"));

  // https://mui.com/material-ui/customization/dark-mode/#system-preference
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    setTheme(buildTheme(prefersDarkMode ? "dark" : "light"));
  }, [prefersDarkMode]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
