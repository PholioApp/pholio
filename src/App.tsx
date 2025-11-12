import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Purchases from "./pages/Purchases";
import Liked from "./pages/Liked";
import Following from "./pages/Following";
import Search from "./pages/Search";
import PaymentSuccess from "./pages/PaymentSuccess";
import Admin from "./pages/Admin";
import SellerDashboard from "./pages/SellerDashboard";
import Challenges from "./pages/Challenges";
import Promotions from "./pages/Promotions";
import Leaderboard from "./pages/Leaderboard";
import Trending from "./pages/Trending";
import Ads from "./pages/Ads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/liked" element={<Liked />} />
          <Route path="/following" element={<Following />} />
          <Route path="/search" element={<Search />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/ads" element={<Ads />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
