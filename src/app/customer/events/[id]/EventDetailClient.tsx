"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Check,
  ArrowLeft,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Lock,
  Phone,
  Mail,
  Camera,
  Upload,
  Star,
  Image as ImageIcon,
  Tag,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

// Suggestion helpers based on occasion
const OCCASION_SUGGESTED_SERVICES: Record<string, { title: string; categorySlug: string; icon: string; reason: string }[]> = {
  Birthday: [
    { title: "Custom Theme Cake", categorySlug: "bakeries-cloud-kitchens", icon: "🎂", reason: "Milestone celebration cake customized to your theme" },
    { title: "Candid Photography", categorySlug: "photography-editing", icon: "📷", reason: "Capture cake cutting and moments with friends & family" },
    { title: "Balloon & Stage Styling", categorySlug: "decoration-services", icon: "🎨", reason: "Create an inviting entrance arch and birthday stage" },
  ],
  Wedding: [
    { title: "Mandap & Floral Décor", categorySlug: "decoration-services", icon: "🌺", reason: "Traditional floral styling for ceremonies" },
    { title: "Cinematography & Candid", categorySlug: "photography-editing", icon: "🎥", reason: "Cinematic film and album coverage" },
    { title: "Grand Banquet Catering", categorySlug: "catering-services", icon: "🍽️", reason: "Multi-cuisine buffet & live counters" },
    { title: "Bridal Makeup Artist", categorySlug: "makeup-beauty", icon: "💄", reason: "Professional styling for ceremonies" },
  ],
  Anniversary: [
    { title: "Romantic Candlelight Dining", categorySlug: "catering-services", icon: "🥂", reason: "Curated multi-course dinner spread" },
    { title: "Acoustic Live Music", categorySlug: "music-entertainment", icon: "🎵", reason: "Soothing live acoustic singer or guitarist" },
    { title: "Memory Portrait Film", categorySlug: "photography-editing", icon: "📷", reason: "Candid anniversary portrait session" },
  ],
};

const DEFAULT_SUGGESTIONS = [
  { title: "Candid Photography", categorySlug: "photography-editing", icon: "📷", reason: "Preserve every special memory" },
  { title: "Celebration Décor", categorySlug: "decoration-services", icon: "🎨", reason: "Set the mood for your celebration" },
  { title: "Catering & Dining", categorySlug: "catering-services", icon: "🍽️", reason: "Delight your guests with delicious spreads" },
];

export default function EventDetailClient({ event: initialEvent }: { event: any }) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "checklist" | "updates" | "memories">("overview");

  // Checklist state
  const [newCheckpointTitle, setNewCheckpointTitle] = useState("");
  const [newCheckpointDate, setNewCheckpointDate] = useState("");
  const [addingCheckpoint, setAddingCheckpoint] = useState(false);
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);
  const [editingCheckpointTitle, setEditingCheckpointTitle] = useState("");
  const [editingCheckpointDate, setEditingCheckpointDate] = useState("");

  // Services accordion
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [payingBooking, setPayingBooking] = useState<any>(null);
  const [payingLoading, setPayingLoading] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState("");

  // Memories state
  const [memories, setMemories] = useState<any[]>(initialEvent.memories || []);
  const [uploadingMemory, setUploadingMemory] = useState(false);
  const [memoryCaption, setMemoryCaption] = useState("");
  const [memoryCategory, setMemoryCategory] = useState("MOMENTS");
  const [memoryHighlight, setMemoryHighlight] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [activeMemoryFilter, setActiveMemoryFilter] = useState("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Event Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: initialEvent.title || "",
    guestCount: initialEvent.guestCount || 50,
    overallBudget: Math.round((initialEvent.overallBudget || 5000000) / 100),
    notes: initialEvent.notes || "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  const daysLeft = Math.ceil(
    (new Date(event.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // 1. Checklist Handlers
  const toggleCheckpoint = async (cpId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";

    // Optimistic update
    setEvent((prev: any) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((c: any) =>
        c.id === cpId ? { ...c, status: nextStatus } : c
      ),
    }));

    try {
      await fetch(`/api/customer/events/${event.id}/checkpoints`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkpointId: cpId, status: nextStatus }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpointTitle.trim()) return;

    setAddingCheckpoint(true);
    try {
      const res = await fetch(`/api/customer/events/${event.id}/checkpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCheckpointTitle.trim(),
          targetDate: newCheckpointDate || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.checkpoint) {
        setNewCheckpointTitle("");
        setNewCheckpointDate("");
        setEvent((prev: any) => ({
          ...prev,
          checkpoints: [...prev.checkpoints, data.checkpoint],
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCheckpoint(false);
    }
  };

  const handleSaveEditCheckpoint = async (cpId: string) => {
    if (!editingCheckpointTitle.trim()) return;

    try {
      const res = await fetch(`/api/customer/events/${event.id}/checkpoints`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointId: cpId,
          title: editingCheckpointTitle.trim(),
          targetDate: editingCheckpointDate || null,
        }),
      });

      if (res.ok) {
        setEvent((prev: any) => ({
          ...prev,
          checkpoints: prev.checkpoints.map((c: any) =>
            c.id === cpId
              ? { ...c, title: editingCheckpointTitle.trim(), targetDate: editingCheckpointDate || null }
              : c
          ),
        }));
        setEditingCheckpointId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCheckpoint = async (cpId: string) => {
    try {
      const res = await fetch(`/api/customer/events/${event.id}/checkpoints?checkpointId=${cpId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEvent((prev: any) => ({
          ...prev,
          checkpoints: prev.checkpoints.filter((c: any) => c.id !== cpId),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Advance Payment & Contact Unlock
  const executeAdvancePayment = async () => {
    if (!payingBooking) return;
    setPayingLoading(true);
    setPaySuccessMsg("");

    try {
      const res = await fetch("/api/customer/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: payingBooking.id,
          type: "ADVANCE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setPaySuccessMsg("Advance payment received! Vendor direct contact details unlocked.");
      setEvent((prev: any) => ({
        ...prev,
        bookings: prev.bookings.map((bk: any) =>
          bk.id === payingBooking.id
            ? {
                ...bk,
                status: "CONFIRMED",
                advancePaid: bk.advanceRequired,
                isVendorContactRevealed: true,
                vendor: {
                  ...bk.vendor,
                  phone: bk.vendor?.phone?.includes("🔒") ? "+91 98765 43210" : bk.vendor?.phone,
                  email: bk.vendor?.email?.includes("🔒") ? "contact@vendor.com" : bk.vendor?.email,
                },
              }
            : bk
        ),
      }));

      setTimeout(() => {
        setPayingBooking(null);
        setPaySuccessMsg("");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Payment could not be processed");
    } finally {
      setPayingLoading(false);
    }
  };

  // 2. Memories Handlers
  const handleUploadMemory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMemory(true);
    try {
      // Step A: Upload to Cloudinary / media endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `celebrating_you/events/${event.id}`);

      const uploadRes = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Failed to upload image");
      }

      // Step B: Save memory record to DB
      const memoryRes = await fetch(`/api/customer/events/${event.id}/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          publicId: uploadData.publicId,
          caption: memoryCaption || "Celebration Memory",
          category: memoryCategory,
          highlight: memoryHighlight,
        }),
      });

      const memoryData = await memoryRes.json();
      if (!memoryRes.ok) {
        throw new Error(memoryData.error || "Failed to save memory");
      }

      setMemories((prev) => [memoryData.memory, ...prev]);
      setMemoryCaption("");
      setMemoryHighlight(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      alert(err.message || "Could not upload memory");
    } finally {
      setUploadingMemory(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm("Remove this photo from your celebration memories?")) return;

    try {
      const res = await fetch(`/api/customer/events/${event.id}/memories?memoryId=${memoryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
        if (selectedPhotoPreview) setSelectedPhotoPreview(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHighlight = async (memory: any) => {
    const nextHighlight = !memory.highlight;
    setMemories((prev) =>
      prev.map((m) => (m.id === memory.id ? { ...m, highlight: nextHighlight } : m))
    );

    try {
      await fetch(`/api/customer/events/${event.id}/memories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoryId: memory.id,
          highlight: nextHighlight,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Edit & Delete Event
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setActionError("");

    try {
      const res = await fetch(`/api/customer/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editFormData.title,
          guestCount: Number(editFormData.guestCount),
          overallBudget: Number(editFormData.overallBudget) * 100,
          notes: editFormData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update celebration");
      }

      setEvent((prev: any) => ({
        ...prev,
        title: editFormData.title,
        guestCount: Number(editFormData.guestCount),
        overallBudget: Number(editFormData.overallBudget) * 100,
        notes: editFormData.notes,
      }));
      setIsEditModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    setActionError("");

    try {
      const res = await fetch(`/api/customer/events/${event.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete celebration");
      }

      router.push("/customer/events");
      router.refresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const suggestedCheckpoints = event.checkpoints.filter((c: any) => !c.isCustom);
  const customCheckpoints = event.checkpoints.filter((c: any) => c.isCustom);
  const completedCount = event.checkpoints.filter((c: any) => c.status === "COMPLETED").length;
  const progressPercent =
    event.checkpoints.length > 0 ? Math.round((completedCount / event.checkpoints.length) * 100) : 0;

  const occasionSuggestions = OCCASION_SUGGESTED_SERVICES[event.eventType] || DEFAULT_SUGGESTIONS;

  const filteredMemories = memories.filter((m) => {
    if (activeMemoryFilter === "ALL") return true;
    if (activeMemoryFilter === "HIGHLIGHTS") return m.highlight;
    return m.category === activeMemoryFilter;
  });

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-dark-bg flex flex-col font-sans text-stone-800 dark:text-dark-text-primary transition-colors duration-200">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Navigation Breadcrumb */}
        <Link
          href="/customer/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-dark-text-secondary hover:text-stone-900 dark:hover:text-dark-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Celebrations
        </Link>

        {/* Celebration Header */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-dark-border shadow-soft mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100 dark:border-dark-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="champagne" size="sm">
                  {event.eventType}
                </Badge>
                {daysLeft >= 0 && (
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full">
                    {daysLeft === 0 ? "Celebrating Today!" : `${daysLeft} days to celebration`}
                  </span>
                )}
                <Badge
                  variant={event.status === "COMPLETED" ? "success" : "neutral"}
                  size="sm"
                  dot
                >
                  {event.status}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-dark-text-secondary mt-3">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                  {new Date(event.eventDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at {event.eventTime || "18:00"}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-stone-500 dark:text-dark-text-secondary">
                  <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  {event.locationAddress}, {event.city}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-stone-500 dark:text-dark-text-secondary">
                  <Users className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  ~{event.guestCount} Guests
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError("");
                  setIsEditModalOpen(true);
                }}
              >
                Edit Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => {
                  setActionError("");
                  setIsDeleteModalOpen(true);
                }}
              >
                Delete Celebration
              </Button>
              <Link href={`/explore?city=${encodeURIComponent(event.city)}`}>
                <Button variant="primary" size="sm">
                  Add Service
                </Button>
              </Link>
            </div>
          </div>

          {/* 5-Tab Navigation Pill Bar */}
          <div className="pt-6 flex flex-wrap gap-2 sm:gap-3">
            {[
              { id: "overview", label: "Overview", count: null },
              { id: "services", label: "My Services", count: event.bookings.length },
              { id: "checklist", label: "Planning Checklist", count: `${completedCount}/${event.checkpoints.length}` },
              { id: "updates", label: "Updates", count: null },
              { id: "memories", label: "Memories", count: memories.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-rose-700 text-white shadow-sm"
                      : "bg-stone-100 dark:bg-dark-elevated text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event Progress Summary */}
              <Card className="p-6">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                  Planning Progress
                </span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary">
                    {progressPercent}%
                  </span>
                  <span className="text-xs font-medium text-stone-500 dark:text-dark-text-secondary">
                    {completedCount} of {event.checkpoints.length} done
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-dark-border rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-rose-700 dark:bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-3">
                  Check off preparation tasks to keep your celebration running smoothly.
                </p>
              </Card>

              {/* Booked Services Card */}
              <Card className="p-6">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                  Booked Services
                </span>
                <span className="text-3xl font-serif font-bold text-stone-900 dark:text-dark-text-primary mt-3 block">
                  {event.bookings.length}
                </span>
                <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-2">
                  Independent vendor contracts operating under your celebration.
                </p>
                <button
                  onClick={() => setActiveTab("services")}
                  className="mt-4 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800"
                >
                  View Contracts & Contacts
                </button>
              </Card>

              {/* Memories Gallery Card */}
              <Card className="p-6">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                  Preserved Memories
                </span>
                <span className="text-3xl font-serif font-bold text-rose-700 dark:text-rose-400 mt-3 block">
                  {memories.length} Photos
                </span>
                <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-2">
                  Capture and cherish key photographs from this celebration in one private gallery.
                </p>
                <button
                  onClick={() => setActiveTab("memories")}
                  className="mt-4 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800"
                >
                  Open Memories Gallery
                </button>
              </Card>
            </div>

            {/* Celebration Vision & Notes */}
            {event.notes && (
              <Card className="p-6">
                <CardTitle className="text-sm mb-2">Celebration Notes & Special Preferences</CardTitle>
                <p className="text-xs text-stone-600 dark:text-dark-text-secondary leading-relaxed bg-warm-50 dark:bg-dark-elevated p-4 rounded-xl border border-stone-200/80 dark:border-dark-border">
                  {event.notes}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: MY SERVICES & VENDOR CONTRACTS */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-dark-border gap-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-dark-text-primary">
                  My Services & Vendor Contracts
                </h3>
                <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                  Each vendor contract is managed independently. Contact details unlock once the advance deposit is confirmed.
                </p>
              </div>
              <Link href={`/explore?city=${encodeURIComponent(event.city)}`}>
                <Button variant="primary" size="sm">
                  Add Service
                </Button>
              </Link>
            </div>

            {event.bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                <h4 className="font-bold text-stone-800 dark:text-dark-text-primary text-sm">
                  No services booked for this celebration yet
                </h4>
                <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-1 max-w-md mx-auto">
                  Discover verified photographers, caterers, bakers and decorators tailored to your celebration.
                </p>
                <Link href={`/explore?city=${encodeURIComponent(event.city)}`} className="inline-block mt-4">
                  <Button variant="primary" size="sm">
                    Explore Services
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {event.bookings.map((b: any) => {
                  const isExpanded = expandedBookingId === b.id;
                  const hasAdvancePaid = b.advancePaid > 0;
                  const isContactUnlocked = b.isVendorContactRevealed;

                  return (
                    <Card key={b.id} className="overflow-hidden">
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono font-bold text-stone-400 dark:text-stone-500">
                              #{b.bookingCode}
                            </span>
                            <Badge
                              variant={
                                b.status === "CONFIRMED" || b.status === "COMPLETED"
                                  ? "success"
                                  : b.status === "ACCEPTED_AWAITING_ADVANCE"
                                  ? "warning"
                                  : b.status === "DECLINED" || b.status === "EXPIRED"
                                  ? "danger"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              {b.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <h4 className="text-base font-bold text-stone-900 dark:text-dark-text-primary">
                            {b.service?.title || "Event Service"}
                          </h4>
                          <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                            Vendor: <strong>{b.vendor?.businessName}</strong> • {b.service?.category?.name}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                          <div className="text-left sm:text-right">
                            <span className="font-bold text-stone-900 dark:text-dark-text-primary block font-mono">
                              {formatPrice(b.agreedServiceValue)}
                            </span>
                            <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary block">
                              Advance: {formatPrice(b.advancePaid)} | Balance: {formatPrice(b.finalBalanceDue || 0)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isContactUnlocked && !hasAdvancePaid && !["CANCELLED", "DECLINED", "EXPIRED"].includes(b.status) && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setPayingBooking(b)}
                              >
                                Pay Advance & Unlock Contact
                              </Button>
                            )}

                            <button
                              onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-dark-text-primary rounded-xl border border-stone-200 dark:border-dark-border"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <Link href={`/customer/bookings/${b.id}`}>
                              <Button variant="secondary" size="sm">
                                View Contract
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Vendor Contact Verification Details */}
                      <div className="px-5 py-3.5 bg-warm-50/70 dark:bg-dark-elevated/50 border-t border-stone-100 dark:border-dark-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isContactUnlocked ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                Vendor Contact Unlocked:
                              </span>
                              <span className="text-stone-700 dark:text-stone-300 font-mono">
                                {b.vendor?.phone}
                              </span>
                              <span className="text-stone-400">•</span>
                              <span className="text-stone-700 dark:text-stone-300">
                                {b.vendor?.email}
                              </span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-stone-400" />
                              <span className="text-stone-500 dark:text-dark-text-secondary">
                                Vendor contact details unlock upon advance payment confirmation.
                              </span>
                            </>
                          )}
                        </div>

                        {/* Invoices */}
                        {b.invoices && b.invoices.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-stone-500">Receipts:</span>
                            {b.invoices.map((inv: any) => (
                              <Link
                                key={inv.id}
                                href="/customer/invoices"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:border-rose-300"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {inv.type === "ADVANCE" ? "Doc 1 (Advance)" : "Doc 2 (Final)"}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expandable Lifecycle Timeline */}
                      {isExpanded && (
                        <div className="p-5 bg-warm-50/40 dark:bg-dark-elevated/30 border-t border-stone-100 dark:border-dark-border text-xs">
                          <h5 className="font-bold text-stone-800 dark:text-dark-text-primary text-[11px] uppercase tracking-wider mb-3">
                            Contract Milestone Timeline
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">✓ 1. Requested</span>
                              <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">Requirements sent</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                                {b.status === "REQUEST_SUBMITTED" ? "⏳ 2. Response Pending" : "✓ 2. Accepted"}
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">2-hr response window</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                              <span className={`text-[10px] font-bold block ${hasAdvancePaid ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                                {hasAdvancePaid ? "✓ 3. Advance Cleared" : "⏳ 3. Advance Pending"}
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">Contact unlocked</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-stone-200 dark:border-dark-border">
                              <span className={`text-[10px] font-bold block ${b.finalPaid > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400 dark:text-stone-500"}`}>
                                {b.finalPaid > 0 ? "✓ 4. Final Cleared" : "⏳ 4. Final Balance"}
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-dark-text-secondary">Tax invoice issued</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLANNING CHECKLIST */}
        {activeTab === "checklist" && (
          <div className="space-y-8">
            {/* 3.1 Suggested Checkpoints */}
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-4">
                <div>
                  <CardTitle className="text-base">Suggested Checkpoints</CardTitle>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                    Tailored preparation milestones for your {event.eventType} celebration.
                  </p>
                </div>
                <Badge variant="rose" size="sm">
                  {suggestedCheckpoints.filter((c: any) => c.status === "COMPLETED").length}/{suggestedCheckpoints.length} Done
                </Badge>
              </div>

              <div className="space-y-2.5">
                {suggestedCheckpoints.map((cp: any) => {
                  const isDone = cp.status === "COMPLETED";
                  return (
                    <div
                      key={cp.id}
                      onClick={() => toggleCheckpoint(cp.id, cp.status)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40"
                          : "bg-white dark:bg-dark-surface border-stone-200 dark:border-dark-border hover:border-stone-300 dark:hover:border-stone-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isDone ? "bg-emerald-700 text-white" : "border-2 border-stone-300 dark:border-stone-600"
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs font-semibold ${isDone ? "line-through text-stone-400" : "text-stone-900 dark:text-dark-text-primary"}`}>
                          {cp.title}
                        </span>
                      </div>
                      <Badge variant={isDone ? "success" : "neutral"} size="sm">
                        {isDone ? "Done" : "Pending"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 3.2 Contextual Service Suggestions */}
            <Card className="p-6">
              <div className="mb-4">
                <CardTitle className="text-base">Complementary Services for Your Celebration</CardTitle>
                <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                  Frequently booked alongside your selected services. Browse verified vendors anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {occasionSuggestions.map((sug) => (
                  <div
                    key={sug.categorySlug}
                    className="p-4 rounded-xl border border-stone-200 dark:border-dark-border bg-warm-50/40 dark:bg-dark-elevated/40 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-2xl p-2 bg-white dark:bg-dark-surface rounded-xl border border-stone-100 dark:border-dark-border inline-block mb-3">
                        {sug.icon}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-dark-text-primary">
                        {sug.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary mt-1 leading-relaxed">
                        {sug.reason}
                      </p>
                    </div>
                    <Link
                      href={`/explore?category=${sug.categorySlug}&city=${encodeURIComponent(event.city)}`}
                      className="mt-4"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Explore Vendors
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3.3 Custom Checklist Tasks */}
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border mb-4">
                <div>
                  <CardTitle className="text-base">Custom Celebration Tasks</CardTitle>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                    Add your personal tasks, due dates, and reminders.
                  </p>
                </div>
                <Badge variant="neutral" size="sm">
                  {customCheckpoints.filter((c: any) => c.status === "COMPLETED").length}/{customCheckpoints.length} Done
                </Badge>
              </div>

              {/* Task list */}
              <div className="space-y-2.5 mb-6">
                {customCheckpoints.length === 0 ? (
                  <p className="text-xs text-stone-400 py-3 text-center">
                    No custom tasks added yet. Create one below to stay organized!
                  </p>
                ) : (
                  customCheckpoints.map((cp: any) => {
                    const isDone = cp.status === "COMPLETED";
                    const isEditing = editingCheckpointId === cp.id;

                    if (isEditing) {
                      return (
                        <div
                          key={cp.id}
                          className="p-3 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 flex flex-col sm:flex-row gap-2"
                        >
                          <input
                            type="text"
                            value={editingCheckpointTitle}
                            onChange={(e) => setEditingCheckpointTitle(e.target.value)}
                            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-surface text-stone-900 dark:text-dark-text-primary"
                          />
                          <input
                            type="date"
                            value={editingCheckpointDate}
                            onChange={(e) => setEditingCheckpointDate(e.target.value)}
                            className="text-xs px-2 py-1.5 rounded-lg border border-stone-300 dark:border-dark-border bg-white dark:bg-dark-surface text-stone-900 dark:text-dark-text-primary"
                          />
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="primary" onClick={() => handleSaveEditCheckpoint(cp.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCheckpointId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cp.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                          isDone
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40"
                            : "bg-white dark:bg-dark-surface border-stone-200 dark:border-dark-border hover:border-stone-300 dark:hover:border-stone-600"
                        }`}
                      >
                        <div
                          onClick={() => toggleCheckpoint(cp.id, cp.status)}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                              isDone ? "bg-emerald-700 text-white" : "border-2 border-stone-300 dark:border-stone-600"
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className={`text-xs font-semibold ${isDone ? "line-through text-stone-400" : "text-stone-900 dark:text-dark-text-primary"}`}>
                              {cp.title}
                            </span>
                            {cp.targetDate && (
                              <span className="block text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                                Due: {cp.targetDate}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCheckpointId(cp.id);
                              setEditingCheckpointTitle(cp.title);
                              setEditingCheckpointDate(cp.targetDate || "");
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCheckpoint(cp.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Custom Task Form */}
              <form onSubmit={handleAddCustomCheckpoint} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-stone-100 dark:border-dark-border">
                <input
                  type="text"
                  value={newCheckpointTitle}
                  onChange={(e) => setNewCheckpointTitle(e.target.value)}
                  placeholder="Task title (e.g. Call bakery to confirm flower color, share guest count with venue...)"
                  className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-stone-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-warm-50/50 dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                />
                <input
                  type="date"
                  value={newCheckpointDate}
                  onChange={(e) => setNewCheckpointDate(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-dark-border bg-warm-50/50 dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                />
                <Button variant="secondary" size="sm" isLoading={addingCheckpoint} type="submit">
                  Add Task
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* TAB 4: UPDATES */}
        {activeTab === "updates" && (
          <div className="space-y-6">
            <Card className="p-6">
              <CardTitle className="text-base mb-4">Celebration Timeline & Alerts</CardTitle>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-dark-border bg-warm-50/40 dark:bg-dark-elevated/40 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-stone-900 dark:text-dark-text-primary">
                      Celebration Event Created
                    </h5>
                    <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary mt-0.5">
                      {event.title} organized for {new Date(event.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
                    </p>
                  </div>
                </div>

                {event.bookings.map((b: any) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-surface flex items-start gap-3"
                  >
                    <Clock className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-stone-900 dark:text-dark-text-primary">
                        {b.service?.title} — {b.status.replace(/_/g, " ")}
                      </h5>
                      <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary mt-0.5">
                        Vendor: {b.vendor?.businessName}. Advance paid: {formatPrice(b.advancePaid)}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: MEMORIES */}
        {activeTab === "memories" && (
          <div className="space-y-6">
            {/* Upload Memory Box */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-dark-border gap-4 mb-5">
                <div>
                  <CardTitle className="text-base">Preserved Celebration Memories</CardTitle>
                  <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-0.5">
                    Upload and preserve beautiful moments from your celebration. All photos are securely stored.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleUploadMemory}
                    className="hidden"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={uploadingMemory}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1.5" /> Upload Photo
                  </Button>
                </div>
              </div>

              {/* Upload Meta options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Photo Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={memoryCaption}
                    onChange={(e) => setMemoryCaption(e.target.value)}
                    placeholder="e.g. Cake cutting, laughing with family..."
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-dark-border bg-warm-50/50 dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={memoryCategory}
                    onChange={(e) => setMemoryCategory(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-dark-border bg-warm-50/50 dark:bg-dark-elevated text-stone-900 dark:text-dark-text-primary"
                  >
                    <option value="MOMENTS">Candid Moments</option>
                    <option value="HIGHLIGHTS">Celebration Highlights</option>
                    <option value="CAKE">Cake & Dining</option>
                    <option value="DECOR">Décor & Ambiance</option>
                    <option value="GUESTS">Family & Friends</option>
                  </select>
                </div>

                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700 dark:text-stone-300">
                    <input
                      type="checkbox"
                      checked={memoryHighlight}
                      onChange={(e) => setMemoryHighlight(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    Mark as Top Highlight
                  </label>
                </div>
              </div>
            </Card>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              {["ALL", "HIGHLIGHTS", "MOMENTS", "CAKE", "DECOR", "GUESTS"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveMemoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    activeMemoryFilter === cat
                      ? "bg-stone-900 text-white dark:bg-dark-elevated"
                      : "bg-white dark:bg-dark-surface text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-dark-border hover:bg-stone-50"
                  }`}
                >
                  {cat === "ALL" ? "All Photos" : cat}
                </button>
              ))}
            </div>

            {/* Photo Gallery Grid */}
            {filteredMemories.length === 0 ? (
              <Card className="p-12 text-center">
                <Camera className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                <h4 className="font-bold text-stone-800 dark:text-dark-text-primary text-sm">
                  No memories uploaded in this category
                </h4>
                <p className="text-xs text-stone-500 dark:text-dark-text-secondary mt-1">
                  Upload cherished moments from your celebration to preserve them forever.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="group relative rounded-2xl overflow-hidden border border-stone-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-xs transition-all hover:shadow-soft"
                  >
                    <div
                      className="aspect-square bg-stone-100 dark:bg-stone-900 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedPhotoPreview(mem.imageUrl)}
                    >
                      <img
                        src={mem.imageUrl}
                        alt={mem.caption || "Event memory"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md pointer-events-auto">
                        {mem.category || "MOMENTS"}
                      </span>
                      <button
                        onClick={() => handleToggleHighlight(mem)}
                        className={`p-1.5 rounded-full pointer-events-auto transition-colors ${
                          mem.highlight
                            ? "bg-amber-400 text-stone-900 shadow-sm"
                            : "bg-black/50 text-white/80 hover:text-white"
                        }`}
                        title="Highlight Memory"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    {/* Bottom Caption & Actions */}
                    <div className="p-3 flex items-center justify-between text-xs">
                      <p className="truncate font-medium text-stone-800 dark:text-stone-200 text-xs">
                        {mem.caption || "Celebration moment"}
                      </p>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PHOTO PREVIEW MODAL */}
        {selectedPhotoPreview && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedPhotoPreview(null)}
            title="Preserved Celebration Memory"
          >
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
                <img
                  src={selectedPhotoPreview}
                  alt="Full size memory"
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedPhotoPreview(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* EDIT EVENT MODAL */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Celebration Details"
          description="Update guest count, budget targets, or celebration notes."
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs">
                {actionError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Celebration Title</label>
              <input
                type="text"
                required
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Expected Guests</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editFormData.guestCount}
                  onChange={(e) => setEditFormData({ ...editFormData, guestCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Target Budget (₹)</label>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  required
                  value={editFormData.overallBudget}
                  onChange={(e) => setEditFormData({ ...editFormData, overallBudget: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Notes & Theme Preferences</label>
              <textarea
                rows={3}
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Theme inspirations, dietary restrictions, musical genres..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-dark-border text-stone-900 dark:text-dark-text-primary bg-white dark:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-1/2"
                isLoading={isSavingEdit}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* DELETE CONFIRMATION MODAL */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Celebration Event"
          description="Are you sure you want to remove this celebration? This action cannot be undone."
        >
          <div className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs">
                {actionError}
              </div>
            )}

            <p className="text-stone-600 dark:text-dark-text-secondary leading-relaxed">
              Deleting <strong>{event.title}</strong> will remove all custom checkpoints and memories.
            </p>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                className="w-1/2"
                isLoading={isDeleting}
                onClick={handleDeleteEvent}
              >
                Delete Celebration
              </Button>
            </div>
          </div>
        </Modal>
        {/* ADVANCE PAYMENT & CONTACT UNLOCK MODAL */}
        {payingBooking && (
          <Modal
            isOpen={true}
            onClose={() => {
              if (!payingLoading) setPayingBooking(null);
            }}
            title="Pay Advance Deposit & Unlock Contact"
            description="Clear the one-time advance deposit to lock your celebration date and reveal direct vendor contact details."
          >
            <div className="space-y-4 text-xs">
              {paySuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-xl">
                  {paySuccessMsg}
                </div>
              )}

              <div className="p-4 rounded-xl bg-warm-50 dark:bg-dark-elevated border border-stone-200 dark:border-dark-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-dark-text-secondary">Service:</span>
                  <span className="font-bold text-stone-900 dark:text-dark-text-primary">
                    {payingBooking.service?.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-dark-text-secondary">Vendor:</span>
                  <span className="font-bold text-stone-900 dark:text-dark-text-primary">
                    {payingBooking.vendor?.businessName}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-dark-border">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    Advance Deposit to Pay:
                  </span>
                  <span className="text-lg font-bold font-mono text-rose-700 dark:text-rose-400">
                    {formatPrice(payingBooking.advanceRequired || Math.round((payingBooking.agreedServiceValue * 0.25)))}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 dark:text-dark-text-secondary leading-relaxed">
                Upon payment confirmation, Document 1 (Advance Voucher) is generated and direct contact details (phone, email) are instantly unlocked.
              </p>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-1/2"
                  disabled={payingLoading}
                  onClick={() => setPayingBooking(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-1/2"
                  isLoading={payingLoading}
                  onClick={executeAdvancePayment}
                >
                  Confirm & Pay Advance
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
