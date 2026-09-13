import { HttpError } from '../utils/http.js';

export function maskPhone(phone) { return `${phone.slice(0, 3)}******${phone.slice(-2)}`; }
export function normalizePhone(value) { const phone = String(value ?? '').replace(/[\s()-]/g, ''); if (!/^\+[1-9]\d{9,14}$/.test(phone)) throw new HttpError(400, 'A valid WhatsApp number is required'); return phone; }

export async function sendWhatsAppOtp(phone, otp) {
  if (process.env.WHATSAPP_MOCK === 'true') { console.info(`[ShanConnects] Development OTP generated for ${maskPhone(phone)}`); return { messageId: 'development-mock' }; }
  const version = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
  const url = `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_OTP_TEMPLATE_NAME) throw new HttpError(503, 'WhatsApp delivery is not configured');
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'template', template: { name: process.env.WHATSAPP_OTP_TEMPLATE_NAME, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'en_US' }, components: [{ type: 'body', parameters: [{ type: 'text', text: otp }] }] } }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, 'Unable to send verification code');
  return { messageId: body.messages?.[0]?.id ?? null };
}
