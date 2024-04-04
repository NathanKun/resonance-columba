"use client";

import { PaletteMode, ThemeProvider, createTheme } from "@mui/material";
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

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(buildTheme(query.matches ? "dark" : "light"));
    query.addEventListener("change", onChange);

    setTheme(buildTheme(query.matches ? "dark" : "light"));

    // remove the listener
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, []);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
