"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { approveSubscription, revokeSubscription } from "../actions";

export function SubscriptionActions({ 
  subscriptionId, 
  status 
}: { 
  subscriptionId: string; 
  status: string 
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    const res = await approveSubscription(subscriptionId);
    if (res.success) {
      alert("Approved! Subscription is now active.");
    } else {
      alert("Error: " + res.error);
    }
    setLoading(null);
  };

  const handleRevoke = async () => {
    setLoading("revoke");
    const res = await revokeSubscription(subscriptionId);
    if (res.success) {
      alert("Revoked! Subscription cancelled.");
    } else {
      alert("Error: " + res.error);
    }
    setLoading(null);
  };

  if (status === "PENDING") {
    return (
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="outline" className="h-7 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200" onClick={handleApprove} disabled={loading !== null}>
          {loading === "approve" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
          Approve (UPI)
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs bg-red-50 text-red-600 hover:bg-red-100 border-red-200" onClick={handleRevoke} disabled={loading !== null}>
          {loading === "revoke" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
          Reject
        </Button>
      </div>
    );
  }

  if (status === "ACTIVE") {
    return (
      <div className="flex gap-2 mt-2">
         <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={handleRevoke} disabled={loading !== null}>
          {loading === "revoke" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
          Revoke
        </Button>
      </div>
    );
  }

  return null;
}
