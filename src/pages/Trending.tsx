import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, TrendingUp, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

const Trending = () => {
  const navigate = useNavigate();
  const [trendingImages, setTrendingImages] = useState<any[]>([]);
  const [promotedImages, setPromotedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      // Fetch promoted images
      const { data: promoted } = await supabase
        .from("promotions")
        .select(`
          *,
          images (
            id,
            title,
            image_url,
            price,
            description,
            seller_id,
            profiles!images_seller_id_fkey (
              username,
              avatar_url
            )
          )
        `)
        .eq("status", "active")
        .gt("end_date", new Date().toISOString())
        .order("impressions", { ascending: false })
        .limit(6);

      setPromotedImages(promoted || []);

      // Fetch trending images (most liked in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentLikes } = await supabase
        .from("likes")
        .select("image_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const likeCounts = recentLikes?.reduce((acc: any, curr) => {
        acc[curr.image_id] = (acc[curr.image_id] || 0) + 1;
        return acc;
      }, {});

      const trendingImageIds = Object.entries(likeCounts || {})
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 12)
        .map(([id]) => id);

      if (trendingImageIds.length > 0) {
        const { data: images } = await supabase
          .from("images")
          .select(`
            *,
            profiles!images_seller_id_fkey (
              username,
              avatar_url
            )
          `)
          .in("id", trendingImageIds)
          .eq("status", "active");

        const imagesWithLikes = images?.map((img) => ({
          ...img,
          recentLikes: likeCounts[img.id],
        })).sort((a, b) => b.recentLikes - a.recentLikes);

        setTrendingImages(imagesWithLikes || []);
      }
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: any) => {
    navigate(`/profile/${image.seller_id}`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:scale-105 transition-transform animate-slide-in-left"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8 animate-slide-down">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent flex items-center gap-3">
            <Flame className="h-10 w-10 text-orange-500 animate-bounce-in" />
            Trending Now
          </h1>
          <p className="text-muted-foreground">
            Discover the hottest photos and promoted content
          </p>
        </div>

        {promotedImages.length > 0 && (
          <Card className="p-6 mb-8 animate-scale-up">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary animate-float" />
              Featured & Promoted
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotedImages.map((promo: any, index: number) => (
                <Card
                  key={promo.id}
                  className="cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-glow animate-zoom-in relative overflow-hidden group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleImageClick(promo.images)}
                >
                  <Badge className="absolute top-2 left-2 z-10 bg-primary animate-pulse">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Promoted
                  </Badge>
                  <img
                    src={promo.images?.image_url}
                    alt={promo.images?.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {promo.images?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      by {promo.images?.profiles?.username}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-primary font-bold">
                        ${Number(promo.images?.price).toFixed(2)}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="animate-pulse">👁️ {promo.impressions}</span>
                        <span className="animate-bounce-subtle">🖱️ {promo.clicks}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6 animate-slide-up">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary animate-spin-slow" />
            Trending This Week
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingImages.map((image, index) => (
              <Card
                key={image.id}
                className="cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-glow animate-slide-in-right group"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleImageClick(image)}
              >
                <div className="relative">
                  <Badge className="absolute top-2 right-2 z-10 animate-bounce-in">
                    🔥 {image.recentLikes}
                  </Badge>
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {image.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    by {image.profiles?.username}
                  </p>
                  <p className="text-primary font-bold mt-2">
                    ${Number(image.price).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Trending;
