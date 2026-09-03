import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Backed by the database (not in-memory) so limits hold up across
// serverless invocations, which don't share memory between requests.
export async function isRateLimited(identifier: string, action: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.rateLimitAttempt.count({
    where: { identifier, action, createdAt: { gte: since } },
  });
  return count >= MAX_ATTEMPTS;
}

export async function recordAttempt(identifier: string, action: string) {
  await prisma.rateLimitAttempt.create({ data: { identifier, action } });
}

export async function clearAttempts(identifier: string, action: string) {
  await prisma.rateLimitAttempt.deleteMany({ where: { identifier, action } });
}

export const RATE_LIMIT_MESSAGE =
  "Too many attempts. Please wait 15 minutes and try again.";
