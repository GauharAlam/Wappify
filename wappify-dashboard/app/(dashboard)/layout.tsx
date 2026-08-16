import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getRequiredDashboardContext } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { org, appUser, membership } = await getRequiredDashboardContext();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        orgName={org.name}
        email={appUser.email ?? undefined}
        role={membership.role}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          userName={appUser.name || org.name || "User"}
          email={appUser.email ?? undefined}
          orgName={org.name}
          role={membership.role}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
