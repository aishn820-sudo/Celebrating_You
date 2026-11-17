"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, IndianRupee, ShieldCheck, CheckCircle2, TrendingUp, Building2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AdminFinancialsClient({
  metrics,
  settlements,
  refunds,
  commissionSettings,
}: {
  metrics: any;
  settlements: any[];
  refunds: any[];
  commissionSettings: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSettle = async (settlementId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/financials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId,
          action: "SETTLE",
          remarks: "Electronic bank disbursement authorized by Super Admin",
        }),
      });

      if (!res.ok) throw new Error("Failed to process settlement");

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
        <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">
          Executive Balance Sheet
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
          Financial Analytics & Settlements
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Reconciled separation of Gross Booking Value (GBV), platform commission margins, artisan bank disbursements, and gateway transaction costs.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
          <span className="text-stone-500 block uppercase font-bold text-[10px]">Gross Booking Value</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">
            ₹{(metrics.totalBookingValue / 100).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">Contracted marketplace volume</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
          <span className="text-stone-500 block uppercase font-bold text-[10px]">Total Collected</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            ₹{(metrics.totalCollected / 100).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Adv: ₹{(metrics.advanceTotal / 100).toLocaleString("en-IN")} | Fin: ₹{(metrics.finalTotal / 100).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
          <span className="text-stone-500 block uppercase font-bold text-[10px]">Platform Commission</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">
            ₹{(metrics.platformCommission / 100).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-rose-800 mt-1 block">Retained platform earnings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
          <span className="text-stone-500 block uppercase font-bold text-[10px]">Net Platform Revenue</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">
            ₹{(metrics.netPlatformRevenue / 100).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">After est. 2% gateway processing</span>
        </div>
      </div>

      {/* Settlements Due Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft p-6 sm:p-8 mb-8">
        <h3 className="font-serif font-bold text-stone-900 text-base mb-4">Vendor Bank Settlements Queue</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-stone-700">
            <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-warm-50/70 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Booking Ref</th>
                <th className="py-3 px-4 font-semibold">Artisan & Bank Details</th>
                <th className="py-3 px-4 font-semibold">Gross Contract</th>
                <th className="py-3 px-4 font-semibold">Commission ({metrics.platformCommission > 0 ? "10%" : "Tier"})</th>
                <th className="py-3 px-4 font-semibold">Net Payout</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Disbursement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-warm-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                    #{s.booking.bookingCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-stone-900">{s.vendor.businessName}</p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      {s.vendor.bankName || "HDFC Bank"} • A/C: {s.vendor.bankAccountNumber ? `••••${s.vendor.bankAccountNumber.slice(-4)}` : "Pending"}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-medium">₹{(s.grossAmount / 100).toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-4 text-rose-700 font-medium">₹{(s.platformCommission / 100).toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700 text-sm">
                    ₹{(s.netSettlementAmount / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={s.status === "SETTLED" ? "success" : "warning"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {s.status === "DUE" ? (
                      <button
                        onClick={() => handleSettle(s.id)}
                        disabled={loading}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition"
                      >
                        Authorize Payout
                      </button>
                    ) : (
                      <span className="text-stone-500 text-[11px] font-mono font-medium">{s.settlementRef}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft p-6">
        <h3 className="font-serif font-bold text-stone-900 text-base mb-3">Category Commission Policies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {commissionSettings.map((cs) => (
            <div key={cs.id} className="p-4 bg-warm-50 rounded-2xl border border-stone-200">
              <span className="font-semibold text-stone-900 block">{cs.category?.name || "Global Default"}</span>
              <span className="text-rose-700 font-bold text-base block mt-1">
                {cs.defaultCommissionPercent}% Standard
              </span>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Policy Range: {cs.minCommissionPercent}% - {cs.maxCommissionPercent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
