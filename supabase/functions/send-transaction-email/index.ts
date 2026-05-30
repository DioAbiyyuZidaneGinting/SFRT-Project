// =========================================================================
// TRANSACTIONAL EMAIL EDGE FUNCTION
// Supabase Deno runtime entry point
// =========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  validateWebhookSignature, 
  getSupabaseServiceClient 
} from "./helpers.ts";
import { 
  getTransactionReceiptTemplate, 
  ReceiptEmailData 
} from "./template.ts";
import nodemailer from "npm:nodemailer";

console.log("[SFRT-Mailer] Server initialized. Listening for transactional triggers...");

serve(async (req: Request) => {
  // 1. Handle CORS Preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Validate Secure Webhook Signature Header
    if (!validateWebhookSignature(req)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Missing or invalid signature." }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse JSON Database Payload
    const body = await req.json();
    const transactionId = body.transaction_id;

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "Missing transaction_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SFRT-Mailer] Processing receipt event for transaction: ${transactionId}`);

    // 4. Initialize Internal Supabase Client & Lookup User Details
    const supabase = getSupabaseServiceClient();

    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (error || !transaction) {
      console.error(error);
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      user_id,
      station_name,
      plate_number,
      fuel_type_name,
      liters,
      price_per_liter,
      total_price,
      payment_method,
      date,
      time
    } = transaction;
    const transaction_id = transactionId;
    
    // Fetch customer profile from public.users
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      console.warn(`[SFRT-Mailer] Failed to resolve public profile for user: ${user_id}. Attempting auth table fallback...`);
    }

    // Fallback email retrieval directly from auth.users (requires service_role)
    let recipientEmail = profile?.email;
    let customerName = profile?.full_name || "VALUED CUSTOMER";

    if (!recipientEmail) {
      const { data: authUser, error: authUserErr } = await supabase.auth.admin.getUserById(user_id);
      if (authUserErr || !authUser.user) {
        throw new Error(`Critical. Could not resolve email address for user ID: ${user_id}`);
      }
      recipientEmail = authUser.user.email;
      customerName = authUser.user.user_metadata?.full_name || authUser.user.email?.split("@")[0].toUpperCase() || "VALUED DRIVER";
    }

    console.log(`[SFRT-Mailer] Recipient resolved: ${recipientEmail} | Name: ${customerName}`);

    // 5. Build Dynamic Premium Receipt Template
    const receiptData: ReceiptEmailData = {
      customerName,
      transactionId: transaction_id,
      stationName: station_name || "SFRT Central Hub",
      plateNumber: plate_number || "SIMULATED-PLATE",
      fuelTypeName: fuel_type_name || "Pertalite",
      liters: parseFloat(liters) || 0,
      pricePerLiter: parseFloat(price_per_liter) || 0,
      totalPrice: parseFloat(total_price) || 0,
      paymentMethod: payment_method || "direct",
      date: date || new Date().toISOString().split("T")[0],
      time: time || new Date().toLocaleTimeString("en-US", { hour12: false }),
    };

    const htmlContent = getTransactionReceiptTemplate(receiptData);

    // 6. Connect to Gmail SMTP
    const smtpEmail = Deno.env.get("SMTP_EMAIL");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpEmail || !smtpPassword) {
      throw new Error("Missing system variables: SMTP_EMAIL or SMTP_PASSWORD");
    }

    console.log(`[SFRT-Mailer] Preparing to send email to real customer...`);
    const shortTxId = transaction_id.substring(0, 8).toUpperCase();
    console.log(`[SFRT-Mailer] TARGET EMAIL => ${recipientEmail}`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    const mailOptions = {
      from: `"SFRT System" <${smtpEmail}>`,
      to: recipientEmail,
      subject: `Bukti Pembayaran SFRT: #${shortTxId}`,
      html: htmlContent,
    };

    console.log("[SFRT-Mailer] Dispatching payload to Gmail SMTP...");
    
    const info = await transporter.sendMail(mailOptions);

    console.log(`[SFRT-Mailer] Email delivered successfully via SMTP. Message ID: ${info.messageId}`);

    // 7. Update Audit logs in database
    await supabase
      .from("email_logs")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("transaction_id", transaction_id);

    return new Response(
      JSON.stringify({ success: true, message: "Receipt email sent successfully.", messageId: info.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error(`[SFRT-Mailer] Critical error in mail pipeline:`, err.message);

    // Try logging failed status to DB if payload had transaction_id
    try {
      const payload = await req.clone().json().catch(() => ({}));
      if (payload.transaction_id) {
        const supabase = getSupabaseServiceClient();
        await supabase
          .from("email_logs")
          .update({ 
            status: "failed", 
            error_message: err.message || "Unknown mailer pipeline error.",
            updated_at: new Date().toISOString()
          })
          .eq("transaction_id", payload.transaction_id);
      }
    } catch (dbErr: any) {
      console.error("[SFRT-Mailer] Failed to write failure audit log to DB:", dbErr.message);
    }

    return new Response(
      JSON.stringify({ error: err.message || "Internal server error in mailer pipeline." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
