import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/origin";

// Meant to be hit once a day by a scheduler (Vercel Cron once deployed --
// see vercel.json and the README). Emails everyone tracking a release that's
// landing in the next 48 hours and hasn't been reminded about yet.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` on
  // requests it triggers when that env var is set. The `?secret=` query
  // param is a fallback for manually testing the endpoint yourself.
  const authHeader = request.headers.get("authorization");
  const providedViaHeader = authHeader?.replace(/^Bearer\s+/i, "");
  const providedViaQuery = request.nextUrl.searchParams.get("secret");
  const provided = providedViaHeader || providedViaQuery;

  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const upcoming = await prisma.releaseEvent.findMany({
    where: {
      status: "UPCOMING",
      remindedAt: null,
      releaseDate: { gte: now, lte: soon },
    },
    include: {
      trackedBy: { include: { account: { select: { email: true } } } },
    },
  });

  const origin = await currentOrigin();
  const releasesUrl = `${origin}/releases`;
  let remindersSent = 0;

  for (const release of upcoming) {
    if (release.trackedBy.length > 0) {
      await Promise.all(
        release.trackedBy.map((t) =>
          sendEmail({
            to: t.account.email,
            subject: `${release.productName} is releasing soon`,
            text: `A release you're tracking on PokéStock is coming up soon.\n\n${release.productName}${release.retailer ? ` (${release.retailer})` : ""} releases on ${release.releaseDate.toDateString()}.\n\nView it: ${releasesUrl}`,
            html: `<p>A release you're tracking on PokéStock is coming up soon.</p><p><strong>${release.productName}</strong>${release.retailer ? ` (${release.retailer})` : ""} releases on <strong>${release.releaseDate.toDateString()}</strong>.</p><p><a href="${releasesUrl}">View it in PokéStock</a></p>`,
          })
        )
      );
      remindersSent += release.trackedBy.length;
    }

    await prisma.releaseEvent.update({
      where: { id: release.id },
      data: { remindedAt: now },
    });
  }

  return Response.json({
    checked: upcoming.length,
    remindersSent,
  });
}
