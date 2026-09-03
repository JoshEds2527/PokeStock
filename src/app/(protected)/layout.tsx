import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NavBar, MobileBottomNav } from "@/components/NavBar";
import { AppBackdrop } from "@/components/AppBackdrop";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen md:flex">
      <AppBackdrop pokemonId={session.pokemonId} />
      <NavBar userName={session.name} pokemonId={session.pokemonId} isDeveloper={session.isDeveloper} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
        <MobileBottomNav isDeveloper={session.isDeveloper} />
      </div>
    </div>
  );
}
