"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAccountId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.accountId;
}

export async function markNotificationReadAction(formData: FormData) {
  const accountId = await requireAccountId();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.notification.updateMany({
    where: { id, accountId },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const accountId = await requireAccountId();
  await prisma.notification.updateMany({
    where: { accountId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}
