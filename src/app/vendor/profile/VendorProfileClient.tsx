"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Save,
  Lock,
  CreditCard,
  FileCheck,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function VendorProfileClient({ vendor: initialVendor }: { vendor: any }) {
  const router = useRouter();
  const [vendor, setVendor] = useState(initialVendor);
  const [formData, setFormData] = useState({
    businessName: vendor.businessName || "",
    contactPerson: vendor.contactPerson || "",
    phone: vendor.phone || "",
    city: vendor.city || "",
    state: vendor.state || "",
    pincode: vendor.pincode || "",
    serviceAreas: vendor.serviceAreas || "",
    gstin: vendor.gstin || "",
    panNumber: vendor.panNumber || "",
    bankAccountNumber: vendor.bankAccountNumber || "",
    bankIfsc: vendor.bankIfsc || "",
    bankName: vendor.bankName || "",
    accountHolderName: vendor.accountHolderName || "",
  });

  const [docType, setDocType] = useState("ID_PROOF");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setMessage("Business profile updated successfully!");
      setVendor(data.vendor);
      router.refresh();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docUrl) return;
    setUploadLoading(true);

    try {
      const res = await fetch("/api/vendor/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          documentName: docName,
          fileUrl: docUrl,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit document");
      }

      setDocName("");
      setDocUrl("");
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const isVerified = vendor.verificationStatus === "VERIFIED";

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      {/* Top Banner with Verification Badge */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-soft mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">
            Artisan Identity & Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            {vendor.businessName}
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Vendor Code: <strong className="text-stone-900 font-mono">{vendor.vendorCode}</strong> • Category:{" "}
            {vendor.category?.name}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-warm-50 border border-stone-200 text-xs">
          <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
            Verification Status
          </span>
          {isVerified ? (
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Verified & Active
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> {vendor.verificationStatus.replace(/_/g, " ")}
            </div>
          )}
          <span className="text-[11px] text-stone-500 mt-1 block">
            {isVerified ? "Authorized to publish services" : "Pending admin review of documents"}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl mb-6 text-xs font-semibold ${
            message.startsWith("Error")
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Business and Banking Details Forms */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-soft space-y-6 text-xs"
          >
            <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-700" /> Business Contact & Operations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Lead Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Business Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Service Coverage Areas</label>
                <input
                  type="text"
                  name="serviceAreas"
                  placeholder="e.g. Bangalore Urban, Koramangala, Indiranagar"
                  value={formData.serviceAreas}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>

            {/* GSTIN & Tax */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-base font-serif font-bold text-stone-900 mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-stone-700" /> Tax & Compliance Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">GSTIN Number (If Registered)</label>
                  <input
                    type="text"
                    name="gstin"
                    placeholder="29AABCU9603R1ZM"
                    value={formData.gstin}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Used for generating tax-compliant Advance & Final receipts
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    name="panNumber"
                    placeholder="AABCU9603R"
                    value={formData.panNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Payout Bank Details */}
            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-base font-serif font-bold text-stone-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-stone-700" /> Bank Details for Payout Disbursements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    placeholder="e.g. HDFC Bank / ICICI Bank"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="bankIfsc"
                    value={formData.bankIfsc}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="gap-2 shadow-soft"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Business Profile"}
            </Button>
          </form>
        </div>

        {/* RIGHT COLUMN: Verification Documents Upload & History */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-soft space-y-4 text-xs">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-700" /> Submit Compliance Documents
            </h3>
            <p className="text-stone-600 leading-relaxed">
              Upload official government identity, business registrations, or artisan portfolio credentials to unlock verified marketplace badges.
            </p>

            <form onSubmit={handleUploadDoc} className="space-y-3 pt-2">
              <div>
                <label className="font-semibold text-stone-800 block mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                >
                  <option value="ID_PROOF">Aadhaar / Voter ID (Identity Proof)</option>
                  <option value="BUSINESS_REGISTRATION">Shop & Establishment / MSME Certificate</option>
                  <option value="TAX_CERTIFICATE">GST Registration Certificate</option>
                  <option value="PORTFOLIO_PROOF">Artisan Award / Certification</option>
                  <option value="OTHER">Other Proof</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">Document Label / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST Certificate 2026"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">Document / Proof URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={uploadLoading}
                className="w-full justify-center shadow-soft"
              >
                {uploadLoading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          </div>

          {/* Uploaded Documents List */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-soft text-xs">
            <h3 className="font-serif font-bold text-stone-900 text-sm mb-3">Submitted Documents</h3>
            {vendor.documents.length === 0 ? (
              <p className="text-stone-500 py-4 text-center">No compliance documents submitted yet.</p>
            ) : (
              <div className="space-y-2.5">
                {vendor.documents.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-3 bg-warm-50 rounded-xl border border-stone-200/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-stone-900">{d.documentName}</p>
                      <span className="text-[10px] text-stone-500 font-mono">{d.documentType}</span>
                    </div>

                    <Badge
                      variant={
                        d.status === "APPROVED"
                          ? "success"
                          : d.status === "REJECTED"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
