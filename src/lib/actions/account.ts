"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";
import { isRateLimited, recordAttempt, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";

type Result = { error?: string; success?: boolean };

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function changeEmailAction(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result> {
  const session = await requireSession();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newEmail = String(formData.get("newEmail") || "")
    .trim()
    .toLowerCase();

  if (!currentPassword || !newEmail) {
    return { error: "Fill in your new email and current password." };
  }

  if (await isRateLimited(session.accountId, "change-email")) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const account = await prisma.account.findUnique({ where: { id: session.accountId } });
  if (!account) redirect("/login");

  const valid = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!valid) {
    await recordAttempt(session.accountId, "change-email");
    return { error: "Current password is incorrect." };
  }

  if (newEmail === account.email) {
    return { error: "That's already your email." };
  }

  const existing = await prisma.account.findUnique({ where: { email: newEmail } });
  if (existing) {
    return { error: "That email is already in use by another account." };
  }

  await prisma.account.update({ where: { id: account.id }, data: { email: newEmail } });

  // Refresh the session cookie so the change shows immediately in this
  // browser too, not just on next login.
  await setSessionCookie({
    accountId: account.id,
    email: newEmail,
    name: account.name,
    pokemonId: session.pokemonId,
    isDeveloper: session.isDeveloper,
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function changePasswordAction(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result> {
  const session = await requireSession();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword) {
    return { error: "Fill in your current and new password." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }

  if (await isRateLimited(session.accountId, "change-password")) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const account = await prisma.account.findUnique({ where: { id: session.accountId } });
  if (!account) redirect("/login");

  const valid = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!valid) {
    await recordAttempt(session.accountId, "change-password");
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.account.update({ where: { id: account.id }, data: { passwordHash } });

  return { success: true };
}
