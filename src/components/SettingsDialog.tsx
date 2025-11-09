import { useState } from "react";
import { Music } from "lucide-react";
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
        <div className="flex items-center justify-between py-4">
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
      </DialogContent>
    </Dialog>
  );
};
