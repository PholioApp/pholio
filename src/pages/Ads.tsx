import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone, Clock, Eye, MousePointer, TrendingUp, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";

const Ads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    siteUrl: "",
    title: "",
    description: "",
    imageUrl: "",
    days: 7,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      await fetchAds(user.id);
    };

    checkUser();
  }, [navigate]);

  const fetchAds = async (userId: string) => {
    try {
      const { data: userAds } = await supabase
        .from("ads")
        .select("*")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false });

      setAds(userAds || []);
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

  const handleCreateAd = async () => {
    if (!formData.siteUrl || !formData.title) {
      toast({
        title: "Missing fields",
        description: "Please fill in site URL and title",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-ad-checkout", {
        body: formData,
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to checkout 💳",
          description: "Complete your payment in the new tab.",
        });
        setDialogOpen(false);
        setFormData({
          siteUrl: "",
          title: "",
          description: "",
          imageUrl: "",
          days: 7,
        });
      } else if (data?.success) {
        // Free ad created
        toast({
          title: "Ad created! 🎉",
          description: "Your ad is now active.",
        });
        setDialogOpen(false);
        setFormData({
          siteUrl: "",
          title: "",
          description: "",
          imageUrl: "",
          days: 7,
        });
        await fetchAds(user.id);
      }
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

        <div className="mb-8 animate-slide-down flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Advertise Your Site
            </h1>
            <p className="text-muted-foreground">
              Reach thousands of photographers and art lovers
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hover:scale-105 transition-transform">
                <Megaphone className="mr-2 h-4 w-4" />
                Create Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="animate-bounce-in">
              <DialogHeader>
                <DialogTitle className="animate-slide-down">Create New Ad</DialogTitle>
                <DialogDescription className="animate-fade-in">
                  Promote your website to our community
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Website URL *</Label>
                  <Input
                    id="siteUrl"
                    type="url"
                    placeholder="https://yoursite.com"
                    value={formData.siteUrl}
                    onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                    className="transition-all duration-300 focus:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Ad Title *</Label>
                  <Input
                    id="title"
                    placeholder="Amazing Photography Gear"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="transition-all duration-300 focus:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell users about your site..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="transition-all duration-300 focus:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Banner Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://yoursite.com/banner.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="transition-all duration-300 focus:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days</Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                    className="transition-all duration-300 focus:scale-105"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg animate-pulse-slow">
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="text-2xl font-bold text-primary animate-glow">
                    ${(formData.days * 0.10).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    $0.10 per day
                  </p>
                </div>
                <Button 
                  onClick={handleCreateAd} 
                  className="w-full hover:scale-105 transition-transform"
                >
                  Continue to Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Analytics Overview */}
        {ads.length > 0 && (
          <Card className="p-6 mb-6 animate-slide-up">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary animate-bounce-subtle" />
              Analytics Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 hover:scale-105 transition-transform">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Impressions</p>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {ads.reduce((sum: number, ad: any) => sum + ad.impressions, 0).toLocaleString()}
                </p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 hover:scale-105 transition-transform">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="h-5 w-5 text-accent" />
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
                <p className="text-3xl font-bold text-accent">
                  {ads.reduce((sum: number, ad: any) => sum + ad.clicks, 0).toLocaleString()}
                </p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:scale-105 transition-transform">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <p className="text-sm text-muted-foreground">Avg CTR</p>
                </div>
                <p className="text-3xl font-bold text-green-500">
                  {(() => {
                    const totalImpressions = ads.reduce((sum: number, ad: any) => sum + ad.impressions, 0);
                    const totalClicks = ads.reduce((sum: number, ad: any) => sum + ad.clicks, 0);
                    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
                    return `${ctr.toFixed(2)}%`;
                  })()}
                </p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:scale-105 transition-transform">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-5 w-5 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <p className="text-3xl font-bold text-purple-500">
                  ${ads.reduce((sum: number, ad: any) => sum + Number(ad.amount_paid), 0).toFixed(2)}
                </p>
              </Card>
            </div>
          </Card>
        )}

        <Card className="p-6 animate-slide-up">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary animate-bounce-subtle" />
            Your Ads
          </h2>
          {ads.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">No ads yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad: any, index: number) => {
                const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
                return (
                  <Card 
                    key={ad.id} 
                    className="p-4 hover:scale-102 transition-all animate-slide-in-right"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4">
                      {ad.image_url && (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-32 h-20 rounded-md object-cover hover:scale-110 transition-transform"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{ad.title}</h3>
                        <a 
                          href={ad.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {ad.site_url}
                        </a>
                        {ad.description && (
                          <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 animate-spin-slow" />
                            {ad.status === 'active' ? 'Ends' : 'Ended'}: {new Date(ad.end_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4 animate-pulse" />
                            {ad.impressions} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="h-4 w-4 animate-bounce-subtle" />
                            {ad.clicks} clicks
                          </span>
                        </div>
                        {/* CTR Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-muted-foreground">Click-Through Rate (CTR)</p>
                            <p className="text-xs font-semibold text-primary">{ctr.toFixed(2)}%</p>
                          </div>
                          <Progress value={Math.min(ctr * 10, 100)} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="text-lg font-bold text-primary animate-pulse">
                          ${Number(ad.amount_paid).toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          ad.status === 'active' ? 'bg-accent text-white' : 'bg-muted'
                        }`}>
                          {ad.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Ads;
