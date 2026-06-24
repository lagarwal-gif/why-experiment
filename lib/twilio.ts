import twilio from "twilio";

let _client: any = null;

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return _client;
}

export async function sendSMS(to: string, body: string): Promise<string> {
  console.log(`[MOCK SMS] To: ${to}`);
  console.log(`[MOCK SMS] From: ${process.env.TWILIO_PHONE_NUMBER}`);
  console.log(`[MOCK SMS] Body: ${body}`);
  return "mock-sid-" + Date.now();
}

export function validateTwilioRequest(
  token: string,
  signature: string,
  url: string,
  params: Record<string, any>
): boolean {
  return twilio.validateRequest(token, signature, url, params);
}
