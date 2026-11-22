import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import AdminSettingsClient from "./AdminSettingsClient";
import { getCompanySettings } from "@/lib/companySettings";

export default async function AdminSettingsPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin-portal/login");
  }

  const settings = await getCompanySettings();

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-dark-bg flex flex-col md:flex-row text-stone-900 dark:text-dark-text-primary">
      <AdminNav />
      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        <AdminSettingsClient initialSettings={settings} />
      </main>
    </div>
  );
}
