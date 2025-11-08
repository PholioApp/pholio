import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_count: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export const AchievementsDialog = () => {
  const [open, setOpen] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAchievements();
    }
  }, [open]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_count", { ascending: true });

      if (achievementsError) throw achievementsError;

      // Fetch user's unlocked achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id);

      if (userAchievementsError) throw userAchievementsError;

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          title="Achievements"
          className="transition-all hover:scale-110 active:scale-95 hover:text-accent relative"
        >
          <Trophy size={20} />
          {unlockedCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unlockedCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="text-primary" />
            Achievements ({unlockedCount}/{totalCount})
          </DialogTitle>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading achievements...</p>
          ) : (
            <div className="grid gap-3">
              {achievements.map((achievement) => {
                const unlocked = isUnlocked(achievement.id);
                return (
                  <Card
                    key={achievement.id}
                    className={`p-4 transition-all ${
                      unlocked
                        ? "bg-gradient-card border-primary shadow-glow hover:scale-105"
                        : "bg-card/50 border-border opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">{unlocked ? achievement.icon : <Lock size={32} className="text-muted-foreground" />}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {achievement.requirement_type.replace('_', ' ')} • {achievement.requirement_count}x
                        </p>
                        {unlocked && (
                          <p className="text-xs text-primary mt-1 font-semibold">
                            ✓ Unlocked
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
