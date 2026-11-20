import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Calendar,
  BookOpen,
  CreditCard,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CustomerDashboardPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "CUSTOMER" || !session.customerId) {
    redirect("/login");
  }

  const [customer, events, bookings] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: session.customerId },
    }),
    prisma.event.findMany({
      where: { customerId: session.customerId },
      include: {
        checkpoints: true,
        bookings: { include: { service: true, vendor: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { customerId: session.customerId },
      include: {
        service: true,
        vendor: true,
        event: true,
        invoices: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const upcomingEvents = events.filter((e) => e.status !== "CANCELLED" && e.status !== "COMPLETED");
  const awaitingAdvanceBookings = bookings.filter((b) => b.status === "ACCEPTED_AWAITING_ADVANCE");
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS");
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

  const totalOutstandingBalance = confirmedBookings.reduce(
    (sum, b) => sum + (b.finalBalanceDue || 0),
    0
  );

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col font-sans text-stone-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/90 shadow-soft mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="champagne" size="sm" className="font-mono">
                {customer?.customerCode || "CY-CUST"}
              </Badge>
              <span className="text-xs text-stone-500 font-medium">Celebration Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Welcome back, {customer?.name || "Friend"}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl leading-relaxed">
              Track your upcoming celebrations, manage vendor contracts, review milestone checkpoints, and access official tax invoices.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/plan">
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Plan My Celebration
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="sm" leftIcon={<Calendar className="w-4 h-4 text-stone-600" />}>
                Explore Services
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Required Alert: Vendor Accepted, Awaiting Advance */}
        {awaitingAdvanceBookings.length > 0 && (
          <div className="mb-8 p-5 bg-amber-50/90 rounded-2xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  Action Required: Vendor Accepted Booking Request
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  <strong>{awaitingAdvanceBookings[0].vendor.businessName}</strong> accepted your request for &quot;{awaitingAdvanceBookings[0].service.title}&quot;. Clear the advance deposit to lock your event date and unlock vendor direct contact.
                </p>
              </div>
            </div>

            <Link href={`/customer/bookings/${awaitingAdvanceBookings[0].id}`}>
              <Button variant="champagne" size="sm" className="whitespace-nowrap shadow-xs">
                Review & Confirm Booking <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Upcoming Celebrations
            </span>
            <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">
              {upcomingEvents.length}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Events in progress</span>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Confirmed Vendors
            </span>
            <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block">
              {confirmedBookings.length}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Locked service contracts</span>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Pending Actions
            </span>
            <span className="text-2xl font-serif font-bold text-amber-700 mt-1 block">
              {awaitingAdvanceBookings.length}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Awaiting advance payment</span>
          </Card>

          <Card className="p-5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Outstanding Balances
            </span>
            <span className="text-2xl font-serif font-bold text-stone-900 mt-1 block font-mono">
              {formatPrice(totalOutstandingBalance)}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Due on final fulfillment</span>
          </Card>
        </div>

        {/* Two Column Layout: My Celebrations & Recent Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Celebrations */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>My Celebrations</CardTitle>
                <Link href="/customer/events" className="text-xs font-semibold text-rose-700 hover:text-rose-800">
                  View All
                </Link>
              </CardHeader>

              <CardContent className="space-y-4">
                {events.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="w-5 h-5" />}
                    title="No celebrations planned yet"
                    description="Create your first celebration blueprint to organize checkpoints and vendors."
                    action={
                      <Link href="/plan">
                        <Button variant="secondary" size="sm">
                          Plan My Celebration
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  events.slice(0, 3).map((event) => {
                    const completedCheckpoints = event.checkpoints.filter((c) => c.status === "COMPLETED").length;
                    const progress =
                      event.checkpoints.length > 0
                        ? Math.round((completedCheckpoints / event.checkpoints.length) * 100)
                        : 0;

                    const daysLeft = Math.ceil(
                      (new Date(event.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <Link key={event.id} href={`/customer/events/${event.id}`} className="block group">
                        <div className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-stone-900 group-hover:text-rose-700 transition-colors">
                              {event.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {daysLeft >= 0 && daysLeft <= 60 && (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                                  {daysLeft === 0 ? "Today" : `${daysLeft} days away`}
                                </span>
                              )}
                              <Badge variant={event.status === "COMPLETED" ? "success" : "neutral"} size="sm">
                                {event.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
                            <span>{new Date(event.eventDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                            <span>•</span>
                            <span>{event.guestCount} Guests</span>
                            <span>•</span>
                            <span>{formatPrice(event.overallBudget)}</span>
                          </div>

                          {/* Checkpoint Progress */}
                          <div>
                            <div className="flex justify-between text-[11px] text-stone-500 mb-1">
                              <span>Checkpoints Completed</span>
                              <span className="font-semibold text-stone-800">
                                {completedCheckpoints}/{event.checkpoints.length} ({progress}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-700 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </div>

            <div className="px-6 py-4 bg-stone-50/60 border-t border-stone-100 flex justify-between items-center">
              <Link href="/plan" className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Plan New Celebration
              </Link>
              <Link href="/customer/events" className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1">
                Manage all events <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Right: Bookings & Legal Invoices */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>Recent Service Bookings</CardTitle>
                <Link href="/customer/bookings" className="text-xs font-semibold text-rose-700 hover:text-rose-800">
                  View All
                </Link>
              </CardHeader>

              <CardContent className="space-y-4">
                {bookings.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="w-5 h-5" />}
                    title="No service bookings placed"
                    description="Browse verified vendors to book cinematography, catering, decor, and custom cakes."
                    action={
                      <Link href="/explore">
                        <Button variant="secondary" size="sm">
                          Browse Services
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  bookings.slice(0, 4).map((b) => (
                    <Link key={b.id} href={`/customer/bookings/${b.id}`} className="block group">
                      <div className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-stone-900 group-hover:text-rose-700 transition-colors">
                            {b.service.title}
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

                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <div>
                            <span className="font-semibold text-stone-800">{b.vendor.businessName}</span>
                            <span className="text-stone-400 block text-[11px] mt-0.5">
                              Event: {new Date(b.eventDate).toLocaleDateString("en-IN")}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-stone-900 block font-mono">{formatPrice(b.agreedServiceValue)}</span>
                            {b.invoices.length > 0 && (
                              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 justify-end mt-0.5">
                                <FileText className="w-3 h-3" /> {b.invoices.length} Receipt(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </div>

            <div className="px-6 py-4 bg-stone-50/60 border-t border-stone-100 flex justify-end">
              <Link href="/customer/bookings" className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1">
                View all bookings & receipts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
