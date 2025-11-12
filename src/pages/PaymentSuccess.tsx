import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Download, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [isPromotion, setIsPromotion] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#10b981", "#84cc16"],
    });

    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      const imageId = searchParams.get("image_id");
      const paymentType = searchParams.get("type");

      if (!sessionId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid payment session",
        });
        navigate("/");
        return;
      }

      try {
        // Check if this is a promotion payment
        if (paymentType === "promotion") {
          setIsPromotion(true);
          const { data, error } = await supabase.functions.invoke("verify-promotion-payment", {
            body: { sessionId },
          });

          if (error) throw error;

          if (data?.success) {
            setVerified(true);
            toast({
              title: "Promotion activated! 🚀",
              description: "Your image is now being promoted to more users.",
            });
          }
        } else if (paymentType === "ad") {
          setIsPromotion(true);
          const { data, error } = await supabase.functions.invoke("verify-ad-payment", {
            body: { sessionId },
          });

          if (error) throw error;

          if (data?.success) {
            setVerified(true);
            toast({
              title: "Ad activated! 📢",
              description: "Your ad is now live and reaching users.",
            });
          }
        } else {
          // Regular image purchase
          if (!imageId) {
            throw new Error("Image ID required for purchase");
          }

          const { data, error } = await supabase.functions.invoke("verify-payment", {
            body: { sessionId },
          });

          if (error) throw error;

          if (data?.success) {
            setVerified(true);
            toast({
              title: "Payment successful!",
              description: "Your purchase has been confirmed.",
            });
          }
        }
      } catch (error: any) {
        console.error("Payment verification error:", error);
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: error.message || "Could not verify payment",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
        <Card className="p-8 text-center max-w-md w-full animate-pulse-slow">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
          <p className="text-muted-foreground">Please wait while we confirm your purchase...</p>
        </Card>
      </div>
    );
  }

  if (isPromotion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
        <Card className="p-8 text-center max-w-md w-full animate-bounce-in">
          {verified ? (
            <>
              <div className="animate-scale-up">
                <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold mb-2 animate-slide-down">Promotion Active!</h2>
              <p className="text-muted-foreground mb-6 animate-fade-in">
                Your image is now being promoted and will reach more potential buyers.
              </p>
              <div className="flex flex-col gap-3 animate-slide-up">
                <Button
                  onClick={() => navigate("/promotions")}
                  className="w-full bg-gradient-primary hover:scale-105 transition-transform"
                >
                  <TrendingUp className="mr-2" size={18} />
                  View Promotions
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/")}
                  className="w-full hover:scale-105 transition-transform"
                >
                  Continue Browsing
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">Payment Verification Failed</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't verify your payment. Please contact support if you were charged.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Return Home
              </Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <Card className="p-8 text-center max-w-md w-full animate-bounce-in">
        {verified ? (
          <>
            <div className="animate-scale-up">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2 animate-slide-down">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6 animate-fade-in">
              Your purchase has been confirmed. You can now download your image.
            </p>
            <div className="flex flex-col gap-3 animate-slide-up">
              <Button
                onClick={() => navigate("/purchases")}
                className="w-full bg-gradient-primary hover:scale-105 transition-transform"
              >
                <Download className="mr-2" size={18} />
                View Purchases
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/")}
                className="w-full hover:scale-105 transition-transform"
              >
                Continue Browsing
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2">Payment Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Return Home
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
