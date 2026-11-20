"use client";

import { useRef } from "react";
import { X, Printer, Download, CheckCircle2, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import Button from "@/components/ui/Button";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  type: "ADVANCE" | "FINAL";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  vendorBusinessName: string;
  vendorGstin?: string;
  vendorPan?: string;
  vendorAddress?: string;
  serviceTitle: string;
  packageName?: string;
  agreedServiceValue: number; // paise
  advancePaid: number; // paise
  amountPaidThisDoc: number; // paise
  remainingBalanceDue: number; // paise
  taxAmount: number; // paise
  paymentDate: string;
  status: string;
  booking?: {
    bookingCode: string;
    eventDate: string;
  };
  transaction?: {
    transactionRef: string;
    gatewayProvider: string;
    gatewayPaymentId?: string;
  };
}

export default function InvoiceModal({
  invoice,
  onClose,
}: {
  invoice: InvoiceData | null;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const formatINR = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const isGstRegistered = Boolean(
    invoice.vendorGstin &&
    invoice.vendorGstin !== "N/A" &&
    invoice.vendorGstin.trim().length >= 15 &&
    !invoice.vendorGstin.toLowerCase().includes("unregistered")
  );

  const docTitle = isGstRegistered
    ? invoice.type === "ADVANCE"
      ? "TAX INVOICE — ADVANCE RECEIPT"
      : "FINAL TAX INVOICE"
    : invoice.type === "ADVANCE"
    ? "PAYMENT RECEIPT & ADVANCE VOUCHER"
    : "FINAL PAYMENT RECEIPT";

  const docCategory = isGstRegistered
    ? `GST Registered Vendor • GSTIN: ${invoice.vendorGstin}`
    : "Vendor Unregistered Under GST • Commercial Payment Receipt";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CELEBRATING YOU", 14, 20);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(docTitle, 14, 28);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(docCategory, 14, 34);
      doc.setTextColor(0);

      doc.setDrawColor(220, 220, 220);
      doc.line(14, 38, 196, 38);

      doc.setFontSize(10);
      doc.text(`Document No: ${invoice.invoiceNumber}`, 14, 46);
      doc.text(`Payment Date: ${new Date(invoice.paymentDate).toLocaleDateString("en-IN")}`, 14, 52);
      doc.text(`Booking Ref: #${invoice.booking?.bookingCode || "N/A"}`, 14, 58);
      doc.text(`Transaction ID: ${invoice.transaction?.transactionRef || "N/A"}`, 14, 64);

      doc.line(14, 70, 196, 70);

      doc.setFont("helvetica", "bold");
      doc.text("FROM (VENDOR):", 14, 78);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.vendorBusinessName, 14, 84);
      doc.text(invoice.vendorAddress || "Bangalore, Karnataka", 14, 90);
      doc.text(`PAN: ${invoice.vendorPan || "N/A"}`, 14, 96);
      if (isGstRegistered) {
        doc.text(`GSTIN: ${invoice.vendorGstin}`, 14, 102);
      }

      doc.setFont("helvetica", "bold");
      doc.text("TO (CUSTOMER):", 110, 78);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.customerName, 110, 84);
      doc.text(invoice.customerEmail, 110, 90);
      doc.text(invoice.customerPhone, 110, 96);

      doc.line(14, 110, 196, 110);

      doc.setFont("helvetica", "bold");
      doc.text("Service & Deliverables", 14, 118);
      doc.text("Amount (INR)", 160, 118);

      doc.line(14, 122, 196, 122);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.serviceTitle, 14, 130);
      doc.text(`Tier: ${invoice.packageName || "Custom Package"}`, 14, 136);
      doc.text(formatINR(invoice.agreedServiceValue), 160, 130);

      doc.line(14, 144, 196, 144);

      doc.setFont("helvetica", "bold");
      doc.text("Total Agreed Service Value:", 110, 152);
      doc.text(formatINR(invoice.agreedServiceValue), 160, 152);

      doc.text(
        invoice.type === "ADVANCE" ? "Advance Deposit Received:" : "Final Balance Received:",
        110,
        160
      );
      doc.text(formatINR(invoice.amountPaidThisDoc), 160, 160);

      doc.setFont("helvetica", "normal");
      doc.text("Remaining Balance Due:", 110, 168);
      doc.text(formatINR(invoice.remainingBalanceDue), 160, 168);

      if (isGstRegistered) {
        doc.text("GST Included (18% Component):", 110, 176);
        doc.text(formatINR(invoice.taxAmount), 160, 176);
      } else {
        doc.text("GST Applicability:", 110, 176);
        doc.text("₹0 (Unregistered)", 160, 176);
      }

      doc.line(14, 184, 196, 184);
      doc.setFontSize(8.5);
      doc.setTextColor(100);
      doc.text("Payment confirmed electronically via Celebrating YOU Escrow Gateway.", 14, 192);
      if (isGstRegistered) {
        doc.text(
          "Tax Invoice issued under Section 31 of Central Goods and Services Tax Act, 2017.",
          14,
          198
        );
      } else {
        doc.text(
          "Supplier is not registered under GST. This document serves as a verified commercial payment receipt.",
          14,
          198
        );
      }

      doc.save(`${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/70 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-2xl w-full border border-stone-200 dark:border-dark-border shadow-2xl my-8 overflow-hidden text-stone-900 dark:text-dark-text-primary animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:my-0">
        {/* Top Operational Bar (Hidden in print) */}
        <div className="bg-stone-900 dark:bg-dark-elevated px-6 py-4 flex items-center justify-between text-white print:hidden border-b border-transparent dark:border-dark-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="font-semibold text-xs tracking-wide">
              {invoice.type === "ADVANCE" ? "Document 1: Advance Receipt" : "Document 2: Final Payment"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-800 dark:bg-dark-muted hover:bg-stone-700 dark:hover:bg-dark-border text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <Button
              onClick={handleDownloadPDF}
              size="sm"
              className="gap-1.5 shadow-sm text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 dark:hover:bg-dark-muted transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-6 text-stone-800 dark:text-dark-text-primary bg-white dark:bg-dark-surface print:bg-white print:text-black">
          {/* Top Brand Banner */}
          <div className="flex items-start justify-between border-b border-stone-200 dark:border-dark-border pb-6 print:border-stone-200">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-white print:text-black">
                Celebrating <span className="text-rose-700 dark:text-rose-400">YOU</span>
              </h1>
              <p className="text-xs font-semibold text-stone-800 dark:text-dark-text-primary mt-1 uppercase tracking-wide print:text-black">
                {docTitle}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary mt-0.5 print:text-stone-500">{docCategory}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 print:bg-white print:border-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Payment Verified
              </span>
              <p className="text-xs font-mono font-semibold text-stone-700 dark:text-dark-text-secondary mt-2 print:text-black">{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-warm-50 dark:bg-dark-elevated p-5 rounded-2xl border border-stone-200/80 dark:border-dark-border print:bg-white print:border-stone-200">
            <div>
              <p className="text-stone-500 dark:text-dark-text-secondary font-bold uppercase tracking-wider text-[10px]">Vendor Details</p>
              <p className="font-serif font-bold text-stone-900 dark:text-white text-sm mt-1 print:text-black">{invoice.vendorBusinessName}</p>
              <p className="text-stone-600 dark:text-dark-text-secondary mt-0.5 print:text-stone-700">
                {isGstRegistered ? `GSTIN: ${invoice.vendorGstin}` : "GST: Not Applicable (Unregistered)"}
              </p>
              <p className="text-stone-600 dark:text-dark-text-secondary print:text-stone-700">PAN: {invoice.vendorPan || "N/A"}</p>
              <p className="text-stone-600 dark:text-dark-text-secondary print:text-stone-700">{invoice.vendorAddress}</p>
            </div>

            <div>
              <p className="text-stone-500 dark:text-dark-text-secondary font-bold uppercase tracking-wider text-[10px]">Billed To (Host)</p>
              <p className="font-serif font-bold text-stone-900 dark:text-white text-sm mt-1 print:text-black">{invoice.customerName}</p>
              <p className="text-stone-600 dark:text-dark-text-secondary mt-0.5 print:text-stone-700">{invoice.customerPhone}</p>
              <p className="text-stone-600 dark:text-dark-text-secondary print:text-stone-700">{invoice.customerEmail}</p>
              {invoice.customerAddress && <p className="text-stone-600 dark:text-dark-text-secondary print:text-stone-700">{invoice.customerAddress}</p>}
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-3 gap-3 text-xs border border-stone-200 dark:border-dark-border rounded-xl p-3 bg-white dark:bg-dark-elevated print:bg-white">
            <div>
              <span className="text-stone-500 dark:text-dark-text-secondary block text-[10px] font-medium">Booking Code</span>
              <span className="font-mono font-bold text-rose-700 dark:text-rose-400">#{invoice.booking?.bookingCode || "N/A"}</span>
            </div>
            <div>
              <span className="text-stone-500 dark:text-dark-text-secondary block text-[10px] font-medium">Transaction ID</span>
              <span className="font-mono text-stone-900 dark:text-dark-text-primary font-semibold">{invoice.transaction?.transactionRef || "N/A"}</span>
            </div>
            <div>
              <span className="text-stone-500 dark:text-dark-text-secondary block text-[10px] font-medium">Payment Date</span>
              <span className="font-medium text-stone-900 dark:text-dark-text-primary">
                {new Date(invoice.paymentDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-stone-200 dark:border-dark-border rounded-xl overflow-hidden text-xs">
            <div className="bg-warm-100/70 dark:bg-dark-muted p-3 flex justify-between font-bold text-stone-800 dark:text-dark-text-primary text-[11px] uppercase tracking-wider">
              <span>Service & Package Deliverables</span>
              <span>Total Value</span>
            </div>
            <div className="p-4 flex justify-between items-center border-t border-stone-200 dark:border-dark-border">
              <div>
                <p className="font-semibold text-stone-900 dark:text-white text-sm">{invoice.serviceTitle}</p>
                <span className="text-[11px] text-stone-500 dark:text-dark-text-secondary">Tier: {invoice.packageName || "Standard Package"}</span>
              </div>
              <span className="font-bold text-stone-900 dark:text-white text-sm">{formatINR(invoice.agreedServiceValue)}</span>
            </div>
          </div>

          {/* Reconciled Financial Ledger */}
          <div className="border-t border-stone-200 dark:border-dark-border pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-dark-text-secondary">
              <span>Agreed Contract Service Value:</span>
              <span className="font-semibold text-stone-900 dark:text-white">{formatINR(invoice.agreedServiceValue)}</span>
            </div>

            {invoice.type === "FINAL" && (
              <div className="flex justify-between text-stone-600 dark:text-dark-text-secondary">
                <span>Advance Previously Confirmed (Doc 1):</span>
                <span className="font-semibold text-stone-900 dark:text-white">{formatINR(invoice.advancePaid)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-white pt-1 border-t border-stone-100 dark:border-dark-border">
              <span>
                {invoice.type === "ADVANCE"
                  ? "Advance Paid Under This Receipt:"
                  : "Final Balance Paid Under This Receipt:"}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatINR(invoice.amountPaidThisDoc)}</span>
            </div>

            <div className="flex justify-between text-stone-600 dark:text-dark-text-secondary pt-1">
              <span>Remaining Balance Due:</span>
              <span className="font-mono font-bold text-stone-800 dark:text-white">{formatINR(invoice.remainingBalanceDue)}</span>
            </div>

            <div className="flex justify-between text-stone-500 dark:text-dark-text-secondary text-[11px] pt-1 border-t border-stone-100 dark:border-dark-border">
              <span>
                {isGstRegistered ? "Applicable GST (18% Component):" : "GST Applicability:"}
              </span>
              <span className="font-mono">
                {isGstRegistered ? formatINR(invoice.taxAmount) : "₹0 (Vendor Unregistered)"}
              </span>
            </div>
          </div>

          {/* Footer & Disclaimer */}
          <div className="border-t border-stone-200 dark:border-dark-border pt-4 text-[10px] text-stone-500 dark:text-dark-text-secondary leading-relaxed">
            <p className="font-medium text-stone-600 dark:text-dark-text-primary">
              {isGstRegistered
                ? "Tax Invoice issued under Section 31 of Central Goods and Services Tax Act, 2017."
                : "The supplier is not registered under GST. This document serves as a verified commercial payment receipt and booking voucher."}
            </p>
            <p className="mt-1">
              Electronic payment cleared through Celebrating YOU Platform Gateway. Traceable by Transaction ID #{invoice.transaction?.transactionRef || invoice.id}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
