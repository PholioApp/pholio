import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search as SearchIcon, User, Image as ImageIcon, ShoppingCart, Filter, X } from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        loadAvailableTags();
      }
    };
    checkAuth();
  }, [navigate]);

  const loadAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from("images")
        .select("tags")
        .eq("status", "active");

      if (error) throw error;

      const allTags = new Set<string>();
      data?.forEach(img => {
        img.tags?.forEach((tag: string) => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags));
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("images")
        .select(`
          *,
          seller:profiles!images_seller_id_fkey(username, avatar_url)
        `)
        .eq("status", "active");

      // Apply text search
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply tag filter
      if (selectedTag && selectedTag !== "all") {
        query = query.contains("tags", [selectedTag]);
      }

      // Apply price range filter
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        query = query.gte("price", min);
        if (max) {
          query = query.lte("price", max);
        }
      }

      const { data: imageData, error: imageError } = await query
        .order("created_at", { ascending: false })
        .limit(50);

      if (imageError) throw imageError;

      // Search sellers only if there's a text query
      let sellerData = [];
      if (searchQuery.trim()) {
        const { data, error: sellerError } = await supabase
          .from("profiles")
          .select("*")
          .ilike("username", `%${searchQuery}%`)
          .limit(20);

        if (sellerError) throw sellerError;
        sellerData = data || [];
      }

      setImages(imageData || []);
      setSellers(sellerData);
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

  const handleBuy = async (imageId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { imageId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to checkout",
          description: "Complete your purchase in the new tab.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPriceRange("all");
    setSelectedTag("all");
    setImages([]);
    setSellers([]);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="secondary" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Search
          </h1>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>

          <Card className="p-4 bg-gradient-card border-border">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Price Range</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-10">$0 - $10</SelectItem>
                    <SelectItem value="10-25">$10 - $25</SelectItem>
                    <SelectItem value="25-50">$25 - $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="100-999999">$100+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Tag</label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="flex-1 bg-gradient-primary"
            >
              <SearchIcon className="mr-2" size={16} />
              {loading ? "Searching..." : "Search"}
            </Button>
            {(searchQuery || priceRange !== "all" || selectedTag !== "all") && (
              <Button variant="secondary" onClick={clearFilters}>
                <X size={16} className="mr-2" />
                Clear
              </Button>
            )}
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
                        {img.tags && img.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {img.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Button
                          onClick={() => handleBuy(img.id)}
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
