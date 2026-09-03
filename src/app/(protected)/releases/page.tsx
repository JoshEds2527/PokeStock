import { prisma } from "@/lib/db";
import { AddReleaseForm } from "./AddReleaseForm";
import { TrackedReleases } from "./TrackedReleases";
import { ReleaseCatalog } from "./ReleaseCatalog";
import type { ReleaseRow } from "./types";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReleasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const accountId = session.accountId;

  const releases = await prisma.releaseEvent.findMany({
    include: { trackedBy: { where: { accountId } } },
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
    isOwner: r.createdByAccountId === accountId,
    isTracked: r.trackedBy.length > 0,
  }));

  const trackedRows = rows.filter((r) => r.isTracked);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white drop-shadow">Releases</h1>
        <p className="text-sm text-white/70 mt-1 drop-shadow">
          A shared list of upcoming Pokémon product releases. Track only the ones you
          care about &mdash; everyone sees the same catalog, but your tracked list is yours alone.
        </p>
      </div>

      <AddReleaseForm />

      <div>
        <h2 className="text-lg font-semibold text-white drop-shadow mb-3">Your tracked releases</h2>
        <TrackedReleases rows={trackedRows} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white drop-shadow mb-3">Browse all upcoming releases</h2>
        <ReleaseCatalog rows={rows} />
      </div>
    </div>
  );
}
