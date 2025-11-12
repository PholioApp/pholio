import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Heart } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface FollowingImage {
  id: string;
  title: string;
  image_url: string;
  price: number;
  created_at: string;
  seller_id: string;
  seller: {
    username: string;
    avatar_url: string;
  };
}

const Following = () => {
  const [images, setImages] = useState<FollowingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchFollowingImages();
  }, []);

  const fetchFollowingImages = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get users that current user follows
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsError) throw followsError;

      const followingIds = followsData.map((f) => f.following_id);
      setFollowingCount(followingIds.length);

      if (followingIds.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      // Get images from followed users
      const { data: imagesData, error: imagesError } = await supabase
        .from("images")
        .select(`
          *,
          seller:profiles!images_seller_id_fkey(username, avatar_url)
        `)
        .in("seller_id", followingIds)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (imagesError) throw imagesError;

      setImages(imagesData || []);
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

  if (loading) {
    return <LoadingSpinner message="Loading feed..." />;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2" size={18} />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Following Feed
              </h1>
              <p className="text-sm text-muted-foreground">
                Latest uploads from {followingCount} photographer{followingCount !== 1 ? 's' : ''} you follow
              </p>
            </div>
          </div>
        </div>

        {images.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-card border-border animate-scale-up">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-bounce-subtle" />
            <h2 className="text-2xl font-bold mb-2">No Posts Yet</h2>
            <p className="text-muted-foreground mb-6">
              {followingCount === 0 
                ? "Start following photographers to see their latest uploads here!"
                : "The photographers you follow haven't posted anything yet."}
            </p>
            <Button onClick={() => navigate("/search")} className="bg-gradient-primary hover:scale-110 transition-all">
              Discover Photographers
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card
                key={image.id}
                className="overflow-hidden bg-gradient-card border-border cursor-pointer transition-all hover:scale-105 hover:shadow-glow animate-scale-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/profile/${image.seller_id}`)}
              >
                <div className="aspect-square bg-secondary relative group">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-2 right-2 bg-gradient-primary rounded-lg px-2 py-1 shadow-glow transform group-hover:scale-110 transition-transform">
                    <span className="text-xs font-bold text-white">${image.price}</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden transition-transform hover:scale-125">
                      {image.seller.avatar_url ? (
                        <img
                          src={image.seller.avatar_url}
                          alt={image.seller.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary" />
                      )}
                    </div>
                    <span className="text-xs font-medium truncate">
                      @{image.seller.username}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm truncate mb-1">{image.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Following;
