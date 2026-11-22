import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function CustomerBookingsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "CUSTOMER") {
    redirect("/login");
  }

  // Phase 5: Merged into unified My Celebrations portal
  redirect("/customer/events");
}
