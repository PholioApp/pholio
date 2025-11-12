import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdBanner = () => {
  const [ad, setAd] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        // Get a random active ad
        const { data: ads } = await supabase
          .from("ads")
          .select("*")
          .eq("status", "active")
          .gt("end_date", new Date().toISOString())
          .limit(5);

        if (ads && ads.length > 0) {
          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          setAd(randomAd);

          // Track impression
          await supabase
            .from("ads")
            .update({ impressions: randomAd.impressions + 1 })
            .eq("id", randomAd.id);
        }
      } catch (error) {
        console.error("Error fetching ad:", error);
      }
    };

    fetchAd();
  }, []);

  const handleClick = async () => {
    if (ad) {
      // Track click
      await supabase
        .from("ads")
        .update({ clicks: ad.clicks + 1 })
        .eq("id", ad.id);

      // Open link
      window.open(ad.site_url, "_blank", "noopener,noreferrer");
    }
  };

  if (!ad || dismissed) return null;

  return (
    <Card className="p-4 bg-gradient-card border-primary/20 relative animate-fade-in hover:shadow-glow transition-all duration-300">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-muted-foreground">Sponsored</span>
      </div>

      <div 
        onClick={handleClick}
        className="cursor-pointer group"
      >
        {ad.image_url && (
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-32 object-cover rounded-md mb-3 group-hover:scale-105 transition-transform"
          />
        )}
        
        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
          {ad.title}
          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        
        {ad.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {ad.description}
          </p>
        )}
        
        <p className="text-xs text-primary font-medium">
          Visit {new URL(ad.site_url).hostname}
        </p>
      </div>
    </Card>
  );
};
