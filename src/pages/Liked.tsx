import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";

const Liked = () => {
  const [user, setUser] = useState<any>(null);
  const [likedImages, setLikedImages] = useState<any[]>([]);
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
        fetchLikedImages(user.id);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchLikedImages = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("likes")
        .select(`
          id,
          created_at,
          image:images(
            id,
            title,
            description,
            price,
            image_url,
            seller:profiles!images_seller_id_fkey(username, avatar_url)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLikedImages(data || []);
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

  const handleUnlike = async (likeId: string) => {
    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", likeId);

      if (error) throw error;

      setLikedImages(prev => prev.filter(like => like.id !== likeId));
      toast({
        title: "Removed",
        description: "Image removed from favorites",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleBuy = async (imageId: string, price: number) => {
    if (!user) return;

    try {
      // Create Stripe checkout session instead of direct purchase insert
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { imageId, price },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
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
        description: error.message || "Failed to start checkout process",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="secondary" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2" size={18} />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            <Heart className="inline-block mr-2" size={24} />
            My Favorites
          </h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {likedImages.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-card border-border">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start swiping and like images to save them here!
            </p>
            <Button onClick={() => navigate("/")} className="bg-gradient-primary">
              Discover Images
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedImages.map((like) => {
              const img = like.image;
              if (!img) return null;
              
              return (
                <Card key={like.id} className="overflow-hidden bg-gradient-card border-border shadow-card hover-scale">
                  <div className="aspect-[3/4] bg-secondary relative">
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-gradient-primary rounded-lg px-3 py-1 shadow-glow">
                      <span className="text-sm font-bold">${img.price}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{img.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${img.seller_id}`);
                        }}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        by @{img.seller?.username || "unknown"}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBuy(img.id, img.price)}
                        className="flex-1 bg-gradient-primary"
                      >
                        <ShoppingCart className="mr-2" size={16} />
                        Buy
                      </Button>
                      <Button
                        onClick={() => handleUnlike(like.id)}
                        variant="secondary"
                        size="icon"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Liked;
