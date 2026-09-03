export type ReleaseRow = {
  id: string;
  productName: string;
  retailer: string | null;
  releaseDate: string; // ISO
  url: string | null;
  status: string;
  notes: string | null;
  isOwner: boolean;
  isTracked: boolean;
};

export const statuses = ["UPCOMING", "RELEASED", "DELAYED", "CANCELLED"];

export const statusStyles: Record<string, string> = {
  UPCOMING: "bg-indigo-50 text-indigo-700",
  RELEASED: "bg-emerald-50 text-emerald-700",
  DELAYED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};
