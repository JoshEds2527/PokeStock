import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
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
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
