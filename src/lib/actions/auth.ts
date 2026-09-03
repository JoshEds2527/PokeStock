"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";

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

  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) {
    return { error: "Incorrect email or password." };
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    return { error: "Incorrect email or password." };
  }

  await setSessionCookie({
    accountId: account.id,
    email: account.email,
    name: account.name,
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

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const account = await prisma.account.create({
    data: { name, email, passwordHash },
  });

  await setSessionCookie({
    accountId: account.id,
    email: account.email,
    name: account.name,
  });

  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
