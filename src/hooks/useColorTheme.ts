import { useEffect } from "react";

const COLOR_THEMES = [
  { name: "Purple Dream", primary: "270 91% 65%", accent: "280 89% 60%", premium: false, className: "" },
  { name: "Ocean Blue", primary: "210 100% 50%", accent: "200 98% 60%", premium: false, className: "" },
  { name: "Sunset Orange", primary: "25 95% 55%", accent: "15 90% 60%", premium: false, className: "" },
  { name: "Forest Green", primary: "140 70% 45%", accent: "160 75% 50%", premium: false, className: "" },
  { name: "Rose Pink", primary: "340 82% 62%", accent: "350 85% 70%", premium: false, className: "" },
  { name: "Golden Sun", primary: "45 93% 58%", accent: "40 96% 65%", premium: false, className: "" },
  { name: "Glass Morphism", primary: "220 100% 70%", accent: "240 100% 80%", premium: true, className: "glass-premium animate-glass-shimmer" },
  { name: "Neon Cyber", primary: "310 100% 60%", accent: "170 100% 50%", premium: true, className: "neon-effect animate-neon-pulse" },
  { name: "Royal Gold", primary: "45 100% 50%", accent: "30 100% 45%", premium: true, className: "animate-glow" },
  { name: "Aurora Borealis", primary: "160 90% 50%", accent: "280 90% 60%", premium: true, className: "animate-shimmer" },
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
        
        // Apply special classes for premium themes
        const body = document.body;
        body.classList.remove('glass-premium', 'animate-glass-shimmer', 'neon-effect', 'animate-neon-pulse', 'animate-glow', 'animate-shimmer');
        
        if (theme.className) {
          const classes = theme.className.split(' ');
          body.classList.add(...classes);
        }
      }
    }
  }, []);
};

export { COLOR_THEMES };
