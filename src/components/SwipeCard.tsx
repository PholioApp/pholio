import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, ShoppingCart, User, Share2, Flag } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReportDialog } from "@/components/ReportDialog";
import { soundManager } from "@/lib/sounds";

interface SwipeCardProps {
  image: {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    seller_id: string;
    seller: {
      username: string;
      avatar_url?: string;
    };
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onBuy: () => void;
}

export const SwipeCard = ({ image, onSwipeLeft, onSwipeRight, onBuy }: SwipeCardProps) => {
  const [exitX, setExitX] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchLikeCount();
  }, [image.id]);

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("image_id", image.id);
    setLikeCount(count || 0);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 1000 : -1000);
      if (info.offset.x > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
  };

  const handleShareImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: image.title,
      text: `Check out "${image.title}" by @${image.seller.username} on SwipeSnap!`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Thanks for sharing!",
          description: "Help creators get discovered 🚀",
        });
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Link copied!",
          description: "Share this amazing photo with others!",
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to share",
        });
      }
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        position: "absolute",
        width: "100%",
        cursor: "grab",
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ cursor: "grabbing" }}
    >
      <Card className="overflow-hidden bg-gradient-card border-border shadow-card">
        <div className="relative aspect-[3/4] bg-secondary">
          <img
            src={image.image_url}
            alt={image.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
          
          {/* Seller info overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/profile/${image.seller_id}`;
              }}
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 hover:bg-background/90 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {image.seller.avatar_url ? (
                  <img src={image.seller.avatar_url} alt={image.seller.username} className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-medium">@{image.seller.username}</span>
            </button>
            
            {/* Share and Report buttons */}
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={handleShareImage}
              >
                <Share2 size={16} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportDialogOpen(true);
                }}
              >
                <Flag size={16} />
              </Button>
            </div>
          </div>

          {/* Price and likes */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <div className="bg-gradient-primary rounded-lg px-3 py-1.5 shadow-glow">
              <span className="text-sm font-bold">${image.price}</span>
            </div>
            {likeCount > 0 && (
              <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1">
                <Heart size={14} className="text-accent fill-accent" />
                <span className="text-xs font-medium">{likeCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold mb-2">{image.title}</h3>
            {image.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {image.description}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                soundManager.play('pass', 0.5);
                onSwipeLeft();
              }}
              variant="secondary"
              size="lg"
              className="flex-1"
            >
              <X className="mr-2" size={20} />
              Pass
            </Button>
            <Button
              onClick={() => {
                soundManager.play('like');
                onSwipeRight();
              }}
              size="lg"
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              <Heart className="mr-2" size={20} />
              Like
            </Button>
            <Button
              onClick={() => {
                soundManager.play('purchase');
                onBuy();
              }}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            >
              <ShoppingCart size={20} />
            </Button>
          </div>
        </div>
      </Card>

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        contentType="image"
        contentId={image.id}
        contentPreview={`"${image.title}" by @${image.seller.username}`}
      />
    </motion.div>
  );
};
