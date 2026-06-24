import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_SECRET = process.env.ADMIN_PASSWORD || "";

export async function setAdminSession() {
  const token = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("admin:" + Date.now())
    .digest("hex");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);

  if (!session) return false;

  const expectedToken = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("admin:")
    .digest("hex");

  return session.value.startsWith(expectedToken.slice(0, 20));
}
