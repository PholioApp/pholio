import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

const PremiumSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#9b87f5', '#7E69AB', '#6E59A5'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#9b87f5', '#7E69AB', '#6E59A5'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/profile");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="max-w-md w-full animate-scale-up border-primary/50 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center animate-bounce">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to Premium!
          </CardTitle>
          <CardDescription className="text-base">
            Your premium subscription is now active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm">4 Exclusive Premium Themes</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-sm">Premium Badge on Profile</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 animate-slide-in-left" style={{ animationDelay: "0.3s" }}>
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm">Priority Support</span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting to your profile in {countdown} seconds...
            </p>
            <Button 
              onClick={() => navigate("/profile")}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Go to Profile Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumSuccess;
