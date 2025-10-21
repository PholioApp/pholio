import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "@/components/SwipeCard";
import { useToast } from "@/hooks/use-toast";
import { Upload, User, Image as ImageIcon, ShoppingBag, Heart, Search, Share2, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalImages: 0, totalUsers: 0, totalLikes: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

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
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeRight = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage || !user) return;

    try {
      // Insert like into database
      const { error } = await supabase.from("likes").insert({
        user_id: user.id,
        image_id: currentImage.id,
      });

      if (error) throw error;

      toast({
        title: "Liked!",
        description: "Image added to your favorites",
      });
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

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { imageId: currentImage.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to checkout",
          description: "Complete your purchase in the new tab.",
        });
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SwipeSnap
          </h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleShare}
              title="Share App"
              className="bg-gradient-primary hover:opacity-90"
            >
              <Share2 size={20} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate("/search")}
              title="Search"
            >
              <Search size={20} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate("/liked")}
              title="Favorites"
            >
              <Heart size={20} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate("/purchases")}
              title="Purchases"
            >
              <ShoppingBag size={20} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate("/upload")}
              title="Upload"
            >
              <Upload size={20} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate("/profile")}
              title="Profile"
            >
              <User size={20} />
            </Button>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 bg-gradient-card border-border">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">Images</span>
            </div>
            <p className="text-xl font-bold">{stats.totalImages}</p>
          </Card>
          <Card className="p-3 bg-gradient-card border-border">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">Creators</span>
            </div>
            <p className="text-xl font-bold">{stats.totalUsers}</p>
          </Card>
          <Card className="p-3 bg-gradient-card border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary" />
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
        <div className="text-center text-sm text-muted-foreground">
          {images.length > 0 && currentIndex < images.length && (
            <p>
              {currentIndex + 1} / {images.length} images
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
