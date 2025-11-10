import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, TrendingUp, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [topLiked, setTopLiked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch top sellers by earnings
      const { data: earnings } = await supabase
        .from("seller_earnings")
        .select(`
          seller_id,
          amount
        `);

      const sellerTotals = earnings?.reduce((acc: any, curr) => {
        if (!acc[curr.seller_id]) {
          acc[curr.seller_id] = 0;
        }
        acc[curr.seller_id] += Number(curr.amount);
        return acc;
      }, {});

      const topSellerIds = Object.entries(sellerTotals || {})
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      if (topSellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", topSellerIds);

        const sellersWithEarnings = profiles?.map((profile) => ({
          ...profile,
          earnings: sellerTotals[profile.id],
        })).sort((a, b) => b.earnings - a.earnings);

        setTopSellers(sellersWithEarnings || []);
      }

      // Fetch most liked images
      const { data: images } = await supabase
        .from("images")
        .select(`
          id,
          title,
          image_url,
          seller_id,
          profiles!images_seller_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq("status", "active")
        .limit(50);

      if (images) {
        const imagesWithLikes = await Promise.all(
          images.map(async (img) => {
            const { count } = await supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("image_id", img.id);

            return { ...img, likes: count || 0 };
          })
        );

        const sortedImages = imagesWithLikes
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 10);

        setTopLiked(sortedImages);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
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
            <Trophy className="h-10 w-10 text-yellow-500 animate-bounce-in" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top performers and most loved content
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 animate-scale-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary animate-float" />
              Top Sellers
            </h2>
            <div className="space-y-4">
              {topSellers.map((seller, index) => (
                <div
                  key={seller.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-accent transition-all duration-300 hover:scale-102 animate-slide-in-left cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/profile/${seller.id}`)}
                >
                  <div className="relative">
                    {index < 3 && (
                      <Badge
                        className={`absolute -top-2 -left-2 animate-bounce-in ${
                          index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-600"
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                    )}
                    {index >= 3 && (
                      <span className="absolute -top-2 -left-2 text-xs font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                    <Avatar className="h-12 w-12 hover:scale-110 transition-transform">
                      <AvatarImage src={seller.avatar_url} />
                      <AvatarFallback>{seller.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{seller.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      Total Earnings: ${seller.earnings.toFixed(2)}
                    </p>
                  </div>
                  {index < 3 && (
                    <Trophy className={`h-6 w-6 animate-wiggle ${
                      index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 animate-scale-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-primary animate-pulse" />
              Most Liked Images
            </h2>
            <div className="space-y-4">
              {topLiked.map((image, index) => (
                <div
                  key={image.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-accent transition-all duration-300 hover:scale-102 animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative">
                    {index < 3 && (
                      <Badge
                        className={`absolute -top-2 -left-2 z-10 animate-bounce-in ${
                          index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-600"
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                    )}
                    {index >= 3 && (
                      <span className="absolute -top-2 -left-2 z-10 text-xs font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-16 h-16 rounded-md object-cover hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold truncate">{image.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {image.profiles?.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary animate-pulse">
                      ❤️ {image.likes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
