import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Download } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      const imageId = searchParams.get("image_id");

      if (!sessionId || !imageId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid payment session",
        });
        navigate("/");
        return;
      }

      try {
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
          <p className="text-muted-foreground">Please wait while we confirm your purchase...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md w-full">
        {verified ? (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your purchase has been confirmed. You can now download your image.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/purchases")}
                className="w-full bg-gradient-primary"
              >
                <Download className="mr-2" size={18} />
                View Purchases
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/")}
                className="w-full"
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
