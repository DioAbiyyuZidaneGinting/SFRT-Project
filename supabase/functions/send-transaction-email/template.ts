import { formatIDR } from "./helpers.ts";

export interface ReceiptEmailData {
  customerName: string;
  transactionId: string;
  stationName: string;
  plateNumber: string;
  fuelTypeName: string;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  paymentMethod: string;
  date: string;
  time: string;
}

export function getTransactionReceiptTemplate(data: ReceiptEmailData): string {
  const formattedTotal = formatIDR(data.totalPrice);
  const formattedPrice = formatIDR(data.pricePerLiter);
  const shortTxId = data.transactionId.substring(0, 8).toUpperCase();
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SFRT Receipt #${shortTxId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F5F5F5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; border-collapse: separate;">
          
          <!-- Clean White Header -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 48px 40px 24px 40px; text-align: center;">
              
              <!-- LOGO -->
              <img src="https://gjsrlewvykcoltanklxg.supabase.co/storage/v1/object/public/assets/LOGO1.png" alt="SFRT" style="display: block; margin: 0 auto 24px auto; height: 32px;" />
              
              <h1 style="color: #111111; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: 1px; text-transform: uppercase;">
                <span style="color: #00FF88; margin-right: 8px;">S F R T</span> PAID SUCCESS
              </h1>
              
              <p style="color: #4B5563; font-size: 15px; margin: 0 0 6px 0;">Thank you for your transaction</p>
              <p style="color: #6B7280; font-size: 13px; margin: 0;">Smart Refueling transaction #${shortTxId} is complete.</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              
              <p style="color: #111111; font-size: 15px; margin: 0 0 24px 0; line-height: 1.6;">
                Hi <strong>${data.customerName}</strong>,<br>
                Your vehicle refueling at <strong>${data.stationName}</strong> has been processed.
              </p>

              <!-- Transaction Details List (Clean look) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                    <p style="margin: 0; font-size: 13px; color: #6B7280;">Vehicle Plate</p>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #111111; font-weight: 600;">${data.plateNumber}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                    <p style="margin: 0; font-size: 13px; color: #6B7280;">Fuel Type</p>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #111111; font-weight: 600;">${data.fuelTypeName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                    <p style="margin: 0; font-size: 13px; color: #6B7280;">Volume</p>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #111111; font-weight: 600;">${data.liters} L</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                    <p style="margin: 0; font-size: 13px; color: #6B7280;">Price / Liter</p>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #111111; font-weight: 600;">${formattedPrice}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                    <p style="margin: 0; font-size: 13px; color: #6B7280;">Payment Method</p>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #111111; font-weight: 600; text-transform: uppercase;">${data.paymentMethod}</p>
                  </td>
                </tr>
              </table>

              <!-- Total Payment Badge (Soft Green) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-radius: 8px; padding: 16px; border: 1px solid #D1FAE5;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #065F46; font-weight: 600;">Total Payment</p>
                  </td>
                  <td style="text-align: right;">
                    <p style="margin: 0; font-size: 20px; color: #047857; font-weight: 800;">${formattedTotal}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; color: #4B5563; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                Powered by Smart Fuel Refueling Technology
              </p>
              <p style="margin: 0 0 4px 0; color: #9CA3AF; font-size: 11px;">
                Transaction ID: ${data.transactionId}
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 11px;">
                Timestamp: ${data.date} • ${data.time}
              </p>
            </td>
          </tr>
          
        </table>
        
        <p style="margin: 24px 0 0 0; color: #9CA3AF; font-size: 10px; text-align: center;">
          © SFRT Intelligent Fuel Ecosystem
        </p>
        
      </td>
    </tr>
  </table>

</body>
</html>`;
}
