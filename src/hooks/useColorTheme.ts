import { useEffect } from "react";

const COLOR_THEMES = [
  { name: "Purple Dream", primary: "270 91% 65%", accent: "280 89% 60%" },
  { name: "Ocean Blue", primary: "210 100% 50%", accent: "200 98% 60%" },
  { name: "Sunset Orange", primary: "25 95% 55%", accent: "15 90% 60%" },
  { name: "Forest Green", primary: "140 70% 45%", accent: "160 75% 50%" },
  { name: "Rose Pink", primary: "340 82% 62%", accent: "350 85% 70%" },
  { name: "Golden Sun", primary: "45 93% 58%", accent: "40 96% 65%" },
];

export const useColorTheme = () => {
  useEffect(() => {
    // Apply saved color theme on mount
    const savedTheme = localStorage.getItem("colorTheme");
    if (savedTheme) {
      const themeIndex = parseInt(savedTheme);
      const theme = COLOR_THEMES[themeIndex];
      if (theme) {
        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--accent', theme.accent);
      }
    }
  }, []);
};

export { COLOR_THEMES };
