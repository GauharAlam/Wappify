"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Search, Send, ArrowLeft, UserPlus, Loader2, XCircle, Circle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Contact { id: string; name: string | null; waId: string; }
interface AssignedTo { id: string; email: string; role: string; user: { name: string | null; image: string | null } | null; }
interface Conversation { id: string; status: string; lastMessageAt: string | null; lastMessagePreview: string | null; unreadCount: number; contact: Contact; assignedTo: AssignedTo | null; tags: any[]; isEscalated: boolean; }
interface Message { id: string; direction: "INBOUND" | "OUTBOUND"; content: string; type: string; createdAt: string; senderMember: AssignedTo | null; }
interface TeamMember { id: string; email: string; role: string; user: { name: string | null; image: string | null } | null; }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "text-blue-600 bg-blue-100" },
  ASSIGNED: { label: "Assigned", color: "text-amber-600 bg-amber-100" },
  RESOLVED: { label: "Resolved", color: "text-green-600 bg-green-100" },
  CLOSED: { label: "Closed", color: "text-neutral-500 bg-neutral-100" },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "RESOLVED", label: "Resolved" },
];

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("status", activeFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/inbox?${params.toString()}`);
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (err) { console.error("Failed to fetch conversations:", err); }
    finally { setLoading(false); }
  }, [activeFilter, search]);

  const fetchMessages = useCallback(async (convoId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/inbox/${convoId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
        setSelectedConvo(data.data.conversation);
        setConversations((prev) => prev.map((c) => (c.id === convoId ? { ...c, unreadCount: 0 } : c)));
      }
    } catch (err) { console.error("Failed to fetch messages:", err); }
    finally { setMessagesLoading(false); }
  }, []);

  const fetchTeam = useCallback(async () => {
    try { const res = await fetch("/api/team"); const data = await res.json(); if (data.success) setTeamMembers(data.data); }
    catch (err) { console.error("Failed to fetch team:", err); }
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvoId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selectedConvoId, content: newMessage.trim() }) });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
        setConversations((prev) => prev.map((c) => c.id === selectedConvoId ? { ...c, lastMessagePreview: newMessage.trim().slice(0, 100), lastMessageAt: new Date().toISOString() } : c));
      }
    } catch (err) { console.error("Failed to send:", err); }
    finally { setSending(false); }
  };

  const handleAssign = async (memberId: string | null) => {
    if (!selectedConvoId) return;
    try {
      const res = await fetch(`/api/inbox/${selectedConvoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedToId: memberId }) });
      const data = await res.json();
      if (data.success) { setSelectedConvo(data.data); fetchConversations(); }
    } catch (err) { console.error("Failed to assign:", err); }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedConvoId) return;
    try {
      const res = await fetch(`/api/inbox/${selectedConvoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (data.success) { setSelectedConvo(data.data); fetchConversations(); }
    } catch (err) { console.error("Failed to update status:", err); }
  };

  const handleEscalationToggle = async () => {
    if (!selectedConvoId || !selectedConvo) return;
    try {
      const res = await fetch(`/api/inbox/${selectedConvoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isEscalated: !selectedConvo.isEscalated }) });
      const data = await res.json();
      if (data.success) { setSelectedConvo(data.data); fetchConversations(); }
    } catch (err) { console.error("Failed to update escalation:", err); }
  };

  useEffect(() => { fetchConversations(); fetchTeam(); }, [fetchConversations, fetchTeam]);
  useEffect(() => { if (selectedConvoId) fetchMessages(selectedConvoId); }, [selectedConvoId, fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const interval = setInterval(() => { fetchConversations(); if (selectedConvoId) fetchMessages(selectedConvoId); }, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations, fetchMessages, selectedConvoId]);

  return (
    <div className="flex h-[calc(100vh-7rem)] rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Left Panel: Conversation List */}
      <div className={cn("w-full md:w-[380px] md:min-w-[380px] flex flex-col border-r", selectedConvoId && "hidden md:flex")}>
        <div className="p-4 space-y-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg text-sm" />
          </div>
          <div className="flex gap-1">
            {FILTER_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveFilter(tab.key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", activeFilter === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent")}>{tab.label}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Messages from WhatsApp will appear here.</p>
            </div>
          ) : (
            conversations.map((convo) => {
              const sc = STATUS_CONFIG[convo.status];
              return (
                <button key={convo.id} onClick={() => setSelectedConvoId(convo.id)} className={cn("w-full flex items-start gap-3 p-4 text-left border-b transition-all hover:bg-accent/50", selectedConvoId === convo.id && "bg-accent")}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm uppercase">{convo.contact.name?.[0] || convo.contact.waId.slice(-2)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">{convo.contact.name || convo.contact.waId}</span>
                      {convo.lastMessageAt && <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: false })}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.lastMessagePreview || "No messages yet"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {sc && <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", sc.color)}>{sc.label}</span>}
                      {convo.isEscalated && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Escalated</span>}
                      {convo.unreadCount > 0 && <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{convo.unreadCount}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Chat Thread */}
      <div className={cn("flex-1 flex flex-col", !selectedConvoId && "hidden md:flex")}>
        {!selectedConvoId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 mb-4"><MessageSquare className="h-8 w-8 text-primary/30" /></div>
            <h3 className="text-lg font-semibold text-muted-foreground">Select a conversation</h3>
            <p className="text-sm text-muted-foreground/60 mt-1">Choose a chat from the list to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <button onClick={() => setSelectedConvoId(null)} className="md:hidden p-1 rounded-lg hover:bg-accent"><ArrowLeft className="h-5 w-5" /></button>
              {selectedConvo && (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm uppercase">{selectedConvo.contact.name?.[0] || selectedConvo.contact.waId.slice(-2)}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold truncate">{selectedConvo.contact.name || selectedConvo.contact.waId}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">+{selectedConvo.contact.waId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={selectedConvo.status} onChange={(e) => handleStatusChange(e.target.value)} className="text-xs font-semibold rounded-lg border px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="OPEN">Open</option><option value="ASSIGNED">Assigned</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
                    </select>
                    <select value={selectedConvo.assignedTo?.id || ""} onChange={(e) => handleAssign(e.target.value || null)} className="text-xs font-semibold rounded-lg border px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.user?.name || m.email}</option>)}
                    </select>
                    <button 
                      onClick={handleEscalationToggle} 
                      className={cn(
                        "text-xs font-semibold rounded-lg border px-3 py-1.5 transition-colors",
                        selectedConvo.isEscalated 
                          ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" 
                          : "bg-background hover:bg-accent text-muted-foreground"
                      )}
                    >
                      {selectedConvo.isEscalated ? "Escalated" : "Escalate to Human"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center"><p className="text-sm text-muted-foreground">No messages in this conversation.</p></div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm", msg.direction === "OUTBOUND" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md")}>
                      {msg.direction === "OUTBOUND" && msg.senderMember && <p className="text-[10px] font-semibold opacity-70 mb-1">{msg.senderMember.user?.name || msg.senderMember.email}</p>}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={cn("text-[9px] mt-1 text-right", msg.direction === "OUTBOUND" ? "text-primary-foreground/60" : "text-muted-foreground")}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="p-4 border-t">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 rounded-xl h-11" disabled={sending} />
                <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shrink-0" disabled={!newMessage.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
