import { useEffect } from "react";

const COLOR_THEMES = [
  { name: "Purple Dream", primary: "270 91% 65%", accent: "280 89% 60%", premium: false },
  { name: "Ocean Blue", primary: "210 100% 50%", accent: "200 98% 60%", premium: false },
  { name: "Sunset Orange", primary: "25 95% 55%", accent: "15 90% 60%", premium: false },
  { name: "Forest Green", primary: "140 70% 45%", accent: "160 75% 50%", premium: false },
  { name: "Rose Pink", primary: "340 82% 62%", accent: "350 85% 70%", premium: false },
  { name: "Golden Sun", primary: "45 93% 58%", accent: "40 96% 65%", premium: false },
  { name: "Glass Morphism", primary: "220 100% 70%", accent: "240 100% 80%", premium: true },
  { name: "Neon Cyber", primary: "310 100% 60%", accent: "170 100% 50%", premium: true },
  { name: "Royal Gold", primary: "45 100% 50%", accent: "30 100% 45%", premium: true },
  { name: "Aurora Borealis", primary: "160 90% 50%", accent: "280 90% 60%", premium: true },
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
