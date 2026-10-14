/**
 * Invoice Service — Generate PDF invoices and share them
 */
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { Platform } from 'react-native';

// ── Types ─────────────────────────────────────────────────────────
export interface InvoiceItem {
  name:       string;
  qty:        number;
  unit:       string;
  unitPrice:  number;
  totalPrice: number;
}

export interface InvoiceData {
  billId:       string;
  billNumber:   string;
  shopName:     string;
  shopCity:     string;
  customerName: string;
  customerPhone?: string;
  items:        InvoiceItem[];
  totalAmount:  number;
  createdAt:    number;
}

// ── HTML Template ─────────────────────────────────────────────────
function buildInvoiceHTML(data: InvoiceData): string {
  const date = new Date(data.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const itemRows = data.items.map((item, i) => `
    <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
      <td class="td-left">${i + 1}. ${item.name}</td>
      <td class="td-center">${item.qty} ${item.unit}</td>
      <td class="td-right">₹${item.unitPrice.toFixed(2)}</td>
      <td class="td-right bold">₹${item.totalPrice.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; padding: 24px; color: #1a1a1a; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #0D9E75; }
    .shop-name { font-size: 22px; font-weight: 800; color: #0D9E75; letter-spacing: -0.5px; }
    .shop-city { font-size: 12px; color: #7a7a7a; margin-top: 2px; }
    .invoice-label { font-size: 11px; color: #7a7a7a; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-num { font-size: 18px; font-weight: 700; color: #1a1a1a; text-align: right; }

    .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .meta-block label { font-size: 10px; color: #7a7a7a; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
    .meta-block span { font-size: 13px; font-weight: 600; color: #1a1a1a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .table-head th { background: #0D9E75; color: #fff; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .th-left  { text-align: left; }
    .th-center{ text-align: center; }
    .th-right { text-align: right; }
    .td-left  { text-align: left;   padding: 9px 12px; font-size: 13px; }
    .td-center{ text-align: center; padding: 9px 12px; font-size: 13px; }
    .td-right { text-align: right;  padding: 9px 12px; font-size: 13px; }
    .bold { font-weight: 700; }
    .row-even { background: #f8f7f3; }
    .row-odd  { background: #fff; }

    .total-row { background: #0D9E75 !important; }
    .total-row td { color: #fff; font-weight: 800; font-size: 15px; padding: 12px; }

    .footer { margin-top: 28px; text-align: center; }
    .footer-line { width: 60px; height: 3px; background: #0D9E75; margin: 0 auto 10px; border-radius: 2px; }
    .footer-text { font-size: 11px; color: #7a7a7a; }
    .footer-brand { font-size: 10px; color: #b0b0b0; margin-top: 6px; }

    .badge { display: inline-block; background: #E1F5EE; color: #0D9E75; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; margin-left: 6px; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="shop-name">🛒 ${data.shopName}</div>
      <div class="shop-city">${data.shopCity}</div>
    </div>
    <div>
      <div class="invoice-label">Invoice</div>
      <div class="invoice-num">#${data.billNumber}</div>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-block">
      <label>Customer</label>
      <span>${data.customerName}${data.customerPhone ? ` · ${data.customerPhone}` : ''}</span>
    </div>
    <div class="meta-block" style="text-align: right;">
      <label>Date & Time</label>
      <span>${dateStr} · ${timeStr}</span>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr class="table-head">
        <th class="th-left">Item</th>
        <th class="th-center">Qty</th>
        <th class="th-right">Rate</th>
        <th class="th-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td class="td-left" colspan="3">Total (${data.items.length} items)</td>
        <td class="td-right">₹${data.totalAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-line"></div>
    <div class="footer-text">Thank you for shopping with us! 🙏</div>
    <div class="footer-brand">Generated by AI Store Assistant</div>
  </div>

</body>
</html>
  `.trim();
}

// ── Generate PDF ──────────────────────────────────────────────────
export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  const html = buildInvoiceHTML(data);

  const result = await RNHTMLtoPDF.convert({
    html,
    fileName: `Invoice_${data.billNumber}_${Date.now()}`,
    directory: Platform.OS === 'android' ? 'Downloads' : 'Documents',
    base64: false,
    width: 595,    // A4 width in pts
    height: 842,   // A4 height in pts
  });

  if (!result.filePath) throw new Error('PDF generation failed — no file path returned');
  return result.filePath;
}

// ── Share to WhatsApp ─────────────────────────────────────────────
export async function shareToWhatsApp(filePath: string, customerName: string): Promise<void> {
  const message = `Here is your invoice from our store 🧾`;

  await Share.open({
    title:   'Share Invoice',
    message,
    url:     `file://${filePath}`,
    type:    'application/pdf',
    social:  Share.Social.WHATSAPP,
    failOnCancel: false,
  });
}

// ── Download (share sheet) ────────────────────────────────────────
export async function downloadOrSharePDF(filePath: string, billNumber: string): Promise<void> {
  await Share.open({
    title:       `Invoice #${billNumber}`,
    url:         `file://${filePath}`,
    type:        'application/pdf',
    failOnCancel: false,
    saveToFiles:  true,
  });
}
