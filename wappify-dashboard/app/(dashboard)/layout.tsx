import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getRequiredDashboardContext } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { merchant, appUser } = await getRequiredDashboardContext();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        merchantName={merchant.name}
        email={appUser.email ?? undefined}
        role={appUser.role}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          userName={appUser.name || merchant.name || "Merchant"}
          email={appUser.email ?? undefined}
        />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
