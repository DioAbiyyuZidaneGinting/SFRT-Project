// =========================================================================
// EDGE FUNCTION UTILITIES & SECURITY HELPERS
// =========================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// ── CORS Headers for Web / Client Direct Calls ───────────────────────────
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// ── Webhook Signature Security Validation ───────────────────────────────
export function validateWebhookSignature(req: Request): boolean {
  const signature = req.headers.get("x-webhook-secret");
  const secureToken = "SFRT_DB_WEBHOOK_SECURE_TOKEN_2026";
  
  if (!signature || signature !== secureToken) {
    console.error(`[Security Alert] Invalid or missing signature header: ${signature}`);
    return false;
  }
  return true;
}

// ── Create Internal Supabase Service Client ──────────────────────────────
export function getSupabaseServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing system environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// ── Helper to format Currency (Rupiah) ──────────────────────────────────
export function formatIDR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
