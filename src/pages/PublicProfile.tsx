import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user's images
      const { data: imagesData, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("seller_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (imagesError) throw imagesError;
      setImages(imagesData || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="mr-2" size={18} />
          Back
        </Button>

        <Card className="p-6 bg-gradient-card shadow-card border-border mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback className="bg-gradient-primary text-2xl font-bold shadow-glow">
                {profile.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">@{profile.username}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          {profile.bio && (
            <p className="text-muted-foreground">{profile.bio}</p>
          )}
        </Card>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={20} />
            <h2 className="text-xl font-bold">Listings ({images.length})</h2>
          </div>
          {images.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-card border-border">
              <p className="text-muted-foreground">No listings available</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => (
                <Card key={img.id} className="overflow-hidden bg-gradient-card border-border hover-scale">
                  <div className="aspect-square bg-secondary relative">
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-gradient-primary rounded-lg px-3 py-1 shadow-glow">
                      <span className="text-sm font-bold">${img.price}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium truncate">{img.title}</h3>
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

export default PublicProfile;
