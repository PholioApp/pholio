import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, Image as ImageIcon, TrendingUp, Eye } from "lucide-react";

const SellerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    soldPhotos: 0,
    totalViews: 0,
    totalLikes: 0,
    activeListings: 0,
  });
  const [soldPhotos, setSoldPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSellerData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);
      setLoading(true);

      try {
        // Fetch total earnings and sold photos
        const { data: purchases, error: purchasesError } = await supabase
          .from("purchases")
          .select("*, images(*)")
          .eq("images.seller_id", user.id)
          .eq("status", "completed");

        if (purchasesError) throw purchasesError;

        const totalEarnings = purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const soldPhotos = purchases?.length || 0;

        // Fetch active listings
        const { data: images, error: imagesError } = await supabase
          .from("images")
          .select("*")
          .eq("seller_id", user.id)
          .eq("status", "active");

        if (imagesError) throw imagesError;

        // Fetch total likes on seller's images
        const { data: likes, error: likesError } = await supabase
          .from("likes")
          .select("image_id")
          .in("image_id", images?.map(img => img.id) || []);

        if (likesError) throw likesError;

        setStats({
          totalEarnings,
          soldPhotos,
          totalViews: 0, // Can be implemented with a views tracking system
          totalLikes: likes?.length || 0,
          activeListings: images?.length || 0,
        });

        setSoldPhotos(purchases || []);
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

    fetchSellerData();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="secondary" onClick={() => navigate("/profile")}>
              <ArrowLeft className="mr-2" size={18} />
              Back to Profile
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Seller Dashboard
          </h1>
          <div className="w-24" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-primary" size={24} />
            </div>
            <p className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between mb-2">
              <ImageIcon className="text-primary" size={24} />
            </div>
            <p className="text-3xl font-bold">{stats.soldPhotos}</p>
            <p className="text-sm text-muted-foreground">Photos Sold</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between mb-2">
              <Eye className="text-primary" size={24} />
            </div>
            <p className="text-3xl font-bold">{stats.activeListings}</p>
            <p className="text-sm text-muted-foreground">Active Listings</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-primary" size={24} />
            </div>
            <p className="text-3xl font-bold">{stats.totalLikes}</p>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-primary" size={24} />
            </div>
            <p className="text-3xl font-bold">
              ${stats.soldPhotos > 0 ? (stats.totalEarnings / stats.soldPhotos).toFixed(2) : "0.00"}
            </p>
            <p className="text-sm text-muted-foreground">Avg. Sale Price</p>
          </Card>
        </div>

        {/* Sold Photos */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Sales</h2>
          {soldPhotos.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-card border-border">
              <p className="text-muted-foreground mb-4">No sales yet</p>
              <Button onClick={() => navigate("/upload")} className="bg-gradient-primary">
                Upload Photos to Sell
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {soldPhotos.map((purchase) => (
                <Card key={purchase.id} className="overflow-hidden bg-gradient-card border-border">
                  <div className="aspect-square bg-secondary">
                    <img
                      src={purchase.images.image_url}
                      alt={purchase.images.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate mb-1">{purchase.images.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">${purchase.amount}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
