import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Clock, Eye, MousePointer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Promotions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [promotionDays, setPromotionDays] = useState(7);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      await fetchData(user.id);
    };

    checkUser();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    try {
      // Fetch user's images
      const { data: userImages } = await supabase
        .from("images")
        .select("*")
        .eq("seller_id", userId)
        .eq("status", "active");

      setImages(userImages || []);

      // Fetch active promotions
      const { data: activePromotions } = await supabase
        .from("promotions")
        .select(`
          *,
          images (
            title,
            image_url
          )
        `)
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      setPromotions(activePromotions || []);
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

  const handlePromote = async () => {
    if (!selectedImage) return;

    const amount = promotionDays * 5; // $5 per day
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + promotionDays);

    try {
      // Here you would integrate with Stripe for payment
      // For now, we'll just create the promotion record
      const { error } = await supabase
        .from("promotions")
        .insert({
          image_id: selectedImage.id,
          seller_id: user.id,
          amount_paid: amount,
          end_date: endDate.toISOString(),
          status: "active",
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Image promoted for ${promotionDays} days!`,
      });

      await fetchData(user.id);
      setSelectedImage(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Promote Your Images
          </h1>
          <p className="text-muted-foreground">
            Boost visibility and reach more buyers with promoted listings
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card className="p-6 animate-scale-up">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary animate-bounce-subtle" />
              Your Images
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <Dialog key={image.id}>
                  <DialogTrigger asChild>
                    <Card 
                      className="cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-glow animate-zoom-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold truncate">{image.title}</h3>
                        <p className="text-primary font-bold">${Number(image.price).toFixed(2)}</p>
                      </div>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="animate-bounce-in">
                    <DialogHeader>
                      <DialogTitle className="animate-slide-down">Promote This Image</DialogTitle>
                      <DialogDescription className="animate-fade-in">
                        Choose how many days you want to promote your image
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="days">Number of Days</Label>
                        <Input
                          id="days"
                          type="number"
                          min="1"
                          max="30"
                          value={promotionDays}
                          onChange={(e) => setPromotionDays(Number(e.target.value))}
                          className="transition-all duration-300 focus:scale-105"
                        />
                      </div>
                      <div className="p-4 bg-muted rounded-lg animate-pulse-slow">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="text-2xl font-bold text-primary animate-glow">
                          ${(promotionDays * 5).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          $5.00 per day
                        </p>
                      </div>
                      <Button 
                        onClick={handlePromote} 
                        className="w-full hover:scale-105 transition-transform"
                      >
                        Promote Now
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </Card>

          <Card className="p-6 animate-slide-up">
            <h2 className="text-2xl font-bold mb-4">Active Promotions</h2>
            {promotions.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <p className="text-muted-foreground">No active promotions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {promotions.map((promo: any, index: number) => (
                  <Card 
                    key={promo.id} 
                    className="p-4 hover:scale-102 transition-all animate-slide-in-right"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={promo.images?.image_url}
                        alt={promo.images?.title}
                        className="w-20 h-20 rounded-md object-cover hover:scale-110 transition-transform"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{promo.images?.title}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 animate-spin-slow" />
                            Ends: {new Date(promo.end_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4 animate-pulse" />
                            {promo.impressions} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="h-4 w-4 animate-bounce-subtle" />
                            {promo.clicks} clicks
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="text-lg font-bold text-primary animate-pulse">
                          ${Number(promo.amount_paid).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Promotions;
