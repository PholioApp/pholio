import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search as SearchIcon, User, Image as ImageIcon, ShoppingCart } from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Search images
      const { data: imageData, error: imageError } = await supabase
        .from("images")
        .select(`
          *,
          seller:profiles!images_seller_id_fkey(username, avatar_url)
        `)
        .eq("status", "active")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (imageError) throw imageError;

      // Search sellers
      const { data: sellerData, error: sellerError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${searchQuery}%`)
        .limit(20);

      if (sellerError) throw sellerError;

      setImages(imageData || []);
      setSellers(sellerData || []);
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

  const handleBuy = async (imageId: string, price: number) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("purchases").insert({
        buyer_id: user.id,
        image_id: imageId,
        amount: price,
        status: "completed",
      });

      if (error) throw error;

      toast({
        title: "Purchase successful!",
        description: "The image has been added to your collection.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="secondary" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search images or sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 pr-24"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !searchQuery.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-primary"
            >
              Search
            </Button>
          </div>
        </div>

        {(images.length > 0 || sellers.length > 0) && (
          <Tabs defaultValue="images" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="images">
                <ImageIcon className="mr-2" size={16} />
                Images ({images.length})
              </TabsTrigger>
              <TabsTrigger value="sellers">
                <User className="mr-2" size={16} />
                Sellers ({sellers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="images">
              {images.length === 0 ? (
                <Card className="p-12 text-center bg-gradient-card border-border">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No images found</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((img) => (
                    <Card key={img.id} className="overflow-hidden bg-gradient-card border-border shadow-card hover-scale">
                      <div className="aspect-[3/4] bg-secondary relative">
                        <img
                          src={img.image_url}
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-gradient-primary rounded-lg px-3 py-1 shadow-glow">
                          <span className="text-sm font-bold">${img.price}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{img.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by @{img.seller?.username || "unknown"}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleBuy(img.id, img.price)}
                          className="w-full bg-gradient-primary"
                        >
                          <ShoppingCart className="mr-2" size={16} />
                          Buy ${img.price}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sellers">
              {sellers.length === 0 ? (
                <Card className="p-12 text-center bg-gradient-card border-border">
                  <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No sellers found</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sellers.map((seller) => (
                    <Card key={seller.id} className="p-6 bg-gradient-card border-border shadow-card hover-scale">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold shadow-glow">
                          {seller.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">@{seller.username}</h3>
                          <p className="text-sm text-muted-foreground">{seller.email}</p>
                        </div>
                      </div>
                      {seller.bio && (
                        <p className="text-sm text-muted-foreground mb-4">{seller.bio}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!loading && images.length === 0 && sellers.length === 0 && searchQuery && (
          <Card className="p-12 text-center bg-gradient-card border-border">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try searching with different keywords
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Search;
