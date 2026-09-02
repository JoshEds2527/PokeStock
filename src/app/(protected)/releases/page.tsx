import { prisma } from "@/lib/db";
import { AddReleaseForm } from "./AddReleaseForm";
import { deleteReleaseAction } from "@/lib/actions/releases";
import { StatusSelect } from "./StatusSelect";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-indigo-50 text-indigo-700",
  RELEASED: "bg-emerald-50 text-emerald-700",
  DELAYED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function ReleasesPage() {
  const releases = await prisma.releaseEvent.findMany({
    orderBy: { releaseDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Upcoming releases</h1>

      <AddReleaseForm />

      <div className="space-y-3">
        {releases.length === 0 && (
          <p className="text-sm text-slate-400">No releases tracked yet.</p>
        )}
        {releases.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-800">{r.productName}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusStyles[r.status]}`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {dateFmt.format(r.releaseDate)}
                {r.retailer ? ` · ${r.retailer}` : ""}
              </p>
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  View listing
                </a>
              )}
              {r.notes && <p className="text-sm text-slate-500 mt-1">{r.notes}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusSelect id={r.id} status={r.status} />
              <form action={deleteReleaseAction}>
                <input type="hidden" name="id" value={r.id} />
                <button className="text-xs text-red-500 hover:text-red-700">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
