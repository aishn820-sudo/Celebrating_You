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
    <div className="flex flex-col md:flex-row min-h-screen bg-warm-50 dark:bg-dark-bg text-stone-900 dark:text-dark-text-primary font-sans antialiased selection:bg-rose-100 selection:text-rose-900 transition-colors">
      <AdminNav />

      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto text-xs">
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700 dark:text-rose-400">Compliance & Security</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1">
            System Audit Trail & Access Logs
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Immutable log of all administrative actions, KYC decisions, commission updates, and refund disbursements.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-stone-700 dark:text-stone-300">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-warm-50/70 dark:bg-dark-elevated border-b border-stone-200 dark:border-dark-border">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Operator / Email</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Previous Value</th>
                  <th className="py-3.5 px-6 font-semibold">New Value / Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-dark-border font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-warm-50/60 dark:hover:bg-dark-elevated/60 transition">
                    <td className="py-3.5 px-6 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-stone-900 dark:text-dark-text-primary font-medium">
                      {log.admin?.email || "System"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-700 dark:text-rose-400">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400">
                      {log.targetEntity} {log.targetId ? `(#${log.targetId.slice(-6)})` : ""}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400">
                      {log.previousValue || "—"}
                    </td>
                    <td className="py-3.5 px-6 text-emerald-700 dark:text-emerald-400 font-semibold">
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
