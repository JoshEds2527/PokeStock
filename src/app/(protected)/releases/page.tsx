import { prisma } from "@/lib/db";
import { AddReleaseForm } from "./AddReleaseForm";
import { ReleasesList, type ReleaseRow } from "./ReleasesList";

export default async function ReleasesPage() {
  const releases = await prisma.releaseEvent.findMany({
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
