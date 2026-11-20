"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, X, ShieldAlert } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AdminComplaintsClient({ initialComplaints }: { initialComplaints: any[] }) {
  const router = useRouter();
  const [complaints, setComplaints] = useState(initialComplaints);
  const [activeComplaint, setActiveComplaint] = useState<any>(null);
  const [status, setStatus] = useState("RESOLVED");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: activeComplaint.id,
          status,
          adminNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to update complaint");

      setActiveComplaint(null);
      router.refresh();
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto text-xs">
      <div className="mb-8">
        <span className="text-xs font-semibold tracking-wider uppercase text-rose-700 dark:text-rose-400">Quality Assurance</span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1">
          Dispute & Complaint Resolution Center
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          Neutral arbitration for client issues, event-day delivery discrepancies, and refund investigations.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft overflow-hidden transition-colors">
        {complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500 dark:text-stone-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
            <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-dark-text-primary">Zero Active Disputes</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              All bookings, milestones, and services are operating smoothly without escalated complaints.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-stone-700 dark:text-stone-300">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-warm-50/70 dark:bg-dark-elevated border-b border-stone-200 dark:border-dark-border">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Booking Ref</th>
                  <th className="py-3.5 px-4 font-semibold">Subject</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Vendor</th>
                  <th className="py-3.5 px-4 font-semibold">Priority</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 text-right font-semibold">Resolve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-dark-border">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-warm-50/60 dark:hover:bg-dark-elevated/60 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-rose-700 dark:text-rose-400">
                      #{c.booking?.bookingCode || "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-stone-900 dark:text-dark-text-primary block">{c.subject}</strong>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">{c.description}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-dark-text-primary">{c.customer.name}</td>
                    <td className="py-3.5 px-4 font-medium text-stone-800 dark:text-stone-200">{c.vendor.businessName}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.priority === "URGENT" || c.priority === "HIGH"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {c.priority}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.status === "RESOLVED" || c.status === "CLOSED"
                            ? "success"
                            : "danger"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setActiveComplaint(c);
                          setStatus(c.status);
                          setAdminNotes(c.adminNotes || "");
                        }}
                        className="px-3 py-1.5 bg-warm-100 dark:bg-dark-elevated hover:bg-warm-200 dark:hover:bg-dark-border text-stone-800 dark:text-dark-text-primary rounded-xl font-semibold text-[11px] transition"
                      >
                        Arbitrate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeComplaint && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 dark:border-dark-border shadow-2xl text-xs text-stone-800 dark:text-dark-text-primary transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-4">
              <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-lg">Dispute Arbitrator</h3>
              <button onClick={() => setActiveComplaint(null)} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-dark-elevated transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-warm-50 dark:bg-dark-elevated rounded-xl space-y-1.5 mb-4 border border-stone-200 dark:border-dark-border transition-colors">
              <p className="font-semibold text-stone-900 dark:text-dark-text-primary">{activeComplaint.subject}</p>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-xs">{activeComplaint.description}</p>
              <div className="pt-2 text-[11px] text-stone-500 dark:text-stone-400 flex justify-between border-t border-stone-200/60 dark:border-dark-border">
                <span>By: {activeComplaint.customer.name}</span>
                <span>Vendor: {activeComplaint.vendor.businessName}</span>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Resolution Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs font-medium"
                >
                  <option value="OPEN">OPEN (Under Review)</option>
                  <option value="INVESTIGATING">INVESTIGATING (Contacting Artisan)</option>
                  <option value="RESOLVED">RESOLVED (Arbitration Complete)</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Resolution Findings / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record mutual settlement, coupon, or refund details..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full justify-center py-2.5 shadow-soft"
              >
                {loading ? "Recording..." : "Save Resolution Record"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
