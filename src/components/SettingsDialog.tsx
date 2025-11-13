import { useState, useEffect } from "react";
import { Music, Moon, Sun, Bell, Globe, Shield, Palette, Zap, Sparkles, Crown, Lock } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { soundManager } from "@/lib/sounds";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { Badge } from "@/components/ui/badge";

const COLOR_THEMES = [
  { name: "Purple Dream", primary: "270 91% 65%", accent: "280 89% 60%", icon: "💜", premium: false },
  { name: "Ocean Blue", primary: "210 100% 50%", accent: "200 98% 60%", icon: "🌊", premium: false },
  { name: "Sunset Orange", primary: "25 95% 55%", accent: "15 90% 60%", icon: "🌅", premium: false },
  { name: "Forest Green", primary: "140 70% 45%", accent: "160 75% 50%", icon: "🌲", premium: false },
  { name: "Rose Pink", primary: "340 82% 62%", accent: "350 85% 70%", icon: "🌹", premium: false },
  { name: "Golden Sun", primary: "45 93% 58%", accent: "40 96% 65%", icon: "☀️", premium: false },
  { name: "Glass Morphism", primary: "220 100% 70%", accent: "240 100% 80%", icon: "✨", premium: true },
  { name: "Neon Cyber", primary: "310 100% 60%", accent: "170 100% 50%", icon: "🌐", premium: true },
  { name: "Royal Gold", primary: "45 100% 50%", accent: "30 100% 45%", icon: "👑", premium: true },
  { name: "Aurora Borealis", primary: "160 90% 50%", accent: "280 90% 60%", icon: "🌌", premium: true },
];

export const SettingsDialog = ({ triggerButton }: { triggerButton?: React.ReactNode }) => {
  const [isMusicMuted, setIsMusicMuted] = useState(soundManager.isMusicMutedState());
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [language, setLanguage] = useState("en");
  const [privacy, setPrivacy] = useState("public");
  const [colorTheme, setColorTheme] = useState(0);
  const { theme, setTheme } = useTheme();
  const { isPremium, loading, startCheckout, openCustomerPortal } = usePremiumStatus();

  useEffect(() => {
    // Load settings from localStorage
    const savedNotifications = localStorage.getItem("notifications");
    const savedAutoplay = localStorage.getItem("autoplay");
    const savedLanguage = localStorage.getItem("language");
    const savedPrivacy = localStorage.getItem("privacy");
    const savedColorTheme = localStorage.getItem("colorTheme");
    
    if (savedNotifications) setNotifications(savedNotifications === "true");
    if (savedAutoplay) setAutoplay(savedAutoplay === "true");
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedPrivacy) setPrivacy(savedPrivacy);
    if (savedColorTheme) {
      const themeIndex = parseInt(savedColorTheme);
      setColorTheme(themeIndex);
      applyColorTheme(themeIndex);
    }
  }, []);

  const applyColorTheme = (index: number) => {
    const selectedTheme = COLOR_THEMES[index];
    const root = document.documentElement;
    root.style.setProperty('--primary', selectedTheme.primary);
    root.style.setProperty('--accent', selectedTheme.accent);
  };

  const handleColorThemeChange = (index: number) => {
    const selectedTheme = COLOR_THEMES[index];
    if (selectedTheme.premium && !isPremium) {
      return; // Don't allow non-premium users to select premium themes
    }
    setColorTheme(index);
    applyColorTheme(index);
    localStorage.setItem("colorTheme", String(index));
  };

  const handleMusicToggle = () => {
    const newMutedState = soundManager.toggleMusicMute();
    setIsMusicMuted(newMutedState);
  };

  const handleNotificationsToggle = () => {
    const newState = !notifications;
    setNotifications(newState);
    localStorage.setItem("notifications", String(newState));
  };

  const handleAutoplayToggle = () => {
    const newState = !autoplay;
    setAutoplay(newState);
    localStorage.setItem("autoplay", String(newState));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="icon" className="relative">
            <Music className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto animate-scale-up">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-slide-down">
            Settings
          </DialogTitle>
          <DialogDescription className="animate-fade-in">
            Customize your SwipeSnap experience
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">{/* Audio Settings */}
          <div className="flex items-center gap-3 py-3 px-3 bg-gradient-card rounded-lg border border-border animate-slide-in-left hover:scale-[1.02] transition-all">
            <div className="p-2 rounded-lg bg-primary/10 animate-glow">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-0.5">
              <Label htmlFor="music-toggle" className="text-base font-medium cursor-pointer">
                Background Music
              </Label>
              <p className="text-xs text-muted-foreground">
                {isMusicMuted ? "🔇 Music is muted" : "🎵 Music is playing"}
              </p>
            </div>
            <Switch
              id="music-toggle"
              checked={!isMusicMuted}
              onCheckedChange={handleMusicToggle}
              className="transition-all hover:scale-110"
            />
          </div>

          {/* Autoplay */}
          <div className="flex items-center gap-3 py-3 px-3 bg-gradient-card rounded-lg border border-border animate-slide-in-left hover:scale-[1.02] transition-all" style={{ animationDelay: "0.05s" }}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary animate-bounce-subtle" />
            </div>
            <div className="flex-1 space-y-0.5">
              <Label htmlFor="autoplay-toggle" className="text-base font-medium cursor-pointer">
                Autoplay Music
              </Label>
              <p className="text-xs text-muted-foreground">
                {autoplay ? "Music starts automatically" : "Manual start required"}
              </p>
            </div>
            <Switch
              id="autoplay-toggle"
              checked={autoplay}
              onCheckedChange={handleAutoplayToggle}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center gap-3 py-3 px-3 bg-gradient-card rounded-lg border border-border animate-slide-in-left hover:scale-[1.02] transition-all" style={{ animationDelay: "0.1s" }}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary animate-wiggle" />
            </div>
            <div className="flex-1 space-y-0.5">
              <Label htmlFor="notifications-toggle" className="text-base font-medium cursor-pointer">
                Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                {notifications ? "✅ Enabled" : "🔕 Disabled"}
              </p>
            </div>
            <Switch
              id="notifications-toggle"
              checked={notifications}
              onCheckedChange={handleNotificationsToggle}
            />
          </div>
          
          {/* Theme Mode */}
          <div className="py-3 px-3 bg-gradient-card rounded-lg border border-border animate-slide-in-left hover:scale-[1.02] transition-all" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary animate-hover-float" />
              </div>
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Display Mode</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "🌙 Dark mode" : "☀️ Light mode"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1 transition-all hover:scale-105 active:scale-95"
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1 transition-all hover:scale-105 active:scale-95"
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>

          {/* Color Theme */}
          <div className="py-3 px-3 bg-gradient-card rounded-lg border border-border animate-slide-in-left hover:scale-[1.02] transition-all" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary animate-glow" />
              </div>
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Color Theme</Label>
                <p className="text-xs text-muted-foreground">
                  {COLOR_THEMES[colorTheme].icon} {COLOR_THEMES[colorTheme].name}
                </p>
              </div>
              {isPremium && (
                <Badge className="bg-gradient-primary animate-glow">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_THEMES.map((ct, index) => (
                <Button
                  key={index}
                  variant={colorTheme === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleColorThemeChange(index)}
                  disabled={ct.premium && !isPremium}
                  className="transition-all hover:scale-105 active:scale-95 text-xs relative"
                >
                  {ct.premium && !isPremium && (
                    <Lock className="h-3 w-3 absolute top-1 right-1" />
                  )}
                  <span className="mr-1">{ct.icon}</span>
                  {ct.name.split(' ')[0]}
                </Button>
              ))}
            </div>
            {!isPremium && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                🔒 Unlock 4 premium themes with Premium subscription
              </p>
            )}
          </div>

          {/* Premium Section */}
          {!isPremium && (
            <div className="py-4 px-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border-2 border-primary/50 animate-slide-in-left hover:scale-[1.02] transition-all" style={{ animationDelay: "0.25s" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Crown className="h-6 w-6 text-primary animate-bounce" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <Label className="text-lg font-bold">SwipeSnap Premium</Label>
                  <p className="text-xs text-muted-foreground">
                    €1/month - Unlock exclusive features
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>4 Exclusive Premium Themes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Priority Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-primary" />
                  <span>Premium Badge on Profile</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Ad-Free Experience</span>
                </div>
              </div>
              <Button 
                onClick={startCheckout}
                className="w-full bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 active:scale-95"
                disabled={loading}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          )}

          {isPremium && (
            <div className="py-4 px-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border-2 border-primary/50 animate-slide-in-left" style={{ animationDelay: "0.25s" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Crown className="h-6 w-6 text-primary animate-glow" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <Label className="text-lg font-bold">Premium Active</Label>
                  <p className="text-xs text-muted-foreground">
                    You're enjoying all premium features!
                  </p>
                </div>
              </div>
              <Button 
                onClick={openCustomerPortal}
                variant="outline"
                className="w-full transition-all hover:scale-105 active:scale-95"
              >
                Manage Subscription
              </Button>
            </div>
          )}

          {/* Privacy */}
          <div className="py-3 px-3 bg-gradient-card rounded-lg border border-border animate-slide-in-left hover:scale-[1.02] transition-all" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary animate-float" />
              </div>
              <div className="flex-1 space-y-0.5">
                <Label className="text-base font-medium">Privacy</Label>
                <p className="text-xs text-muted-foreground">
                  Profile visibility settings
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={privacy === "public" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPrivacy("public");
                  localStorage.setItem("privacy", "public");
                }}
                className="flex-1 transition-all hover:scale-105 active:scale-95"
              >
                <Globe className="h-4 w-4 mr-2" />
                Public
              </Button>
              <Button
                variant={privacy === "private" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPrivacy("private");
                  localStorage.setItem("privacy", "private");
                }}
                className="flex-1 transition-all hover:scale-105 active:scale-95"
              >
                <Shield className="h-4 w-4 mr-2" />
                Private
              </Button>
            </div>
          </div>

          {/* App Info */}
          <div className="pt-4 border-t text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p className="text-xs text-muted-foreground animate-pulse">
              SwipeSnap v1.0 • Made with 💜
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
