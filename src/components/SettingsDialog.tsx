import { useState } from "react";
import { Music, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
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

export const SettingsDialog = () => {
  const [isMusicMuted, setIsMusicMuted] = useState(soundManager.isMusicMutedState());
  const { theme, setTheme } = useTheme();

  const handleMusicToggle = () => {
    const newMutedState = soundManager.toggleMusicMute();
    setIsMusicMuted(newMutedState);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Music className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your SwipeSnap experience
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor="music-toggle" className="text-base font-medium">
                Background Music
              </Label>
              <p className="text-sm text-muted-foreground">
                {isMusicMuted ? "Music is muted" : "Music is playing"}
              </p>
            </div>
            <Switch
              id="music-toggle"
              checked={!isMusicMuted}
              onCheckedChange={handleMusicToggle}
            />
          </div>
          
          <div className="flex items-center justify-between py-3 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle" className="text-base font-medium">
                Theme
              </Label>
              <p className="text-sm text-muted-foreground">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="icon"
                onClick={() => setTheme("light")}
                className="transition-all hover:scale-110 active:scale-95"
              >
                <Sun className="h-5 w-5" />
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="icon"
                onClick={() => setTheme("dark")}
                className="transition-all hover:scale-110 active:scale-95"
              >
                <Moon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
