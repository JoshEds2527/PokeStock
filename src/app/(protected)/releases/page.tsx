import { prisma } from "@/lib/db";
import { AddReleaseForm } from "./AddReleaseForm";
import { ReleasesList, type ReleaseRow } from "./ReleasesList";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReleasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const releases = await prisma.releaseEvent.findMany({
    where: { accountId: session.accountId },
    orderBy: { releaseDate: "asc" },
  });

  const rows: ReleaseRow[] = releases.map((r) => ({
    id: r.id,
    productName: r.productName,
    retailer: r.retailer,
    releaseDate: r.releaseDate.toISOString(),
    url: r.url,
    status: r.status,
    notes: r.notes,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Upcoming releases</h1>

      <AddReleaseForm />

      <ReleasesList rows={rows} />
    </div>
  );
}
