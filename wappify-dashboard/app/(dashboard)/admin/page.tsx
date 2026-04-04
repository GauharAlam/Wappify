import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { 
  Users, 
  Store, 
  CreditCard,
  Building2,
  Mail,
  CheckCircle2,
  Clock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Super Admin — Wappify",
};

export default async function AdminDashboardPage() {
  const users = await prisma.user.findMany({
    where: {
      merchants: {
        some: {},
      },
    },
    include: { 
      merchants: {
        include: {
          products: {
            select: { id: true, name: true }
          },
          subscription: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const totalStores = users.reduce((acc, u) => acc + u.merchants.length, 0);
  const totalProducts = users.reduce((acc, u) => 
    acc + u.merchants.reduce((mAcc, m) => mAcc + m.products.length, 0), 0
  );
  const activeSubs = users.reduce((acc, u) => 
    acc + u.merchants.filter(m => m.subscription?.status === 'ACTIVE').length, 0
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Super Admin Console</h1>
        <p className="text-muted-foreground max-w-2xl">
          Comprehensive overview of merchants, store performance, and platform-wide subscription metrics.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Merchants</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Stores</p>
            <p className="text-2xl font-bold">{totalStores}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
            <p className="text-2xl font-bold">{activeSubs}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            Platform Users & Businesses
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/10 text-muted-foreground">
                <th className="px-6 py-4 font-medium text-left">Account</th>
                <th className="px-6 py-4 font-medium text-left">Businesses / Stores</th>
                <th className="px-6 py-4 font-medium text-left">Products Catalog</th>
                <th className="px-6 py-4 font-medium text-left">Subscription Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                        {user.name ? user.name[0].toUpperCase() : <Users className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-base tracking-tight">{user.name || "Unnamed"}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5 align-top">
                    <div className="flex flex-col gap-5">
                      {user.merchants.map((m) => (
                        <div key={m.id} className="flex flex-col group">
                          <span className="font-medium text-foreground text-[14px]">
                            {m.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Joined {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="flex flex-col gap-5">
                      {user.merchants.map((m) => (
                        <div key={m.id} className="flex flex-col gap-1.5 min-h-[40px]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                              {m.products.length} PRODUCTS
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
                            {m.products.length > 0 
                              ? m.products.map((p) => p.name).join(", ") 
                              : "No inventory listed yet"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="flex flex-col gap-5">
                      {user.merchants.map((m) => (
                        <div key={m.id} className="min-h-[40px]">
                          {m.subscription ? (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold border uppercase tracking-wider ${
                                m.subscription.status === 'ACTIVE' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                <CheckCircle2 className={`w-3.5 h-3.5 ${m.subscription.status === 'ACTIVE' ? 'opacity-100' : 'opacity-50'}`} />
                                {m.subscription.planTier}
                              </span>
                              <span className="text-[10px] text-muted-foreground pl-1">
                                Status: {m.subscription.status}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold border uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200">
                              FREEMIUM
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="p-4 bg-muted/50 rounded-full">
                        <Store className="w-8 h-8 opacity-40" />
                      </div>
                      <p className="font-medium">No merchants found across the platform.</p>
                      <p className="text-sm">When users create stores, they will appear here automatically.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

