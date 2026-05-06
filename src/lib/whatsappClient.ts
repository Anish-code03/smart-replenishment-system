import twilio from 'twilio';

const FROM    = process.env.TWILIO_WHATSAPP_FROM!; // e.g. whatsapp:+14155238886
const APP_URL = process.env.APP_BASE_URL!;

function client() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

function wa(number: string) {
  return number.startsWith('whatsapp:') ? number : `whatsapp:${number}`;
}

export async function sendRestockPrompt(to: string): Promise<void> {
  await client().messages.create({
    from: FROM,
    to: wa(to),
    body:
      `🛒 *Swiggy Instamart — Daily Restock*\n\n` +
      `Hey! Your weekly cart is ready to review.\n\n` +
      `Reply *YES* to see your cart, or *NO* to skip today.`,
  });
}

export async function sendRestockLink(to: string): Promise<void> {
  await client().messages.create({
    from: FROM,
    to: wa(to),
    body:
      `Great! Here's your restock cart 🛒\n\n` +
      `${APP_URL}/ui/index.html\n\n` +
      `Tap to review your items and confirm the order.`,
  });
}

export async function sendSkipConfirmation(to: string): Promise<void> {
  await client().messages.create({
    from: FROM,
    to: wa(to),
    body: `Got it! Skipping today's restock. See you tomorrow 👋`,
  });
}
