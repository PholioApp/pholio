import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, Image, TrendingUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    soldPhotos: 0,
    activeListings: 0,
    totalLikes: 0,
    pendingEarnings: 0,
  });
  const [soldPhotos, setSoldPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      await fetchDashboardData(user.id);
    };

    checkUser();
  }, [navigate]);

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch earnings
      const { data: earnings } = await supabase
        .from("seller_earnings")
        .select("amount, status")
        .eq("seller_id", userId);

      const totalEarnings = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const pendingEarnings = earnings?.filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Fetch purchases (sold photos)
      const { data: purchases } = await supabase
        .from("purchases")
        .select(`
          *,
          images (
            id,
            title,
            image_url,
            price,
            seller_id
          )
        `)
        .eq("images.seller_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch active listings
      const { data: images } = await supabase
        .from("images")
        .select("id")
        .eq("seller_id", userId)
        .eq("status", "active");

      // Fetch total likes
      const { data: likes } = await supabase
        .from("likes")
        .select("id, image_id")
        .in("image_id", images?.map(img => img.id) || []);

      setStats({
        totalEarnings,
        soldPhotos: purchases?.length || 0,
        activeListings: images?.length || 0,
        totalLikes: likes?.length || 0,
        pendingEarnings,
      });

      setSoldPhotos(purchases || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
          onClick={() => navigate("/profile")}
          className="mb-6 hover-scale transition-transform"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent animate-slide-down">
          Seller Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-6 hover-scale transition-all duration-300 hover-glow animate-scale-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-primary animate-pulse-slow">
                  ${stats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary animate-bounce-subtle" />
            </div>
          </Card>

          <Card className="p-6 hover-scale transition-all duration-300 hover-glow animate-scale-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">
                  ${stats.pendingEarnings.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500 animate-hover-float" />
            </div>
          </Card>

          <Card className="p-6 hover-scale transition-all duration-300 hover-glow animate-scale-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Photos Sold</p>
                <p className="text-2xl font-bold">{stats.soldPhotos}</p>
              </div>
              <Image className="h-8 w-8 text-primary hover-rotate" />
            </div>
          </Card>

          <Card className="p-6 hover-scale transition-all duration-300 hover-glow animate-scale-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold">{stats.activeListings}</p>
              </div>
              <Eye className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </Card>

          <Card className="p-6 hover-scale transition-all duration-300 hover-glow animate-scale-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
              </div>
              <span className="text-2xl animate-bounce-in">❤️</span>
            </div>
          </Card>
        </div>

        <Card className="p-6 animate-slide-up">
          <h2 className="text-2xl font-bold mb-6">Recent Sales</h2>
          {soldPhotos.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground mb-4">No sales yet</p>
              <Button onClick={() => navigate("/upload")} className="animate-bounce-subtle hover-scale">
                Upload Your First Photo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {soldPhotos.map((purchase: any, index: number) => (
                <div
                  key={purchase.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-lg hover:bg-accent transition-all duration-300 hover-scale-102 animate-slide-in-left"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={purchase.images?.image_url}
                    alt={purchase.images?.title}
                    className="w-16 h-16 rounded-md object-cover hover-lift transition-transform"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{purchase.images?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Sold on {new Date(purchase.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary animate-pulse">
                    ${Number(purchase.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
