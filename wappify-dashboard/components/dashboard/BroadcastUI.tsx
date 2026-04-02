"use client";

import * as React from "react";
import { 
  Send, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search,
  MessageSquare,
  Zap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string | null;
  waId: string;
}

interface BroadcastUIProps {
  customers: Customer[];
}

export default function BroadcastUI({ customers }: BroadcastUIProps) {
  const [message, setMessage] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(customers.map(c => c.id)));
  const [search, setSearch] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<{ id: string, status: 'pending' | 'success' | 'error' }[]>([]);

  const filteredCustomers = customers.filter(c => 
    (c.name?.toLowerCase().includes(search.toLowerCase()) ?? false) || 
    c.waId.includes(search)
  );

  const toggleAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSend = async () => {
    if (!message.trim() || selectedIds.size === 0) return;

    setIsSending(true);
    setProgress(0);
    const selectedCustomers = customers.filter(c => selectedIds.has(c.id));
    const newStatus = selectedCustomers.map(c => ({ id: c.id, status: 'pending' as const }));
    setStatus(newStatus);

    for (let i = 0; i < selectedCustomers.length; i++) {
        const customer = selectedCustomers[i];
        try {
            const res = await fetch("/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: customer.waId,
                    message: message,
                })
            });

            if (!res.ok) throw new Error("Failed to send");
            
            setStatus(prev => prev.map(s => s.id === customer.id ? { ...s, status: 'success' } : s));
        } catch (err) {
            setStatus(prev => prev.map(s => s.id === customer.id ? { ...s, status: 'error' } : s));
        }
        
        const nextProgress = Math.round(((i + 1) / selectedCustomers.length) * 100);
        setProgress(nextProgress);
        
        // Minor delay to prevent rate limiting issues during testing
        await new Promise(r => setTimeout(r, 300));
    }

    setIsSending(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5 h-full">
      
      {/* ── Left: Composer ────────────────── */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="shadow-sm border-neutral-100 overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Marketing Broadcast
            </h3>
            <div className="text-[10px] uppercase font-bold tracking-widest text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">
                WhatsApp Cloud API
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Message Content</label>
              <Textarea 
                placeholder="e.g. 👋 Hey! Our new Summer Collection is here. Check it out at stylehouse.in/shop" 
                className="min-h-[220px] resize-none text-md leading-relaxed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
              />
              <p className="text-[11px] text-neutral-400">
                Tip: Personalize your message. Wappify sends this as a direct message from your business account.
              </p>
            </div>

            {isSending && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">Sending Broadcast...</span>
                    <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button 
                className="w-full h-12 text-md font-semibold mt-4" 
                onClick={handleSend}
                disabled={isSending || !message.trim() || selectedIds.size === 0}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending to {selectedIds.size} Customers...
                </>
              ) : (
                <>
                  Launch Broadcast
                  <Zap className="ml-2 h-4 w-4 fill-current" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {status.length > 0 && (
            <div className="rounded-xl border bg-neutral-50/50 p-6 space-y-4 border-neutral-100 italic">
                <p className="text-xs text-neutral-500 font-medium">Broadcast Statistics</p>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-neutral-100 shadow-sm text-center">
                        <div className="text-xl font-bold text-neutral-900">{status.length}</div>
                        <div className="text-[10px] text-neutral-400 uppercase tracking-tighter">Total</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-neutral-100 shadow-sm text-center">
                        <div className="text-xl font-bold text-green-600">{status.filter(s => s.status === 'success').length}</div>
                        <div className="text-[10px] text-neutral-400 uppercase tracking-tighter">Success</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-neutral-100 shadow-sm text-center">
                        <div className="text-xl font-bold text-red-600">{status.filter(s => s.status === 'error').length}</div>
                        <div className="text-[10px] text-neutral-400 uppercase tracking-tighter">Failed</div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* ── Right: Audience Selection ─────── */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="h-full shadow-sm border-neutral-100 flex flex-col">
            <div className="p-4 border-b border-neutral-100 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Target Audience
                </h3>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input 
                        placeholder="Search customers..." 
                        className="pl-9 h-9 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="all" 
                            checked={selectedIds.size === customers.length && customers.length > 0} 
                            onCheckedChange={toggleAll}
                        />
                        <label htmlFor="all" className="text-xs font-medium text-neutral-600 cursor-pointer">
                            Select All ({customers.length})
                        </label>
                    </div>
                    <span className="text-[10px] font-bold text-primary p-1 bg-primary/5 rounded px-2">
                        {selectedIds.size} selected
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[500px]">
                {filteredCustomers.map((customer) => (
                    <div 
                        key={customer.id}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group",
                            selectedIds.has(customer.id) ? "bg-blue-50/30 border-blue-100" : "bg-transparent border-transparent hover:bg-neutral-50"
                        )}
                        onClick={() => toggleOne(customer.id)}
                    >
                        <Checkbox checked={selectedIds.has(customer.id)} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 truncate">{customer.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono tracking-tight">{customer.waId}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {status.find(s => s.id === customer.id)?.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {status.find(s => s.id === customer.id)?.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
      </div>

    </div>
  );
}
