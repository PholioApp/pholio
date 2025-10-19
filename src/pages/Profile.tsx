import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, Image as ImageIcon, ShoppingBag } from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myImages, setMyImages] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // Fetch user's images
      const { data: imagesData } = await supabase
        .from("images")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      setMyImages(imagesData || []);

      // Fetch purchases
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("*, images(*)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      setPurchases(purchasesData || []);
    };

    fetchProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you next time!",
    });
    navigate("/auth");
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="secondary" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2" size={18} />
            Back
          </Button>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2" size={18} />
            Sign Out
          </Button>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card border-border mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold shadow-glow">
              {profile.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">@{profile.username}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={20} />
              <h2 className="text-xl font-bold">My Listings ({myImages.length})</h2>
            </div>
            {myImages.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border">
                <p className="text-muted-foreground mb-4">
                  You haven't uploaded any images yet
                </p>
                <Button onClick={() => navigate("/upload")} className="bg-gradient-primary">
                  Upload Your First Image
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myImages.map((img) => (
                  <Card key={img.id} className="overflow-hidden bg-gradient-card border-border">
                    <div className="aspect-square bg-secondary">
                      <img
                        src={img.image_url}
                        alt={img.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium truncate">{img.title}</h3>
                      <p className="text-sm text-muted-foreground">${img.price}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={20} />
              <h2 className="text-xl font-bold">My Purchases ({purchases.length})</h2>
            </div>
            {purchases.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border">
                <p className="text-muted-foreground">No purchases yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {purchases.map((purchase) => (
                  <Card key={purchase.id} className="overflow-hidden bg-gradient-card border-border">
                    <div className="aspect-square bg-secondary">
                      <img
                        src={purchase.images.image_url}
                        alt={purchase.images.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium truncate">{purchase.images.title}</h3>
                      <p className="text-sm text-muted-foreground">${purchase.amount}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
