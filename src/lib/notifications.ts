import { prisma } from "@/lib/db";

// Fire-and-forget in-app notification, meant to be called alongside (not
// instead of) the existing email sends -- see the Notification model's
// comment in schema.prisma. Never throws: a notification failing to write
// shouldn't break the email/action that triggered it.
export async function createNotification(accountId: string, message: string, url?: string) {
  try {
    await prisma.notification.create({ data: { accountId, message, url: url ?? null } });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
