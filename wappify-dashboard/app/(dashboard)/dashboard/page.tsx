import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import StatsCards from "@/components/dashboard/StatsCards";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A snapshot of your WhatsApp commerce activity.
        </p>
      </div>

      <StatsCards />

      <RecentOrdersTable />
    </div>
  );
}
