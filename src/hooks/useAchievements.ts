import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_count: number;
}

export const useAchievements = () => {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const { toast } = useToast();

  const checkAchievements = useCallback(async (type: string, count: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get achievements for this type
      const { data: achievements, error: achError } = await supabase
        .from("achievements")
        .select("*")
        .eq("requirement_type", type)
        .lte("requirement_count", count);

      if (achError) throw achError;
      if (!achievements || achievements.length === 0) return;

      // Check which achievements are already unlocked
      const { data: unlockedAchievements, error: unlockError } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id)
        .in("achievement_id", achievements.map(a => a.id));

      if (unlockError) throw unlockError;

      const unlockedIds = new Set(unlockedAchievements?.map(ua => ua.achievement_id) || []);

      // Find newly earned achievements
      for (const achievement of achievements) {
        if (!unlockedIds.has(achievement.id)) {
          // Unlock this achievement
          const { error: insertError } = await supabase
            .from("user_achievements")
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });

          if (insertError) {
            // If error is duplicate key (already unlocked), ignore it
            if (!insertError.message.includes("duplicate")) {
              throw insertError;
            }
          } else {
            // Show notification for this achievement
            setCurrentAchievement(achievement);
            break; // Only show one at a time
          }
        }
      }
    } catch (error: any) {
      console.error("Error checking achievements:", error);
    }
  }, []);

  const checkLikes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count !== null) {
        await checkAchievements("likes", count);
      }
    } catch (error: any) {
      console.error("Error checking likes:", error);
    }
  }, [checkAchievements]);

  const checkPurchases = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("purchases")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", user.id);

      if (count !== null) {
        await checkAchievements("purchases", count);
      }
    } catch (error: any) {
      console.error("Error checking purchases:", error);
    }
  }, [checkAchievements]);

  const checkUploads = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("images")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id);

      if (count !== null) {
        await checkAchievements("uploads", count);
      }
    } catch (error: any) {
      console.error("Error checking uploads:", error);
    }
  }, [checkAchievements]);

  const clearAchievement = useCallback(() => {
    setCurrentAchievement(null);
  }, []);

  return {
    currentAchievement,
    clearAchievement,
    checkLikes,
    checkPurchases,
    checkUploads,
  };
};
