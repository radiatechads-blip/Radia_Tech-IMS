import { companyInfo } from "@/data/company";
import { Resend } from "resend";

export function isValidResendApiKey(apiKey?: string | null) {
  if (!apiKey) return false;
  const normalized = apiKey.trim();
  if (!normalized) return false;
  return /^re_[A-Za-z0-9_]{10,}$/.test(normalized);
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!isValidResendApiKey(apiKey)) return null;
  return new Resend(apiKey);
}

interface InquiryEmailData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
  quantity?: string;
  productName?: string;
  source: string;
}

type EmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAdminRecipients() {
  const rawRecipients =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    companyInfo.contact.email;

  return rawRecipients
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function resolveFromAddress() {
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured) {
    return configured;
  }
  return "onboarding@resend.dev";
}

async function sendToOne(to: string, subject: string, html: string): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { ok: false, error: "RESEND_API_KEY is not configured" };
    }
    if (!isValidResendApiKey(apiKey)) {
      return { ok: false, error: "RESEND_API_KEY is malformed or not a valid Resend key" };
    }
    return { ok: false, error: "Unable to initialize Resend client" };
  }

  try {
    const result = await resend.emails.send({
      from: resolveFromAddress(),
      to: [to],
      subject,
      html,
    });

    if (result.error) {
      const message = result.error.message || "Email provider rejected the message";
      console.error("Resend send failed", { to, subject, error: message });
      return { ok: false, error: message };
    }

    return { ok: true, id: result.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed";
    console.error("Resend send exception", { to, subject, error: message });
    return { ok: false, error: message };
  }
}

export async function sendEmail({ to, subject, html }: { to: string[]; subject: string; html: string }): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  if (!isValidResendApiKey(apiKey)) {
    return { ok: false, error: "RESEND_API_KEY is malformed or not a valid Resend key" };
  }

  if (to.length === 0) {
    return { ok: false, error: "No email recipient configured" };
  }

  // Send individually and sequentially with spacing — Resend free plan: 2 req/s
  let lastResult: EmailResult = { ok: false, error: "No recipients" };
  for (let i = 0; i < to.length; i++) {
    lastResult = await sendToOne(to[i], subject, html);
    if (i < to.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  return lastResult;
}

function buildRow(label: string, value?: string, href?: string) {
  if (!value) return "";
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(value);
  const content = href ? `<a href="${escapeHtml(href)}" style="color:#2563eb">${safeValue}</a>` : safeValue;

  return `<tr><td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151;width:140px">${safeLabel}</td><td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827">${content}</td></tr>`;
}

export async function sendAdminNotification(data: InquiryEmailData): Promise<EmailResult> {
  const productLabel = data.productName ? `: ${data.productName}` : "";
  const safeSource = data.source === "whatsapp" ? "WhatsApp" : "Website Form";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#0B3D91;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="color:#fff;margin:0">New Inquiry Received</h2>
        <p style="color:#93c5fd;margin:4px 0 0;font-size:14px">From ${safeSource}</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          ${buildRow("Name", data.name)}
          ${buildRow("Email", data.email, data.email ? `mailto:${data.email}` : undefined)}
          ${buildRow("Phone", data.phone, `tel:${data.phone}`)}
          ${buildRow("Company", data.company)}
          ${buildRow("Product", data.productName)}
          ${buildRow("Quantity", data.quantity)}
          ${data.message ? `<tr><td style="padding:10px 12px;font-weight:600;color:#374151;vertical-align:top">Message</td><td style="padding:10px 12px;color:#374151;line-height:1.55">${escapeHtml(data.message).replace(/\n/g, "<br />")}</td></tr>` : ""}
        </table>
        <div style="margin-top:20px;padding:12px;background:#f0f9ff;border-radius:8px;text-align:center">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://radiatechfire.in"}/admin/inquiries" style="color:#0B3D91;font-weight:600;text-decoration:none">View in Admin Panel</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: getAdminRecipients(),
    subject: `New Inquiry${productLabel} - ${data.name}`,
    html,
  });
}

export async function sendCustomerConfirmation(data: InquiryEmailData): Promise<EmailResult> {
  if (!data.email) return { ok: true };

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#0B3D91;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h2 style="color:#fff;margin:0">Thank You for Your Inquiry</h2>
        <p style="color:#93c5fd;margin:8px 0 0;font-size:14px">Radiatech Electra Private Limited</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
        <p style="color:#374151;font-size:15px;line-height:1.6">Dear <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.6">Thank you for reaching out to us. We have received your inquiry and our team will review it shortly.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="color:#64748b;font-size:13px;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Your Inquiry Summary</p>
          ${data.productName ? `<p style="color:#374151;font-size:14px;margin:4px 0"><strong>Product:</strong> ${escapeHtml(data.productName)}</p>` : ""}
          ${data.quantity ? `<p style="color:#374151;font-size:14px;margin:4px 0"><strong>Quantity:</strong> ${escapeHtml(data.quantity)}</p>` : ""}
          ${data.message ? `<p style="color:#374151;font-size:14px;margin:4px 0"><strong>Message:</strong> ${escapeHtml(data.message)}</p>` : ""}
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6"><strong>What happens next?</strong></p>
        <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px">
          <li>Our team will review your requirement within 2-4 hours.</li>
          <li>You will receive a quotation or follow-up via email or phone.</li>
          <li>We will connect you with a product specialist if needed.</li>
        </ul>
        <p style="color:#374151;font-size:15px;line-height:1.6">Need immediate assistance? Contact us:</p>
        <div style="display:flex;gap:12px;margin:12px 0">
          <a href="tel:${companyInfo.contact.phoneHref}" style="background:#0B3D91;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Call Now</a>
          <a href="https://wa.me/${companyInfo.contact.whatsapp}" style="background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">WhatsApp</a>
        </div>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="color:#9ca3af;font-size:12px;text-align:center">Radiatech Electra Private Limited | Noida, Uttar Pradesh, India</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: [data.email],
    subject: "We have received your inquiry - Radiatech Electra",
    html,
  });
}

export async function sendInquiryEmails(data: InquiryEmailData) {
  // Send sequentially with a gap — Resend free plan allows only 2 req/sec.
  // Admin notification may itself send to multiple recipients one-by-one,
  // so we wait for it to fully complete before sending the customer email.
  const admin = await sendAdminNotification(data);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const customer = data.email ? await sendCustomerConfirmation(data) : ({ ok: true } as EmailResult);

  return { admin, customer };
}
