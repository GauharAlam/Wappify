import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { 
  Users, 
  Store, 
  CreditCard,
  Building2,
  Mail,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Settings
} from "lucide-react";
import { SubscriptionActions } from "./components/SubscriptionActions";

import { UserGrowthChart } from "./components/UserGrowthChart";

export const metadata: Metadata = {
  title: "Super Admin — Wappify",
};

export default async function AdminDashboardPage() {
  const [merchantsWithUsers, allUsers] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" }
    })
  ]);

  // Calculate growth data (last 14 days)
  const now = new Date();
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const growthData = last14Days.map(date => {
    const count = allUsers.filter(u => {
      const uDate = new Date(u.createdAt);
      uDate.setHours(0, 0, 0, 0);
      return uDate.getTime() === date.getTime();
    }).length;
    return {
      date: date.toISOString(),
      count
    };
  });

  // Calculate stats
  const totalUsers = allUsers.length;
  const totalStores = merchantsWithUsers.reduce((acc, u) => acc + u.merchants.length, 0);
  const activeSubs = merchantsWithUsers.reduce((acc, u) => 
    acc + u.merchants.filter(m => m.subscription?.status === 'ACTIVE').length, 0
  );
  const totalMessages = merchantsWithUsers.reduce((acc, u) => 
    acc + u.merchants.reduce((mAcc, m) => mAcc + ((m as any).messagesSent || 0), 0), 0
  );
  const totalTokens = merchantsWithUsers.reduce((acc, u) => 
    acc + u.merchants.reduce((mAcc, m) => mAcc + (m.geminiTokensUsed || 0), 0), 0
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
            Super Admin Console
          </h1>
          <p className="text-muted-foreground max-w-2xl font-medium">
            Comprehensive overview of platform metrics, growth trends, and merchant performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/broadcast" 
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Broadcasting
          </a>
          <a 
            href="/admin/settings" 
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-input bg-background hover:bg-accent transition-colors"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Users</p>
          <p className="text-3xl font-black text-foreground">{totalUsers}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Live Now
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Store className="w-12 h-12" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total stores</p>
          <p className="text-3xl font-black text-foreground">{totalStores}</p>
          <p className="text-[10px] font-medium text-muted-foreground">across all merchants</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-12 h-12" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Subs</p>
          <p className="text-3xl font-black text-emerald-600">{activeSubs}</p>
          <p className="text-[10px] font-medium text-muted-foreground">paying customers</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-12 h-12" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Messages Sent</p>
          <p className="text-3xl font-black text-blue-600">{totalMessages.toLocaleString()}</p>
          <p className="text-[10px] font-medium text-muted-foreground">via WhatsApp</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-12 h-12" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gemini Usage</p>
          <p className="text-3xl font-black text-purple-600">{totalTokens.toLocaleString()}</p>
          <p className="text-[10px] font-medium text-muted-foreground">tokens generated</p>
        </div>
      </div>

      {/* Growth Chart */}
      <UserGrowthChart data={growthData} />

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
                <th className="px-6 py-4 font-medium text-left">Stores & Usage</th>
                <th className="px-6 py-4 font-medium text-left">Subscription Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {merchantsWithUsers.map((user) => (
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
                        <div key={m.id} className="flex flex-col group min-h-[40px] gap-1.5">
                          <span className="font-medium text-foreground text-[14px]">
                            {m.name} <span className="text-xs font-normal text-muted-foreground">({m.products.length} products)</span>
                          </span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {(m as any).messagesSent || 0}</span>
                            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {m.geminiTokensUsed}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Joined {new Date(m.createdAt).toLocaleDateString()}</span>
                          </div>
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
                              <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold border uppercase tracking-wider ${
                                m.subscription.status === 'ACTIVE' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : m.subscription.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                <CheckCircle2 className={`w-3.5 h-3.5 ${m.subscription.status === 'ACTIVE' ? 'opacity-100' : 'opacity-50'}`} />
                                {m.subscription.planTier}
                              </span>
                              <span className="text-[10px] text-muted-foreground pl-1">
                                {m.subscription.paymentMethod} • {m.subscription.status}
                              </span>
                              {m.subscription.status === 'PENDING' && m.subscription.paymentMethod === 'UPI' && (
                                <span className="text-[10px] text-amber-600 pl-1 font-medium">Ref: {m.subscription.upiTransactionRef}</span>
                              )}
                              <SubscriptionActions subscriptionId={m.subscription.id} status={m.subscription.status} />
                            </div>
                          ) : (
                            <span className="inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-bold border uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200">
                              FREEMIUM
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {merchantsWithUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
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

