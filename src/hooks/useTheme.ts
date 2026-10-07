import { createContext, useContext } from "react";

export type Theme = "dark" | "light" | "system";

interface ThemeContextState {
  readonly theme: Theme;
  readonly setTheme: (theme: Theme) => void;
}

const initialState: ThemeContextState = {
  theme: "system",
  setTheme: () => null,
};

export const ThemeContext = createContext<ThemeContextState>(initialState);

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};