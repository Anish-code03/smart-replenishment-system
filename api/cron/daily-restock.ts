import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendRestockPrompt } from '../../src/lib/whatsappClient.js';

// Runs daily at 08:00 IST (02:30 UTC) via Vercel Cron — see vercel.json
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const to = process.env.USER_WHATSAPP_NUMBER;
  if (!to) return res.status(500).json({ error: 'USER_WHATSAPP_NUMBER not set' });

  await sendRestockPrompt(to);
  res.json({ ok: true, sentTo: to });
}
