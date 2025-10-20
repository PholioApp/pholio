import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "@/components/SwipeCard";
import { useToast } from "@/hooks/use-toast";
import { Upload, User, Image as ImageIcon, ShoppingBag, Heart, Search } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
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
      const { error } = await supabase.from("purchases").insert({
        buyer_id: user.id,
        image_id: currentImage.id,
        amount: currentImage.price,
        status: "completed",
      });

      if (error) throw error;

      toast({
        title: "Purchase successful!",
        description: "The image has been added to your collection.",
      });

      setCurrentIndex((prev) => prev + 1);
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
        <div className="flex items-center justify-between mb-8 pt-4">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SwipeSnap
          </h1>
          <div className="flex gap-2">
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
