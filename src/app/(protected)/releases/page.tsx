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

  const [account, releases] = await Promise.all([
    prisma.account.findUnique({ where: { id: accountId }, select: { isDeveloper: true } }),
    prisma.releaseEvent.findMany({
      include: { trackedBy: { where: { accountId } } },
      orderBy: { releaseDate: "asc" },
    }),
  ]);
  const canManage = account?.isDeveloper ?? false;

  const rows: ReleaseRow[] = releases.map((r) => ({
    id: r.id,
    productName: r.productName,
    retailer: r.retailer,
    releaseDate: r.releaseDate.toISOString(),
    url: r.url,
    status: r.status,
    notes: r.notes,
    isTracked: r.trackedBy.length > 0,
  }));

  const trackedRows = rows.filter((r) => r.isTracked);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white drop-shadow">Releases</h1>
        <p className="text-sm text-white mt-1 drop-shadow">
          A shared list of upcoming Pokémon product releases. Track only the ones you
          care about &mdash; everyone sees the same catalog, but your tracked list is yours alone.
        </p>
      </div>

      {canManage ? (
        <AddReleaseForm />
      ) : (
        <p className="text-sm text-white drop-shadow">
          Only the PokéStock team can add or edit releases in the shared list — track
          anything you&apos;re interested in below.
        </p>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white drop-shadow mb-3">Your tracked releases</h2>
        <TrackedReleases rows={trackedRows} canManage={canManage} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white drop-shadow mb-3">Browse all upcoming releases</h2>
        <ReleaseCatalog rows={rows} canManage={canManage} />
      </div>
    </div>
  );
}
