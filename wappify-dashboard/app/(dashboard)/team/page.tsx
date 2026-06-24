"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Shield, Crown, Headphones, Loader2, Trash2, MoreVertical, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  joinedAt: string | null;
  invitedAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null } | null;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; bgColor: string }> = {
  OWNER: { label: "Owner", icon: Crown, color: "text-amber-700", bgColor: "bg-amber-100" },
  ADMIN: { label: "Admin", icon: Shield, color: "text-blue-700", bgColor: "bg-blue-100" },
  AGENT: { label: "Agent", icon: Headphones, color: "text-green-700", bgColor: "bg-green-100" },
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("AGENT");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success) setMembers(data.data);
    } catch (err) { console.error("Failed to fetch team:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setInviteError("Email is required."); return; }
    setInviteError(null);
    setInviteLoading(true);
    try {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }) });
      const data = await res.json();
      if (data.success) { setIsInviteOpen(false); setInviteEmail(""); setInviteRole("AGENT"); fetchMembers(); }
      else { setInviteError(data.message || "Failed to invite."); }
    } catch (err) { setInviteError("Something went wrong."); }
    finally { setInviteLoading(false); }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const res = await fetch("/api/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId }) });
      const data = await res.json();
      if (data.success) fetchMembers();
      else alert(data.message || "Failed to remove member.");
    } catch (err) { alert("Something went wrong."); }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      const res = await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, role }) });
      const data = await res.json();
      if (data.success) fetchMembers();
      else alert(data.message || "Failed to update role.");
    } catch (err) { alert("Something went wrong."); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><UserPlus className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team</h1>
            <p className="text-sm text-muted-foreground">Manage who has access to your organization.</p>
          </div>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} className="rounded-xl font-bold"><UserPlus className="mr-2 h-4 w-4" />Invite Member</Button>
      </div>

      {/* Members Grid */}
      <div className="grid gap-4">
        {members.map((member) => {
          const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.AGENT;
          const Icon = rc.icon;
          const displayName = member.user?.name || member.email;
          const isJoined = !!member.joinedAt;

          return (
            <div key={member.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm uppercase">
                {member.user?.image ? (
                  <img src={member.user.image} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  displayName.substring(0, 2)
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  {!isJoined && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Pending</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>

              {/* Role Badge */}
              <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", rc.bgColor, rc.color)}>
                <Icon className="h-3 w-3" />{rc.label}
              </div>

              {/* Actions */}
              {member.role !== "OWNER" && (
                <div className="flex items-center gap-2">
                  <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value)} className="text-xs font-semibold rounded-lg border px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="ADMIN">Admin</option><option value="AGENT">Agent</option>
                  </select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(member.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Invite Team Member</DialogTitle>
            <DialogDescription>They&apos;ll get access when they sign up with this email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input id="invite-email" type="email" placeholder="teammate@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                {["AGENT", "ADMIN"].map((r) => {
                  const rc = ROLE_CONFIG[r];
                  return (
                    <button key={r} onClick={() => setInviteRole(r)} className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-all", inviteRole === r ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted")}>
                      <rc.icon className="h-4 w-4" />{rc.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {inviteError && <p className="text-sm text-destructive font-medium">{inviteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteLoading} className="rounded-xl font-bold">
              {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
