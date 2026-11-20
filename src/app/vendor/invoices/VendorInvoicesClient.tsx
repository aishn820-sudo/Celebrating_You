"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function VendorInvoicesClient({
  initialInvoices,
  vendor,
}: {
  initialInvoices: any[];
  vendor: any;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (typeFilter !== "ALL" && inv.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchBooking = inv.booking?.bookingCode?.toLowerCase().includes(q);
      const matchCust = inv.customerName?.toLowerCase().includes(q);
      const matchTxn = inv.transaction?.transactionRef?.toLowerCase().includes(q);
      if (!matchNum && !matchBooking && !matchCust && !matchTxn) return false;
    }
    return true;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amountPaidThisDoc, 0);
  const advanceInvoices = invoices.filter((inv) => inv.type === "ADVANCE");
  const finalInvoices = invoices.filter((inv) => inv.type === "FINAL");

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Badge variant="champagne" size="sm" className="mb-2">
            Tax & Financial Ledger
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
            Transaction-Wise Invoice Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Official Advance (Document 1) and Final (Document 2) payment receipts linking to each confirmed booking.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-surface px-4 py-2.5 rounded-2xl border border-stone-200/90 dark:border-dark-border shadow-soft flex items-center gap-3 text-xs transition-colors">
          <div>
            <span className="text-stone-400 dark:text-stone-400 block text-[10px] font-bold uppercase tracking-wider">Vendor GSTIN</span>
            <span className="font-bold text-stone-900 dark:text-dark-text-primary">
              {vendor.gstin ? `${vendor.gstin} (Registered)` : "Unregistered (No GST Charged)"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-wider block">
            Total Invoiced
          </span>
          <span className="text-2xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1 block">
            {formatPrice(totalInvoiced)}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 block">100% Reconciled to Gateway</span>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-wider block">
            Issued Documents
          </span>
          <span className="text-2xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-1 block">{invoices.length}</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">Electronic receipts</span>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-wider block">
            Advance Receipts (Doc 1)
          </span>
          <span className="text-2xl font-serif font-bold text-rose-700 dark:text-rose-400 mt-1 block">{advanceInvoices.length}</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
            {formatPrice(advanceInvoices.reduce((s, i) => s + i.amountPaidThisDoc, 0))}
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-wider block">
            Final Invoices (Doc 2)
          </span>
          <span className="text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">{finalInvoices.length}</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
            {formatPrice(finalInvoices.reduce((s, i) => s + i.amountPaidThisDoc, 0))}
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "All Receipts", val: "ALL" },
              { label: "Document 1 (Advance)", val: "ADVANCE" },
              { label: "Document 2 (Final)", val: "FINAL" },
            ].map((tab) => (
              <button
                key={tab.val}
                onClick={() => setTypeFilter(tab.val)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  typeFilter === tab.val
                    ? "bg-stone-900 dark:bg-rose-700 text-white font-bold shadow-sm"
                    : "bg-stone-100 dark:bg-dark-elevated text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-dark-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              placeholder="Search invoice #, booking #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-dark-elevated rounded-xl border border-stone-200 dark:border-dark-border text-xs text-stone-900 dark:text-dark-text-primary placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-dark-surface transition-all"
            />
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No transaction receipts found"
          description="Invoices are automatically generated and linked upon each verified customer advance or final payment."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 dark:bg-dark-elevated border-b border-stone-200 dark:border-dark-border text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Invoice Document</th>
                  <th className="py-3.5 px-5">Booking Ref</th>
                  <th className="py-3.5 px-5">Billed Customer</th>
                  <th className="py-3.5 px-5">Service Description</th>
                  <th className="py-3.5 px-5">Document Amount</th>
                  <th className="py-3.5 px-5">Payment Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-dark-border text-stone-700 dark:text-stone-300">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/50 dark:hover:bg-dark-elevated/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <Badge
                          variant={inv.type === "ADVANCE" ? "rose" : "success"}
                          size="sm"
                        >
                          {inv.type === "ADVANCE" ? "Doc 1" : "Doc 2"}
                        </Badge>
                        <span className="font-mono font-bold text-stone-900 dark:text-dark-text-primary text-xs">
                          {inv.invoiceNumber}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5 font-mono text-stone-600 dark:text-stone-400">
                      #{inv.booking?.bookingCode || "N/A"}
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-stone-900 dark:text-dark-text-primary block">{inv.customerName}</span>
                      <span className="text-[11px] text-stone-400 dark:text-stone-500">{inv.customerPhone}</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-medium text-stone-800 dark:text-stone-200 line-clamp-1">{inv.serviceTitle}</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">{inv.packageName || "Standard Tier"}</span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-stone-900 dark:text-dark-text-primary text-sm block">
                        {formatPrice(inv.amountPaidThisDoc)}
                      </span>
                      {inv.taxAmount > 0 && (
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 block">
                          Incl. GST: {formatPrice(inv.taxAmount)}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-stone-500 dark:text-stone-400">
                      {new Date(inv.paymentDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(inv)}
                        leftIcon={<FileText className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />}
                      >
                        Inspect & Print PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invoice Modal for Printable and PDF Download */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </main>
  );
}
