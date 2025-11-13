import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "@/components/SwipeCard";
import { useToast } from "@/hooks/use-toast";
import { Settings, TrendingUp, Trophy, Search, Heart, Upload, LogOut, Users, Share2, ShoppingBag, User, Image as ImageIcon, UserPlus } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import confetti from "canvas-confetti";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { AchievementNotification } from "@/components/AchievementNotification";
import { AchievementsDialog } from "@/components/AchievementsDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { soundManager } from "@/lib/sounds";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalImages: 0, totalUsers: 0, totalLikes: 0 });
  const [logoClicks, setLogoClicks] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentAchievement, clearAchievement, checkLikes, checkPurchases } = useAchievements();

  useEffect(() => {
    // Initialize sound manager
    soundManager.init();
    
    // Start background music with user interaction (click anywhere on the page once)
    const startMusic = () => {
      soundManager.startBackgroundMusic();
      document.removeEventListener('click', startMusic);
    };
    document.addEventListener('click', startMusic);
    
    return () => {
      document.removeEventListener('click', startMusic);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        fetchImages(user.id);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchImages = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("images")
        .select(`
          *,
          seller:profiles!images_seller_id_fkey(username, avatar_url)
        `)
        .eq("status", "active")
        .neq("seller_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setImages(data || []);
      
      // Fetch platform stats
      await fetchStats();
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

  const fetchStats = async () => {
    try {
      const [imagesCount, usersCount, likesCount] = await Promise.all([
        supabase.from("images").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("likes").select("*", { count: "exact", head: true }),
      ]);
      
      setStats({
        totalImages: imagesCount.count || 0,
        totalUsers: usersCount.count || 0,
        totalLikes: likesCount.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "SwipeSnap - Discover & Buy Amazing Photos",
      text: "Check out SwipeSnap! Discover and purchase stunning photography with a simple swipe.",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Thanks for sharing!",
          description: "Help us grow by inviting friends 🎉",
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied!",
          description: "Share it with your friends to help us grow!",
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

  const handleSwipeLeft = () => {
    soundManager.play('pass', 0.5);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeRight = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage || !user) return;

    // Play like sound
    soundManager.play('like');

    // Heart confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff0080', '#ff69b4', '#ff1493', '#c71585'],
      shapes: ['circle'],
      scalar: 1.2,
    });

    try {
      // Insert like into database
      const { error } = await supabase.from("likes").insert({
        user_id: user.id,
        image_id: currentImage.id,
      });

      if (error) throw error;

      toast({
        title: "Liked! 💖",
        description: "Image added to your favorites",
      });

      // Check for achievements
      await checkLikes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
    
    setCurrentIndex((prev) => prev + 1);
  };

  const handleBuy = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage || !user) return;

    // Play purchase sound
    soundManager.play('purchase');

    // Money confetti!
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#22c55e', '#10b981', '#84cc16', '#ffd700'],
      shapes: ['square', 'circle'],
      scalar: 1.5,
      ticks: 200,
    });

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { imageId: currentImage.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to checkout 💰",
          description: "Complete your purchase in the new tab.",
        });

        // Check for achievements
        await checkPurchases();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading images..." />;
  }

  return (
    <div className="min-h-screen p-4 relative">
      <ParallaxBackground />
      <AchievementNotification achievement={currentAchievement} onClose={clearAchievement} />
      
      {/* Ad Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
        <AdBanner />
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 pt-4 animate-fade-in">
          <h1 
            className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
            onClick={() => {
              setLogoClicks(prev => prev + 1);
              if (logoClicks + 1 === 5) {
                // Easter egg: Camera explosion!
                confetti({
                  particleCount: 200,
                  spread: 180,
                  origin: { y: 0.3, x: 0.1 },
                  colors: ['#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9'],
                  shapes: ['square', 'circle'],
                  scalar: 2,
                  gravity: 1.5,
                  ticks: 300,
                });
                toast({
                  title: "📸 You found a secret! 📸",
                  description: "Keep clicking for more surprises...",
                });
                setLogoClicks(0);
              }
            }}
            title="Click me multiple times... 👀"
          >
            SwipeSnap
          </h1>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
          <Card className="p-3 bg-gradient-card border-border transition-all duration-300 hover:scale-105 hover:shadow-glow hover:-translate-y-1 cursor-pointer animate-bounce-in hover-lift">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon size={16} className="text-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Images</span>
            </div>
            <p className="text-xl font-bold">{stats.totalImages}</p>
          </Card>
          <Card className="p-3 bg-gradient-card border-border transition-all duration-300 hover:scale-105 hover:shadow-glow hover:-translate-y-1 cursor-pointer animate-bounce-in hover-lift" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="text-xs text-muted-foreground">Creators</span>
            </div>
            <p className="text-xl font-bold">{stats.totalUsers}</p>
          </Card>
          <Card className="p-3 bg-gradient-card border-border transition-all duration-300 hover:scale-105 hover:shadow-glow hover:-translate-y-1 cursor-pointer animate-bounce-in hover-lift" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="text-xs text-muted-foreground">Likes</span>
            </div>
            <p className="text-xl font-bold">{stats.totalLikes}</p>
          </Card>
        </div>

        {/* Swipe Area */}
        <div className="relative h-[600px] mb-8">
          {images.length === 0 || currentIndex >= images.length ? (
            <div className="flex flex-col items-center justify-center h-full">
              <ImageIcon className="w-16 h-16 mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">No more images</h2>
              <p className="text-muted-foreground text-center mb-4">
                Check back later for more amazing photography!
              </p>
              <Button onClick={() => navigate("/upload")} className="bg-gradient-primary">
                Upload Your Own
              </Button>
            </div>
          ) : (
            <>
              {images.slice(currentIndex, currentIndex + 2).map((image, idx) => (
                <div
                  key={image.id}
                  style={{
                    zIndex: 2 - idx,
                    position: idx === 0 ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                  }}
                >
                  <SwipeCard
                    image={{
                      ...image,
                      seller: image.seller || { username: "unknown" },
                    }}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    onBuy={handleBuy}
                  />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="text-center text-sm text-muted-foreground mb-24">
          {images.length > 0 && currentIndex < images.length && (
            <p>
              {currentIndex + 1} / {images.length} images
            </p>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border shadow-2xl z-50 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Primary Navigation Row */}
          <div className="flex items-center justify-around gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/search");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-primary/10 transition-all hover:scale-110 group"
            >
              <Search size={20} className="mb-1 group-hover:text-primary transition-colors" />
              <span className="text-xs">Search</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/trending");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-primary/10 transition-all hover:scale-110 group"
            >
              <TrendingUp size={20} className="mb-1 group-hover:text-primary transition-colors" />
              <span className="text-xs">Trending</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/challenges");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-primary/10 transition-all hover:scale-110 group"
            >
              <Trophy size={20} className="mb-1 group-hover:text-primary transition-colors" />
              <span className="text-xs">Challenges</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/following");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-primary/10 transition-all hover:scale-110 group"
            >
              <UserPlus size={20} className="mb-1 group-hover:text-primary transition-colors" />
              <span className="text-xs">Following</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/liked");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-primary/10 transition-all hover:scale-110 group"
            >
              <Heart size={20} className="mb-1 group-hover:text-primary transition-colors" />
              <span className="text-xs">Liked</span>
            </Button>
          </div>

          {/* Secondary Navigation Row */}
          <div className="flex items-center justify-around gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/upload");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-accent/10 transition-all hover:scale-110 group"
            >
              <Upload size={20} className="mb-1 group-hover:text-accent transition-colors" />
              <span className="text-xs">Upload</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/purchases");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-accent/10 transition-all hover:scale-110 group"
            >
              <ShoppingBag size={20} className="mb-1 group-hover:text-accent transition-colors" />
              <span className="text-xs">Purchases</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/leaderboard");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-accent/10 transition-all hover:scale-110 group"
            >
              <Users size={20} className="mb-1 group-hover:text-accent transition-colors" />
              <span className="text-xs">Leaders</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                navigate("/profile");
              }}
              className="flex-col h-auto py-2 px-3 hover:bg-accent/10 transition-all hover:scale-110 group"
            >
              <User size={20} className="mb-1 group-hover:text-accent transition-colors" />
              <span className="text-xs">Profile</span>
            </Button>
            <div className="flex-col h-auto py-2 px-3">
              <SettingsDialog />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                soundManager.play('click');
                handleShare();
              }}
              className="hover:bg-gradient-primary hover:text-white transition-all hover:scale-105"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
            <AchievementsDialog />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
