"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Search,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  X,
  AlertCircle,
  Clock,
  Star,
  ExternalLink,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AdminVendorsClient({
  initialVendors,
  categories,
}: {
  initialVendors: any[];
  categories: any[];
}) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initialVendors);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingVendor, setInspectingVendor] = useState<any>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite state
  const [inviteData, setInviteData] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    categoryId: categories[0]?.id || "",
    city: "Bangalore",
    state: "Karnataka",
    temporaryPassword: "Welcome@CY2026",
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [commissionRate, setCommissionRate] = useState(10);

  const filteredVendors = vendors.filter((v) => {
    if (statusFilter !== "ALL" && v.verificationStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = v.businessName.toLowerCase().includes(q);
      const matchCode = v.vendorCode.toLowerCase().includes(q);
      const matchEmail = v.email.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchEmail) return false;
    }
    return true;
  });

  const handleAction = async (action: string) => {
    if (!inspectingVendor) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: inspectingVendor.id,
          action,
          remarks,
          commissionRate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setInspectingVendor(null);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg("");

    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create vendor");

      setInviteMsg(`Vendor account created with temporary password "${inviteData.temporaryPassword}"!`);
      setTimeout(() => {
        setIsInviteOpen(false);
        router.refresh();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setInviteMsg(`Error: ${err.message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-700">
            Artisan Network Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Vendor Verification & KYC
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Review uploaded compliance credentials, enforce publishing privileges, and onboard verified vendors.
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="gap-2 shadow-soft"
        >
          <UserPlus className="w-4 h-4" /> Onboard Vendor
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-stone-200/90 dark:border-dark-border shadow-soft mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition-colors">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { label: "All Vendors", val: "ALL" },
            { label: "Pending Verification", val: "PENDING" },
            { label: "Verified & Active", val: "VERIFIED" },
            { label: "Info Required", val: "INFO_REQUIRED" },
            { label: "Suspended", val: "SUSPENDED" },
            { label: "Rejected", val: "REJECTED" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                statusFilter === tab.val
                  ? "bg-rose-700 text-white shadow-sm"
                  : "bg-warm-100 dark:bg-dark-elevated text-stone-700 dark:text-stone-300 hover:bg-warm-200 dark:hover:bg-dark-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search vendor name, code, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-warm-50 dark:bg-dark-elevated border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary text-xs placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white dark:bg-dark-surface rounded-3xl border border-stone-200/90 dark:border-dark-border shadow-soft overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-700 dark:text-stone-300">
            <thead className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-warm-50/70 dark:bg-dark-elevated border-b border-stone-200 dark:border-dark-border">
              <tr>
                <th className="py-4 px-6 font-semibold">Vendor Code / Name</th>
                <th className="py-4 px-4 font-semibold">Category</th>
                <th className="py-4 px-4 font-semibold">Contact</th>
                <th className="py-4 px-4 font-semibold">GSTIN</th>
                <th className="py-4 px-4 font-semibold">Status</th>
                <th className="py-4 px-4 font-semibold">Services</th>
                <th className="py-4 px-4 font-semibold">Commission</th>
                <th className="py-4 px-6 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-dark-border">
              {filteredVendors.map((v) => (
                <tr key={v.id} className="hover:bg-warm-50/60 dark:hover:bg-dark-elevated/60 transition">
                  <td className="py-4 px-6">
                    <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400 block font-semibold">{v.vendorCode}</span>
                    <strong className="text-stone-900 dark:text-dark-text-primary text-sm">{v.businessName}</strong>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                      {v.city}, {v.state}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-warm-100 dark:bg-dark-elevated text-stone-800 dark:text-stone-200">
                      {v.category.name}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-stone-900 dark:text-dark-text-primary">{v.contactPerson}</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">{v.phone}</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">{v.email}</p>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px]">
                    {v.gstin || <span className="text-stone-400 dark:text-stone-500">Unregistered</span>}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        v.verificationStatus === "VERIFIED"
                          ? "success"
                          : v.verificationStatus === "PENDING"
                          ? "warning"
                          : v.verificationStatus === "SUSPENDED" || v.verificationStatus === "REJECTED"
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {v.verificationStatus.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-stone-900 dark:text-dark-text-primary">{v.services.length}</span> listings
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-stone-900 dark:text-dark-text-primary">
                    {v.commissionRate || 10}%
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setInspectingVendor(v);
                        setCommissionRate(v.commissionRate || 10);
                        setRemarks("");
                      }}
                      className="px-3.5 py-1.5 bg-warm-100 dark:bg-dark-elevated hover:bg-warm-200 dark:hover:bg-dark-border text-stone-800 dark:text-dark-text-primary rounded-xl font-semibold text-xs transition"
                    >
                      Inspect & Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT VENDOR MODAL */}
      {inspectingVendor && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-stone-200 dark:border-dark-border shadow-2xl my-8 text-xs text-stone-800 dark:text-dark-text-primary animate-in fade-in zoom-in-95 duration-150 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-5">
              <div>
                <span className="font-mono text-stone-500 dark:text-stone-400 text-[10px] font-semibold">{inspectingVendor.vendorCode}</span>
                <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-xl">{inspectingVendor.businessName}</h3>
              </div>
              <button
                onClick={() => setInspectingVendor(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-dark-elevated transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vendor Overview Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-warm-50 dark:bg-dark-elevated rounded-2xl border border-stone-200 dark:border-dark-border mb-5 transition-colors">
              <div>
                <span className="text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] block">Contact Person</span>
                <span className="font-semibold text-stone-900 dark:text-dark-text-primary text-sm">{inspectingVendor.contactPerson}</span>
                <p className="text-stone-600 dark:text-stone-400">{inspectingVendor.phone}</p>
                <p className="text-stone-500 dark:text-stone-400 text-[11px]">{inspectingVendor.email}</p>
              </div>

              <div>
                <span className="text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] block">Location & Areas</span>
                <span className="font-semibold text-stone-900 dark:text-dark-text-primary">{inspectingVendor.city}, {inspectingVendor.state}</span>
                <p className="text-stone-600 dark:text-stone-400">{inspectingVendor.serviceAreas || "Local area"}</p>
              </div>

              <div>
                <span className="text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] block">GSTIN / PAN</span>
                <span className="font-mono text-stone-900 dark:text-dark-text-primary">{inspectingVendor.gstin || "Unregistered"}</span>
                <p className="font-mono text-stone-500 dark:text-stone-400 text-[11px]">PAN: {inspectingVendor.panNumber || "N/A"}</p>
              </div>

              <div>
                <span className="text-stone-500 dark:text-stone-400 uppercase font-bold text-[10px] block">Bank Account</span>
                <span className="font-mono text-stone-900 dark:text-dark-text-primary">
                  {inspectingVendor.bankAccountNumber ? `•••• •••• ${inspectingVendor.bankAccountNumber.slice(-4)}` : "Not Submitted"}
                </span>
                <p className="font-mono text-stone-500 dark:text-stone-400 text-[11px]">{inspectingVendor.bankIfsc || "N/A"}</p>
              </div>
            </div>

            {/* Submitted Documents Checklist */}
            <div className="mb-5">
              <span className="text-stone-700 dark:text-stone-300 font-semibold block mb-2 uppercase text-[10px] tracking-wider">
                Submitted Compliance Documents ({inspectingVendor.documents?.length || 0})
              </span>
              {inspectingVendor.documents?.length === 0 ? (
                <p className="p-4 bg-warm-50 dark:bg-dark-elevated rounded-2xl text-stone-500 dark:text-stone-400 text-center border border-stone-200 dark:border-dark-border">
                  No compliance documents submitted by vendor yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {inspectingVendor.documents.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-3 bg-warm-50 dark:bg-dark-elevated rounded-xl border border-stone-200 dark:border-dark-border flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-dark-text-primary">{d.documentName}</p>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">{d.documentType}</span>
                      </div>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-dark-surface hover:bg-stone-50 dark:hover:bg-dark-border text-rose-700 dark:text-rose-400 border border-stone-200 dark:border-dark-border rounded-lg font-semibold text-[11px] shadow-xs"
                      >
                        Inspect Proof <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Decision Actions */}
            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-dark-border">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Administrative Remarks</label>
                <input
                  type="text"
                  placeholder="Reason for approval / rejection / additional info..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Assigned Commission Rate (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => handleAction("APPROVE")}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-soft"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Verify
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAction("REQUEST_INFO")}
                  disabled={actionLoading}
                  className="text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" /> Request Info
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleAction("SUSPEND")}
                  disabled={actionLoading}
                  className="gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Suspend
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE VENDOR MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 dark:border-dark-border shadow-2xl text-xs text-stone-800 dark:text-dark-text-primary my-8 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-5">
              <div>
                <h3 className="font-serif font-bold text-stone-900 dark:text-dark-text-primary text-lg">Onboard Vendor Account</h3>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">Provision a new artisan profile with temporary credentials</p>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-dark-elevated transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteMsg && (
              <div
                className={`p-3.5 rounded-xl mb-4 font-medium ${
                  inviteMsg.startsWith("Error") ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                }`}
              >
                {inviteMsg}
              </div>
            )}

            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Blooms Floral Stylings"
                  value={inviteData.businessName}
                  onChange={(e) => setInviteData({ ...inviteData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Contact lead"
                    value={inviteData.contactPerson}
                    onChange={(e) => setInviteData({ ...inviteData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Vendor Category</label>
                  <select
                    value={inviteData.categoryId}
                    onChange={(e) => setInviteData({ ...inviteData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="artisan@business.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={inviteData.phone}
                    onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={inviteData.city}
                    onChange={(e) => setInviteData({ ...inviteData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={inviteData.temporaryPassword}
                    onChange={(e) => setInviteData({ ...inviteData, temporaryPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={inviteLoading}
                className="w-full justify-center py-3 shadow-soft"
              >
                {inviteLoading ? "Onboarding Vendor..." : "Create Artisan Account"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
