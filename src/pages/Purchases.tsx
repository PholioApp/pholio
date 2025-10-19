import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, ArrowLeft, ShoppingBag } from "lucide-react";

const Purchases = () => {
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
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
        fetchPurchases(user.id);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchPurchases = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          image:images(
            *,
            seller:profiles!images_seller_id_fkey(username, avatar_url)
          )
        `)
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
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

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Downloaded!",
        description: "Image has been downloaded to your device.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download image.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            My Purchases
          </h1>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No purchases yet</h2>
            <p className="text-muted-foreground mb-4">
              Start swiping to discover amazing images!
            </p>
            <Button onClick={() => navigate("/")} className="bg-gradient-primary">
              Browse Images
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden bg-gradient-card border-border shadow-card">
                <div className="relative aspect-square bg-secondary">
                  <img
                    src={purchase.image.image_url}
                    alt={purchase.image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{purchase.image.title}</h3>
                    {purchase.image.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {purchase.image.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      By @{purchase.image.seller?.username || "unknown"}
                    </div>
                    <div className="font-bold">${purchase.amount}</div>
                  </div>
                  <Button
                    onClick={() => handleDownload(purchase.image.image_url, purchase.image.title)}
                    className="w-full bg-gradient-primary"
                  >
                    <Download className="mr-2" size={18} />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases;
