import { prisma } from "@/lib/prisma";
import { promoteUserToAdmin } from "./actions";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin — Wappify",
};

export default async function AdminDashboardPage() {
  const users = await prisma.user.findMany({
    include: { merchants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage platform users and coordinate roles.</p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Merchant setup</th>
                <th className="px-6 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{user.name || "Unnamed"}</div>
                    <div className="text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}`}>
                      {user.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.merchants.length > 0 ? (
                      <span className="text-green-600 font-medium">Configured</span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== "ADMIN" && (
                      <form action={async () => {
                        "use server";
                        await promoteUserToAdmin(user.id);
                      }}>
                        <button 
                          className="inline-flex items-center justify-center shrink-0 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1.5"
                          type="submit"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Make Admin
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
