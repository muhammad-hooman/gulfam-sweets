// ==============================================================================
// GULFAM SWEETS — SUPABASE EDGE FUNCTION: NOTIFY NEW ORDER
// ==============================================================================
// Can be deployed to Supabase or invoked via Database Webhook on public.orders
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "hoomankhan701@gmail.com";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Gulfam Sweets <onboarding@resend.dev>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    const order = payload.record || payload.order || payload;

    if (!order || (!order.order_number && !order.id)) {
      return new Response(JSON.stringify({ error: "Missing order record" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not configured in Supabase Edge Function Secrets.");
      return new Response(
        JSON.stringify({ success: true, warning: "RESEND_API_KEY missing. Order notification logged." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const orderNumber = order.order_number || order.id;
    const total = Number(order.total) || 0;
    const customerName = order.customer_name || "Customer";
    const phone = order.customer_phone || "—";
    const address = order.delivery_address || order.shipping_address?.address || "—";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `🔔 New Order ${orderNumber} (Rs. ${total}) — ${customerName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #6B0F1A;">New Order Placed: ${orderNumber}</h2>
            <p><strong>Customer:</strong> ${customerName} (${phone})</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Total:</strong> Rs. ${total}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method || "COD"}</p>
            <a href="https://gulfam-sweets.vercel.app/admin" style="display: inline-block; padding: 10px 18px; background: #6B0F1A; color: #fff; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a>
          </div>
        `,
      }),
    });

    const data = await emailResponse.json();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
