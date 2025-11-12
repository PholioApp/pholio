import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const checkoutInputSchema = z.object({
  imageId: z.string().uuid(),
  price: z.number().positive().max(10000).optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Validate input
    const rawInput = await req.json();
    const input = checkoutInputSchema.parse(rawInput);
    
    // Get image details
    const { data: image, error: imageError } = await supabaseClient
      .from("images")
      .select("*")
      .eq("id", input.imageId)
      .single();

    if (imageError || !image) {
      throw new Error("Image not found");
    }

    // Check if user already purchased this image
    const { data: existingPurchase } = await supabaseClient
      .from("purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("image_id", input.imageId)
      .maybeSingle();

    if (existingPurchase) {
      throw new Error("You have already purchased this image");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session with dynamic price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: image.title,
              description: image.description || "High-quality digital photo",
              images: image.thumbnail_url ? [image.thumbnail_url] : undefined,
            },
            unit_amount: Math.round(Number(image.price) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&image_id=${input.imageId}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        image_id: input.imageId,
        buyer_id: user.id,
        amount: image.price,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    // Return user-friendly error without technical details
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    return new Response(JSON.stringify({ error: "An error occurred while processing your request" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
