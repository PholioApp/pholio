import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/sounds";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification = ({ achievement, onClose }: AchievementNotificationProps) => {
  useEffect(() => {
    if (achievement) {
      // Play achievement sound
      soundManager.playAchievement();

      // Trophy confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#ffd700', '#ffed4e', '#ffc107', '#ff9800'],
        shapes: ['circle', 'square'],
        scalar: 2,
        gravity: 0.8,
        ticks: 300,
      });

      // Auto close after 5 seconds
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <Card className="p-6 bg-gradient-card border-2 border-primary shadow-glow">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Trophy className="text-primary animate-bounce" size={48} />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl">{achievement.icon}</span>
                  <h3 className="text-xl font-bold text-primary">Achievement Unlocked!</h3>
                </div>
                <p className="text-lg font-semibold">{achievement.name}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
