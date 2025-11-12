import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { useColorTheme } from "./hooks/useColorTheme";

// Apply saved color theme immediately
const savedTheme = localStorage.getItem("colorTheme");
if (savedTheme) {
  const themeIndex = parseInt(savedTheme);
  const COLOR_THEMES = [
    { primary: "270 91% 65%", accent: "280 89% 60%" },
    { primary: "210 100% 50%", accent: "200 98% 60%" },
    { primary: "25 95% 55%", accent: "15 90% 60%" },
    { primary: "140 70% 45%", accent: "160 75% 50%" },
    { primary: "340 82% 62%", accent: "350 85% 70%" },
    { primary: "45 93% 58%", accent: "40 96% 65%" },
  ];
  const theme = COLOR_THEMES[themeIndex];
  if (theme) {
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--accent', theme.accent);
  }
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <App />
  </ThemeProvider>
);
