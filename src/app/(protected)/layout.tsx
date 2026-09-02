import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:flex">
      <NavBar userName={session.name} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
