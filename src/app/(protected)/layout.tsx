import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import { AppBackdrop } from "@/components/AppBackdrop";
import type { NotificationItem } from "@/components/NotificationBell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const notificationRows = await prisma.notification.findMany({
    where: { accountId: session.accountId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const notifications: NotificationItem[] = notificationRows.map((n) => ({
    id: n.id,
    message: n.message,
    url: n.url,
    createdAt: n.createdAt.toISOString(),
    read: n.readAt !== null,
  }));

  return (
    <div className="min-h-screen md:flex">
      <AppBackdrop pokemonId={session.pokemonId} />
      <NavBar
        userName={session.name}
        pokemonId={session.pokemonId}
        isDeveloper={session.isDeveloper}
        notifications={notifications}
      />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
