import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const adInputSchema = z.object({
  siteUrl: z.string().url().min(1).max(2048)
    .refine(url => url.startsWith('http://') || url.startsWith('https://'), 
      'Only HTTP/HTTPS URLs allowed'),
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).trim().optional(),
  imageUrl: z.string().url().max(2048).optional()
    .refine(url => !url || url.startsWith('http://') || url.startsWith('https://'), 
      'Only HTTP/HTTPS URLs allowed'),
  days: z.number().int().min(1).max(365)
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting ad checkout process");
    
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Create client with user's auth token for RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    console.log("User authenticated:", user.id);

    // Validate input with zod
    const rawInput = await req.json();
    const input = adInputSchema.parse(rawInput);

    console.log("Ad request:", { siteUrl: input.siteUrl, title: input.title, days: input.days });

    // Free for nipsubroder@gmail.com, $0.10 per day for others
    const isFreeUser = user.email === "nipsubroder@gmail.com";
    const amount = isFreeUser ? 0 : input.days * 0.10;
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    console.log("Creating Stripe checkout session");

    // Skip payment if free
    if (isFreeUser) {
      // Use service role to create ad directly for free user (bypasses RLS)
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const { data: adData, error: adError } = await serviceClient
        .from('ads')
        .insert({
          advertiser_id: user.id,
          site_url: input.siteUrl,
          title: input.title,
          description: input.description || "",
          image_url: input.imageUrl || "",
          amount_paid: 0,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + input.days * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (adError) throw adError;

      return new Response(JSON.stringify({ success: true, ad: adData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create checkout session for ad
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Advertise "${input.title}" for ${input.days} day${input.days > 1 ? 's' : ''}`,
              description: `Promote your site: ${input.siteUrl}`,
              images: input.imageUrl ? [input.imageUrl] : undefined,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=ad`,
      cancel_url: `${req.headers.get("origin")}/ads`,
      metadata: {
        type: "ad",
        advertiser_id: user.id,
        site_url: input.siteUrl,
        title: input.title,
        description: input.description || "",
        image_url: input.imageUrl || "",
        days: input.days.toString(),
        amount: amount.toString(),
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating ad checkout:", error);
    
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
