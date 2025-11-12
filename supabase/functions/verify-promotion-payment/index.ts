import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const verifyInputSchema = z.object({
  sessionId: z.string().min(1).max(500)
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role to bypass RLS for promotion creation after payment verification
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("Starting promotion payment verification");
    
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Validate input
    const rawInput = await req.json();
    const input = verifyInputSchema.parse(rawInput);

    console.log("Verifying session:", input.sessionId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(input.sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    if (!session.metadata || session.metadata.type !== "promotion") {
      throw new Error("Invalid promotion session");
    }

    console.log("Payment verified, creating promotion record");

    const imageId = session.metadata.image_id;
    const sellerId = session.metadata.seller_id;
    const days = parseInt(session.metadata.days);
    const amount = parseFloat(session.metadata.amount);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Create promotion record
    const { data: promotion, error: promotionError } = await supabaseClient
      .from("promotions")
      .insert({
        image_id: imageId,
        seller_id: sellerId,
        amount_paid: amount,
        end_date: endDate.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (promotionError) {
      console.error("Error creating promotion:", promotionError);
      throw promotionError;
    }

    console.log("Promotion created successfully:", promotion.id);

    return new Response(JSON.stringify({ success: true, promotion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error verifying promotion payment:", error);
    
    // Return user-friendly error without technical details
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    return new Response(JSON.stringify({ error: "Payment verification failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
