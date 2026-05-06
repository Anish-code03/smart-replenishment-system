import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { sendRestockLink, sendSkipConfirmation } from '../src/lib/whatsappClient.js';

const YES = new Set(['yes', 'y', '1', 'yeah', 'sure', 'ok', 'yep']);
const NO  = new Set(['no',  'n', '2', 'nope', 'skip', 'later']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Validate that the request genuinely came from Twilio
  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    req.headers['x-twilio-signature'] as string,
    `${process.env.APP_BASE_URL}/api/whatsapp`,
    req.body as Record<string, string>
  );
  if (!valid) return res.status(403).end();

  const reply = ((req.body as Record<string, string>).Body ?? '').trim().toLowerCase();
  const from  = ((req.body as Record<string, string>).From ?? '').replace('whatsapp:', '');

  if (YES.has(reply)) {
    await sendRestockLink(from);
  } else if (NO.has(reply)) {
    await sendSkipConfirmation(from);
  }

  res.setHeader('Content-Type', 'text/xml');
  res.send('<Response></Response>');
}
