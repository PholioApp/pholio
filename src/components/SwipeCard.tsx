import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X, ShoppingCart, User } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface SwipeCardProps {
  image: {
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
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
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

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
          <div className="absolute top-4 left-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
              {image.seller.avatar_url ? (
                <img src={image.seller.avatar_url} alt={image.seller.username} className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-muted-foreground" />
              )}
            </div>
            <span className="text-sm font-medium">@{image.seller.username}</span>
          </div>

          {/* Price tag */}
          <div className="absolute top-4 right-4 bg-gradient-primary rounded-lg px-3 py-1.5 shadow-glow">
            <span className="text-sm font-bold">${image.price}</span>
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
              onClick={onSwipeLeft}
              variant="secondary"
              size="lg"
              className="flex-1"
            >
              <X className="mr-2" size={20} />
              Pass
            </Button>
            <Button
              onClick={onSwipeRight}
              size="lg"
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              <Heart className="mr-2" size={20} />
              Like
            </Button>
            <Button
              onClick={onBuy}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            >
              <ShoppingCart size={20} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
