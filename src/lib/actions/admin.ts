"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireDeveloper() {
  const session = await getSession();
  if (!session) redirect("/login");
  const account = await prisma.account.findUnique({
    where: { id: session.accountId },
    select: { isDeveloper: true },
  });
  if (!account?.isDeveloper) redirect("/");
  return session.accountId;
}

export async function deleteAccountAction(formData: FormData) {
  const currentAccountId = await requireDeveloper();
  const targetId = String(formData.get("id") || "");
  if (!targetId || targetId === currentAccountId) return;
  await prisma.account.delete({ where: { id: targetId } });
  revalidatePath("/admin");
}
