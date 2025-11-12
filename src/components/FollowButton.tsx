import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus } from "lucide-react";
import confetti from "canvas-confetti";

interface FollowButtonProps {
  userId: string;
  currentUserId: string;
  variant?: "default" | "outline" | "secondary";
  showText?: boolean;
}

export const FollowButton = ({ 
  userId, 
  currentUserId, 
  variant = "default",
  showText = true 
}: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    checkFollowStatus();
    fetchFollowerCount();
  }, [userId, currentUserId]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const fetchFollowerCount = async () => {
    try {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (error) throw error;
      setFollowerCount(count || 0);
    } catch (error) {
      console.error("Error fetching follower count:", error);
    }
  };

  const handleFollow = async () => {
    if (userId === currentUserId) {
      toast({
        variant: "destructive",
        title: "Cannot follow yourself",
        description: "You can't follow your own profile",
      });
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
        toast({
          title: "Unfollowed",
          description: "You have unfollowed this user",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
        
        // Celebration confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#8b5cf6', '#7c3aed'],
        });

        toast({
          title: "Following! 🎉",
          description: "You'll see their latest uploads in your feed",
        });
      }
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

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : variant}
      className={`transition-all hover:scale-105 active:scale-95 ${
        isFollowing ? "" : "bg-gradient-primary"
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus className={showText ? "mr-2" : ""} size={18} />
          {showText && `Following (${followerCount})`}
        </>
      ) : (
        <>
          <UserPlus className={showText ? "mr-2" : ""} size={18} />
          {showText && `Follow (${followerCount})`}
        </>
      )}
    </Button>
  );
};
