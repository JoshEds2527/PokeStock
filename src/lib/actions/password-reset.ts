"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isRateLimited, recordAttempt, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit";
import { hashResetToken } from "@/lib/resetToken";
import { currentOrigin } from "@/lib/origin";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordResetAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Enter your email address." };

  if (await isRateLimited(email, "password-reset-request")) {
    return { error: RATE_LIMIT_MESSAGE };
  }
  await recordAttempt(email, "password-reset-request");

  const account = await prisma.account.findUnique({ where: { email } });

  // Always the same response whether or not the account exists, so this
  // can't be used to check which emails are registered.
  if (account) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);

    await prisma.passwordResetToken.deleteMany({
      where: { accountId: account.id, usedAt: null },
    });
    await prisma.passwordResetToken.create({
      data: {
        accountId: account.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const origin = await currentOrigin();
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: account.email,
      subject: "Reset your PokéStock password",
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
      html: `<p>Reset your PokéStock password by clicking the link below. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    });
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) return { error: "Missing reset token." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.account.update({
      where: { id: resetToken.accountId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login");
}
