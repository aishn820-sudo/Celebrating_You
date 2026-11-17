import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import { History, ShieldCheck, User } from "lucide-react";

export default async function AdminAuditLogsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const logs = await prisma.auditLog.findMany({
    include: { admin: true },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 text-stone-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <AdminNav />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto text-xs">
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">Compliance & Security</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            System Audit Trail & Access Logs
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Immutable log of all administrative actions, KYC decisions, commission updates, and refund disbursements.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-stone-700">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-warm-50/70 border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Operator / Email</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Previous Value</th>
                  <th className="py-3.5 px-6 font-semibold">New Value / Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-warm-50/60 transition">
                    <td className="py-3.5 px-6 text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-stone-900 font-medium">
                      {log.admin?.email || "System"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-700">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {log.targetEntity} {log.targetId ? `(#${log.targetId.slice(-6)})` : ""}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {log.previousValue || "—"}
                    </td>
                    <td className="py-3.5 px-6 text-emerald-700 font-semibold">
                      {log.newValue || "Executed successfully"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
