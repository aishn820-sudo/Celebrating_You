"use client";

import { useRef } from "react";
import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
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

      doc.setFont("helvetica", "bold");
      doc.text("VENDOR DETAILS:", 14, 76);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.vendorBusinessName, 14, 82);
      doc.text(
        isGstRegistered ? `GSTIN: ${invoice.vendorGstin}` : "GST: Not Applicable (Unregistered)",
        14,
        88
      );
      doc.text(`PAN: ${invoice.vendorPan || "N/A"}`, 14, 94);
      doc.text(`Location: ${invoice.vendorAddress || "N/A"}`, 14, 100);

      doc.setFont("helvetica", "bold");
      doc.text("BILLED TO (HOST):", 120, 76);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.customerName, 120, 82);
      doc.text(`Phone: ${invoice.customerPhone}`, 120, 88);
      doc.text(`Email: ${invoice.customerEmail}`, 120, 94);
      if (invoice.customerAddress) {
        doc.text(`Address: ${invoice.customerAddress.slice(0, 32)}`, 120, 100);
      }

      doc.line(14, 106, 196, 106);

      doc.setFont("helvetica", "bold");
      doc.text("Milestone Deliverable / Service Description", 14, 114);
      doc.text("Amount (INR)", 160, 114);
      doc.line(14, 118, 196, 118);

      doc.setFont("helvetica", "normal");
      doc.text(`${invoice.serviceTitle} (${invoice.packageName || "Package"})`, 14, 126);
      doc.text(formatINR(invoice.agreedServiceValue), 160, 126);

      doc.line(14, 134, 196, 134);

      doc.text("Agreed Contract Service Value:", 110, 144);
      doc.text(formatINR(invoice.agreedServiceValue), 160, 144);

      if (invoice.type === "FINAL") {
        doc.text("Advance Previously Paid (Doc 1):", 110, 152);
        doc.text(formatINR(invoice.advancePaid), 160, 152);
      }

      doc.setFont("helvetica", "bold");
      doc.text(
        invoice.type === "ADVANCE"
          ? "Advance Amount Paid (This Receipt):"
          : "Final Balance Paid (This Receipt):",
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
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl my-8 overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:my-0">
        {/* Top Operational Bar (Hidden in print) */}
        <div className="bg-stone-900 px-6 py-4 flex items-center justify-between text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="font-semibold text-xs tracking-wide">
              {invoice.type === "ADVANCE" ? "Document 1: Advance Receipt" : "Document 2: Final Payment"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
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
              className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-6 text-stone-800 bg-white">
          {/* Top Brand Banner */}
          <div className="flex items-start justify-between border-b border-stone-200 pb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900">
                Celebrating <span className="text-rose-700">YOU</span>
              </h1>
              <p className="text-xs font-semibold text-stone-800 mt-1 uppercase tracking-wide">
                {docTitle}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">{docCategory}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment Verified
              </span>
              <p className="text-xs font-mono font-semibold text-stone-700 mt-2">{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-warm-50 p-5 rounded-2xl border border-stone-200/80">
            <div>
              <p className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">Vendor Details</p>
              <p className="font-serif font-bold text-stone-900 text-sm mt-1">{invoice.vendorBusinessName}</p>
              <p className="text-stone-600 mt-0.5">
                {isGstRegistered ? `GSTIN: ${invoice.vendorGstin}` : "GST: Not Applicable (Unregistered)"}
              </p>
              <p className="text-stone-600">PAN: {invoice.vendorPan || "N/A"}</p>
              <p className="text-stone-600">{invoice.vendorAddress}</p>
            </div>

            <div>
              <p className="text-stone-500 font-bold uppercase tracking-wider text-[10px]">Billed To (Host)</p>
              <p className="font-serif font-bold text-stone-900 text-sm mt-1">{invoice.customerName}</p>
              <p className="text-stone-600 mt-0.5">{invoice.customerPhone}</p>
              <p className="text-stone-600">{invoice.customerEmail}</p>
              {invoice.customerAddress && <p className="text-stone-600">{invoice.customerAddress}</p>}
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-3 gap-3 text-xs border border-stone-200 rounded-xl p-3 bg-white">
            <div>
              <span className="text-stone-500 block text-[10px] font-medium">Booking Code</span>
              <span className="font-mono font-bold text-rose-700">#{invoice.booking?.bookingCode || "N/A"}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] font-medium">Transaction ID</span>
              <span className="font-mono text-stone-900 font-semibold">{invoice.transaction?.transactionRef || "N/A"}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] font-medium">Payment Date</span>
              <span className="font-medium text-stone-900">
                {new Date(invoice.paymentDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-warm-100/70 p-3 flex justify-between font-bold text-stone-800 text-[11px] uppercase tracking-wider">
              <span>Service & Package Deliverables</span>
              <span>Total Value</span>
            </div>
            <div className="p-4 flex justify-between items-center border-t border-stone-200">
              <div>
                <p className="font-semibold text-stone-900 text-sm">{invoice.serviceTitle}</p>
                <span className="text-[11px] text-stone-500">Tier: {invoice.packageName || "Standard Package"}</span>
              </div>
              <span className="font-bold text-stone-900 text-sm">{formatINR(invoice.agreedServiceValue)}</span>
            </div>
          </div>

          {/* Reconciled Financial Ledger */}
          <div className="border-t border-stone-200 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Agreed Contract Service Value:</span>
              <span className="font-semibold text-stone-900">{formatINR(invoice.agreedServiceValue)}</span>
            </div>

            {invoice.type === "FINAL" && (
              <div className="flex justify-between text-stone-600">
                <span>Advance Previously Confirmed (Doc 1):</span>
                <span className="font-semibold text-stone-900">{formatINR(invoice.advancePaid)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-100">
              <span>
                {invoice.type === "ADVANCE"
                  ? "Advance Paid Under This Receipt:"
                  : "Final Balance Paid Under This Receipt:"}
              </span>
              <span className="text-emerald-700 font-bold">{formatINR(invoice.amountPaidThisDoc)}</span>
            </div>

            <div className="flex justify-between text-stone-600 pt-1">
              <span>Remaining Balance Due:</span>
              <span className="font-mono font-bold text-stone-800">{formatINR(invoice.remainingBalanceDue)}</span>
            </div>

            <div className="flex justify-between text-stone-500 text-[11px] pt-1 border-t border-stone-100">
              <span>
                {isGstRegistered ? "Applicable GST (18% Component):" : "GST Applicability:"}
              </span>
              <span className="font-mono">
                {isGstRegistered ? formatINR(invoice.taxAmount) : "₹0 (Vendor Unregistered)"}
              </span>
            </div>
          </div>

          {/* Footer & Disclaimer */}
          <div className="border-t border-stone-200 pt-4 text-[10px] text-stone-500 leading-relaxed">
            <p className="font-medium text-stone-600">
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
