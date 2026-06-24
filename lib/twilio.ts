import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, body: string): Promise<string> {
  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });
  return message.sid;
}

export function validateTwilioRequest(
  token: string,
  signature: string,
  url: string,
  params: Record<string, any>
): boolean {
  return twilio.validateRequest(token, signature, url, params);
}
