import { redirect } from "next/navigation";
import { getRequiredAdminUser } from "@/lib/auth-utils";

export default async function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getRequiredAdminUser();

  return <>{children}</>;
}
