import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteAccountAction } from "@/lib/actions/admin";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = await prisma.account.findUnique({
    where: { id: session.accountId },
    select: { isDeveloper: true },
  });
  if (!me?.isDeveloper) redirect("/");

  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isDeveloper: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { products: true, sales: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white drop-shadow">Accounts</h1>
        <p className="text-sm text-white mt-1 drop-shadow">
          Every account registered on PokéStock. Visible only to the developer account.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-slate-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Joined</th>
              <th className="px-4 py-2 text-left">Last login</th>
              <th className="px-4 py-2 text-right">Products</th>
              <th className="px-4 py-2 text-right">Sales</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {accounts.map((a) => {
              const isSelf = a.id === session.accountId;
              return (
                <tr key={a.id}>
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      {a.name}
                      {a.isDeveloper && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                          Developer
                        </span>
                      )}
                      {isSelf && <span className="text-[10px] text-slate-400">(you)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{a.email}</td>
                  <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                    {dateFmt.format(a.createdAt)}
                  </td>
                  <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                    {a.lastLoginAt ? dateFmt.format(a.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-4 py-2 text-right">{a._count.products}</td>
                  <td className="px-4 py-2 text-right">{a._count.sales}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {!isSelf && (
                      <form action={deleteAccountAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <ConfirmSubmitButton
                          confirmText={`Permanently delete "${a.name}" (${a.email})? This removes all of their inventory, purchases, and sales. This cannot be undone.`}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
