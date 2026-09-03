"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { randomPokemonId, isValidPokemonId } from "@/lib/pokemon";
import { isRateLimited, recordAttempt, clearAttempts, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/origin";

// Sent from the app's own address (EMAIL_FROM, or Resend's shared sender as a
// fallback) -- never the developer's personal inbox, same as every other
// outgoing email in the app.
async function sendWelcomeEmail(name: string, email: string) {
  const origin = await currentOrigin();
  await sendEmail({
    to: email,
    subject: "Welcome to PokéStock! 🎉",
    text: `Hi ${name},\n\nWelcome aboard -- we're so glad you're here! Your PokéStock account is all set up and ready for you to start tracking your inventory, sales, and every exciting upcoming release.\n\nJump in whenever you're ready: ${origin}\n\nWishing you great pulls and even better sales.\n\nWarmly,\nThe PokéStock team`,
    html: `<p>Hi ${name},</p><p>Welcome aboard -- we're so glad you're here! Your PokéStock account is all set up and ready for you to start tracking your inventory, sales, and every exciting upcoming release.</p><p><a href="${origin}">Jump in whenever you're ready</a></p><p>Wishing you great pulls and even better sales.</p><p>Warmly,<br>The PokéStock team</p>`,
  });
}

function resolvePokemonId(formData: FormData): number {
  const raw = Number(formData.get("pokemonId"));
  return isValidPokemonId(raw) ? raw : randomPokemonId();
}

async function clientIp() {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (await isRateLimited(email, "login")) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) {
    await recordAttempt(email, "login");
    return { error: "Incorrect email or password." };
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    await recordAttempt(email, "login");
    return { error: "Incorrect email or password." };
  }

  await clearAttempts(email, "login");

  await prisma.account.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  await setSessionCookie({
    accountId: account.id,
    email: account.email,
    name: account.name,
    pokemonId: resolvePokemonId(formData),
    isDeveloper: account.isDeveloper,
  });

  redirect("/");
}

export async function registerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name || !email || !password) {
    return { error: "Fill in your name, email, and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const ip = await clientIp();
  if (await isRateLimited(ip, "register")) {
    return { error: RATE_LIMIT_MESSAGE };
  }
  await recordAttempt(ip, "register");

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const account = await prisma.account.create({
    data: { name, email, passwordHash, lastLoginAt: new Date() },
  });

  await setSessionCookie({
    accountId: account.id,
    email: account.email,
    name: account.name,
    pokemonId: resolvePokemonId(formData),
    isDeveloper: account.isDeveloper,
  });

  await sendWelcomeEmail(account.name, account.email);

  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
