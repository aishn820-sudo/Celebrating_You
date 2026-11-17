"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Store,
} from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function CustomerInvoicesClient({
  initialInvoices,
}: {
  initialInvoices: any[];
}) {
  const [invoices] = useState(initialInvoices);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ADVANCE" | "FINAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (typeFilter !== "ALL" && inv.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
      const matchVendor = inv.vendorBusinessName.toLowerCase().includes(q);
      const matchService = inv.serviceTitle.toLowerCase().includes(q);
      const matchBooking = inv.booking?.bookingCode.toLowerCase().includes(q);
      if (!matchNumber && !matchVendor && !matchService && !matchBooking) return false;
    }
    return true;
  });

  const totalAdvancePaid = invoices
    .filter((inv) => inv.type === "ADVANCE")
    .reduce((sum, inv) => sum + inv.amountPaidThisDoc, 0);

  const totalFinalPaid = invoices
    .filter((inv) => inv.type === "FINAL")
    .reduce((sum, inv) => sum + inv.amountPaidThisDoc, 0);

  const totalInvested = totalAdvancePaid + totalFinalPaid;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">Financial Records</span>
            <span className="text-stone-300">•</span>
            <span className="text-xs font-medium text-stone-500">Host Ledger</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Transaction Invoices & Receipts
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Every payment on Celebrating YOU generates an immutable, audit-compliant transaction document. Inspect milestone receipts and download formal PDF invoices.
          </p>
        </div>

        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 rounded-xl border border-stone-200 shadow-soft text-xs font-semibold transition"
        >
          View Bookings <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
        </Link>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
          <span className="text-xs text-stone-500 font-medium block">Total Paid Milestones</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">
            ₹{(totalInvested / 100).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Across {invoices.length} verified payment receipt(s)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
          <span className="text-xs text-stone-500 font-medium block">Advance Commitments (Doc 1)</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">
            ₹{(totalAdvancePaid / 100).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Unlocked artisan direct contacts
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-soft">
          <span className="text-xs text-stone-500 font-medium block">Final Deliveries Settled (Doc 2)</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            ₹{(totalFinalPaid / 100).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Fully discharged contracts
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-soft mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { label: "All Receipts", val: "ALL" },
            { label: "Doc 1: Advance Deposits", val: "ADVANCE" },
            { label: "Doc 2: Final Invoices", val: "FINAL" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setTypeFilter(tab.val as any)}
              className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                typeFilter === tab.val
                  ? "bg-rose-700 text-white shadow-sm"
                  : "bg-warm-100 text-stone-700 hover:bg-warm-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search invoice number, artisan, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-warm-50 border border-stone-300 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/90 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900">No Invoices Found</h3>
          <p className="text-xs text-stone-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Confirmed milestone advance and final payments will generate official receipts visible here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-stone-700">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-warm-50/70 border-b border-stone-200">
                <tr>
                  <th className="py-4 px-6 font-semibold">Document No.</th>
                  <th className="py-4 px-4 font-semibold">Milestone Type</th>
                  <th className="py-4 px-4 font-semibold">Service & Artisan</th>
                  <th className="py-4 px-4 font-semibold">Amount Paid</th>
                  <th className="py-4 px-4 font-semibold">Balance Due</th>
                  <th className="py-4 px-4 font-semibold">Payment Date</th>
                  <th className="py-4 px-6 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-warm-50/60 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-rose-700 text-xs block">
                        {inv.invoiceNumber}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">
                        Ref: #{inv.booking?.bookingCode || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={inv.type === "ADVANCE" ? "rose" : "success"}>
                        {inv.type === "ADVANCE" ? "Doc 1 (Advance)" : "Doc 2 (Final)"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <strong className="text-stone-900 text-sm block">{inv.serviceTitle}</strong>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Store className="w-3 h-3 text-stone-400" />
                        {inv.vendorBusinessName}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-stone-900 text-sm">
                      ₹{(inv.amountPaidThisDoc / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-stone-600">
                      ₹{(inv.remainingBalanceDue / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-stone-500">
                      {new Date(inv.paymentDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInvoice(inv)}
                        className="gap-1.5 shadow-2xs text-xs"
                      >
                        <Download className="w-3 h-3 text-rose-700" /> Inspect & PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Modal for Detailed Preview and PDF Download */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </main>
  );
}

