// ==============================================================================
// GULFAM SWEETS — AUTOMATIC NEW ORDER EMAIL NOTIFICATION API
// ==============================================================================
// Serverless function deployed on Vercel
// Receives new order event and automatically sends a branded HTML notification
// to the store administrator (hoomankhan701@gmail.com) via Resend API.
// ==============================================================================

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'hoomankhan701@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Gulfam Sweets <onboarding@resend.dev>';

function formatMoney(amount) {
  const num = Number(amount) || 0;
  return 'Rs. ' + Math.round(num).toLocaleString('en-PK');
}

function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  } else if (!cleaned.startsWith('92') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

function generateOrderEmailHtml({
  orderNumber,
  customerName,
  customerPhone,
  customerEmail,
  deliveryAddress,
  city,
  customerNote,
  paymentMethod,
  paymentStatus,
  orderStatus,
  items,
  subtotal,
  deliveryFee,
  discountAmount,
  total,
  createdAt,
  storeUrl,
}) {
  const formattedDate = new Date(createdAt || Date.now()).toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const waPhone = formatPhoneForWhatsApp(customerPhone);
  const waLink = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Assalam-o-Alaikum ${customerName}, thank you for your order with Gulfam Sweets & Dairy (Order ID: ${orderNumber}). We are processing your delivery.`)}`
    : null;

  const adminDashboardLink = `${storeUrl || 'https://gulfam-sweets.vercel.app'}/admin`;

  const itemsRowsHtml = (items || []).map((item, idx) => {
    const itemName = item.name || item.product_name || 'Gulfam Item';
    const variantLabel = item.unitLabel || item.variant_label || 'Standard';
    const quantity = Number(item.q || item.quantity) || 1;
    const unitPrice = Number(item.unitPrice || item.unit_price) || 0;
    const itemTotal = Number(item.totalPrice || item.total_price) || (unitPrice * quantity);

    return `
      <tr style="border-bottom: 1px solid #F0E8DF; background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#FCFAF7'};">
        <td style="padding: 12px 14px; font-size: 13px; color: #2D231E; font-weight: 600;">
          ${itemName}
          <div style="font-size: 11px; font-weight: normal; color: #8A7A70; margin-top: 2px;">
            Size / Variant: <span style="color: #6B0F1A; font-weight: 600;">${variantLabel}</span>
          </div>
        </td>
        <td style="padding: 12px 14px; font-size: 13px; color: #2D231E; text-align: center;">
          ${quantity}
        </td>
        <td style="padding: 12px 14px; font-size: 13px; color: #5C4E44; text-align: right;">
          ${formatMoney(unitPrice)}
        </td>
        <td style="padding: 12px 14px; font-size: 13px; color: #6B0F1A; font-weight: 700; text-align: right;">
          ${formatMoney(itemTotal)}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order ${orderNumber} - Gulfam Sweets</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D231E; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F4EF; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(107, 15, 26, 0.08); border: 1px solid #EADFD5;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6B0F1A 0%, #45090F 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #D4A62A;">
              <div style="color: #D4A62A; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">
                TRADITION &bull; PURITY &bull; CRAFTSMANSHIP
              </div>
              <h1 style="color: #FFFFFF; font-size: 26px; margin: 0 0 6px; font-family: Georgia, serif; letter-spacing: 0.5px;">
                Gulfam Sweets &amp; Dairy
              </h1>
              <p style="color: #F4EBD9; font-size: 13px; margin: 0; opacity: 0.9;">
                Karachi, Pakistan &bull; Fresh Artisanal Sweets &amp; Bakery
              </p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background-color: #FFF8EA; border-bottom: 1px solid #F3E4C8; padding: 14px 24px; text-align: center;">
              <span style="display: inline-block; background-color: #D4A62A; color: #45090F; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-right: 6px;">
                NEW ORDER RECEIVED
              </span>
              <span style="font-size: 15px; font-weight: 700; color: #6B0F1A;">
                Order ID: ${orderNumber}
              </span>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 24px;">
              
              <!-- Quick Stats Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="width: 50%; padding-right: 6px;">
                    <div style="background-color: #FDFBF7; border: 1px solid #F0E8DF; border-radius: 10px; padding: 12px 14px;">
                      <div style="font-size: 10px; text-transform: uppercase; color: #8A7A70; font-weight: 700; letter-spacing: 0.5px;">Grand Total</div>
                      <div style="font-size: 20px; font-weight: 800; color: #6B0F1A; margin-top: 2px;">
                        ${formatMoney(total)}
                      </div>
                    </div>
                  </td>
                  <td style="width: 50%; padding-left: 6px;">
                    <div style="background-color: #FDFBF7; border: 1px solid #F0E8DF; border-radius: 10px; padding: 12px 14px;">
                      <div style="font-size: 10px; text-transform: uppercase; color: #8A7A70; font-weight: 700; letter-spacing: 0.5px;">Payment Method</div>
                      <div style="font-size: 14px; font-weight: 700; color: #2D231E; margin-top: 4px;">
                        ${paymentMethod || 'Cash on Delivery'}
                        <span style="font-size: 11px; font-weight: normal; color: #666;">(${paymentStatus || 'Pending'})</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Customer & Delivery Information Card -->
              <div style="background-color: #FCFAF7; border: 1px solid #EFE6DC; border-radius: 12px; padding: 16px; margin-bottom: 22px;">
                <h3 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6B0F1A; border-bottom: 1px solid #EADFD5; padding-bottom: 6px;">
                  Customer &amp; Delivery Information
                </h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
                  <tr>
                    <td style="width: 32%; color: #8A7A70; font-weight: 600; padding: 3px 0;">Customer Name:</td>
                    <td style="color: #2D231E; font-weight: 700; padding: 3px 0;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="color: #8A7A70; font-weight: 600; padding: 3px 0;">Phone Number:</td>
                    <td style="color: #2D231E; font-weight: 700; padding: 3px 0;">
                      <a href="tel:${customerPhone}" style="color: #6B0F1A; text-decoration: none;">${customerPhone}</a>
                      ${waLink ? ` &bull; <a href="${waLink}" target="_blank" style="color: #15803D; font-weight: 700; text-decoration: none; margin-left: 4px;">&#x1F4AC; WhatsApp Chat</a>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #8A7A70; font-weight: 600; padding: 3px 0;">Email:</td>
                    <td style="color: #2D231E; padding: 3px 0;">
                      ${customerEmail ? `<a href="mailto:${customerEmail}" style="color: #6B0F1A; text-decoration: none;">${customerEmail}</a>` : '<span style="color: #999; font-style: italic;">Not provided (Guest Checkout)</span>'}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #8A7A70; font-weight: 600; padding: 3px 0; vertical-align: top;">Delivery Address:</td>
                    <td style="color: #2D231E; padding: 3px 0; font-weight: 600;">
                      ${deliveryAddress}, ${city || 'Karachi'}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #8A7A70; font-weight: 600; padding: 3px 0;">Order Date &amp; Time:</td>
                    <td style="color: #5C4E44; padding: 3px 0;">${formattedDate}</td>
                  </tr>
                  ${customerNote ? `
                  <tr>
                    <td style="color: #8A7A70; font-weight: 600; padding: 6px 0 0; vertical-align: top;">Customer Notes:</td>
                    <td style="color: #B45309; background-color: #FFFBEB; padding: 6px 8px; border-radius: 6px; font-weight: 600; border-left: 3px solid #D4A62A;">
                      ${customerNote}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Ordered Items Table -->
              <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6B0F1A;">
                Ordered Items (${(items || []).length})
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #EFE6DC; border-radius: 10px; overflow: hidden; margin-bottom: 18px; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #6B0F1A; color: #FFFFFF;">
                    <th align="left" style="padding: 10px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
                    <th align="center" style="padding: 10px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; width: 50px;">Qty</th>
                    <th align="right" style="padding: 10px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; width: 90px;">Price</th>
                    <th align="right" style="padding: 10px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; width: 100px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml || '<tr><td colspan="4" style="padding: 14px; text-align: center; color: #888;">No items listed</td></tr>'}
                </tbody>
              </table>

              <!-- Financial Summary Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; font-size: 13px;">
                <tr>
                  <td align="right" style="padding: 4px 14px; color: #736458; font-weight: 600;">Items Subtotal:</td>
                  <td align="right" style="padding: 4px 0; width: 120px; color: #2D231E; font-weight: 600;">${formatMoney(subtotal)}</td>
                </tr>
                <tr>
                  <td align="right" style="padding: 4px 14px; color: #736458; font-weight: 600;">Delivery Charges:</td>
                  <td align="right" style="padding: 4px 0; width: 120px; color: ${Number(deliveryFee) === 0 ? '#15803D' : '#2D231E'}; font-weight: 700;">
                    ${Number(deliveryFee) === 0 ? 'FREE' : formatMoney(deliveryFee)}
                  </td>
                </tr>
                ${Number(discountAmount) > 0 ? `
                <tr>
                  <td align="right" style="padding: 4px 14px; color: #15803D; font-weight: 600;">Discount Applied:</td>
                  <td align="right" style="padding: 4px 0; width: 120px; color: #15803D; font-weight: 700;">-${formatMoney(discountAmount)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #6B0F1A;">
                  <td align="right" style="padding: 10px 14px 4px; font-size: 16px; font-weight: 800; color: #6B0F1A;">Grand Total Payable:</td>
                  <td align="right" style="padding: 10px 0 4px; width: 120px; font-size: 18px; font-weight: 800; color: #6B0F1A;">${formatMoney(total)}</td>
                </tr>
              </table>

              <!-- Quick Action Call-To-Action -->
              <div style="text-align: center; padding-top: 8px;">
                <a href="${adminDashboardLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6B0F1A 0%, #45090F 100%); color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(107, 15, 26, 0.25); border: 1px solid #D4A62A; margin: 4px;">
                  Open Admin Dashboard &rarr;
                </a>
                ${waLink ? `
                <a href="${waLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 22px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25); margin: 4px;">
                  &#x1F4AC; WhatsApp Customer
                </a>
                ` : ''}
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F5F0; padding: 18px 24px; text-align: center; border-top: 1px solid #EFE6DC; font-size: 11px; color: #8A7A70; line-height: 1.5;">
              <strong style="color: #6B0F1A;">Gulfam Sweets &amp; Dairy</strong> &bull; Shah Faisal Colony &bull; Karachi, Pakistan<br>
              This is an automated notification dispatched upon successful order placement.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export default async function handler(req, res) {
  // CORS Headers for secure API access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    const order = payload.order || payload;

    const orderNumber = order.order_number || order.orderNumber || order.id || 'GS-NEW';
    const customerName = order.customer_name || order.customerName || 'Customer';
    const customerPhone = order.customer_phone || order.customerPhone || '—';
    const customerEmail = order.customer_email || order.customerEmail || null;
    const deliveryAddress = order.delivery_address || order.deliveryAddress || '—';
    const city = order.city || 'Karachi';
    const customerNote = order.customer_note || order.notes || order.delivery_notes || '';
    const paymentMethod = order.payment_method || order.paymentMethod || 'Cash on Delivery';
    const paymentStatus = order.payment_status || order.paymentStatus || 'pending';
    const orderStatus = order.status || 'confirmed';
    const items = order.items || [];
    const subtotal = Number(order.subtotal) || 0;
    const deliveryFee = Number(order.delivery_fee ?? order.deliveryFee ?? 0);
    const discountAmount = Number(order.discount_amount ?? order.discountAmount ?? 0);
    const total = Number(order.total) || 0;
    const createdAt = order.created_at || order.createdAt || new Date().toISOString();

    const host = req.headers.host ? `https://${req.headers.host}` : 'https://gulfam-sweets.vercel.app';

    // Generate responsive HTML email
    const emailHtml = generateOrderEmailHtml({
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      city,
      customerNote,
      paymentMethod,
      paymentStatus,
      orderStatus,
      items,
      subtotal,
      deliveryFee,
      discountAmount,
      total,
      createdAt,
      storeUrl: host,
    });

    const emailSubject = `🔔 New Order ${orderNumber} (${formatMoney(total)}) — ${customerName}`;

    const resendApiKey = process.env.RESEND_API_KEY;

    // Check if Resend API key is available
    if (!resendApiKey) {
      console.warn('[EMAIL NOTIFICATION WARNING]: RESEND_API_KEY is not set in environment variables.');
      console.log(`[ORDER DETAILS LOG]: ${orderNumber} | ${customerName} | ${customerPhone} | Total: ${total}`);

      return res.status(200).json({
        success: true,
        sent: false,
        warning: 'RESEND_API_KEY is not set in Vercel environment variables. Email notification was prepared and logged.',
        recipient: ADMIN_EMAIL,
        orderNumber,
      });
    }

    // Dispatch email via Resend REST API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        reply_to: customerEmail || undefined,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[RESEND API ERROR]:', resendData);
      return res.status(200).json({
        success: false,
        error: resendData?.message || 'Resend API returned an error',
        recipient: ADMIN_EMAIL,
        orderNumber,
      });
    }

    console.log(`[ORDER NOTIFICATION DELIVERED]: Order ${orderNumber} to ${ADMIN_EMAIL} (Email ID: ${resendData.id})`);

    return res.status(200).json({
      success: true,
      sent: true,
      messageId: resendData.id,
      recipient: ADMIN_EMAIL,
      orderNumber,
    });
  } catch (err) {
    console.error('[SEND ORDER EMAIL HANDLER EXCEPTION]:', err);
    // Never return 500 so client checkout is never disturbed
    return res.status(200).json({
      success: false,
      error: err.message || 'Internal error dispatching email',
    });
  }
}
