"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  GripVertical,
  Info,
  Layers3,
  MessageCircle,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  UserCheck,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TriggerType =
  | "KEYWORD"
  | "FIRST_MESSAGE"
  | "OUTSIDE_HOURS"
  | "MEDIA_RECEIVED"
  | "ALL_MESSAGES";

type MatchMode = "EXACT" | "CONTAINS" | "STARTS_WITH";

type AutoAction =
  | "SEND_TEXT"
  | "SEND_CATALOG"
  | "SEND_GREETING"
  | "FORWARD_TO_AI"
  | "ESCALATE_TO_HUMAN"
  | "SET_TAG";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Rule {
  id: string;
  name: string;
  isActive: boolean;
  priority: number;
  trigger: TriggerType;
  keywords: string[];
  matchMode: MatchMode;
  action: AutoAction;
  responseText: string | null;
  tagId: string | null;
  source: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  lastTriggeredAt?: Date | string | null;
  tag?: Tag | null;
}

interface RuleFormState {
  name: string;
  trigger: TriggerType;
  keywords: string;
  matchMode: MatchMode;
  caseSensitive: boolean;
  responseText: string;
  tagId: string;
  assignToAgent: boolean;
  escalate: boolean;
  aiResponse: boolean;
  isActive: boolean;
}

interface AutomationRuleListProps {
  initialRules: Rule[];
  availableTags: Tag[];
}

const triggerOptions: Array<{
  value: TriggerType | "TIME_BASED";
  label: string;
  description: string;
  disabled?: boolean;
}> = [
  {
    value: "FIRST_MESSAGE",
    label: "First message",
    description: "Welcome a customer when they first contact you.",
  },
  {
    value: "KEYWORD",
    label: "Keyword match",
    description: "React when a message includes specific words.",
  },
  {
    value: "ALL_MESSAGES",
    label: "Every message",
    description: "Use as a fallback for unmatched conversations.",
  },
  {
    value: "TIME_BASED",
    label: "Time-based",
    description: "Schedule rules for a date or business-hour window.",
    disabled: true,
  },
];

const defaultForm: RuleFormState = {
  name: "New automation rule",
  trigger: "KEYWORD",
  keywords: "price, pricing",
  matchMode: "CONTAINS",
  caseSensitive: false,
  responseText: "Thanks for reaching out. Here are the details you asked for.",
  tagId: "",
  assignToAgent: false,
  escalate: false,
  aiResponse: false,
  isActive: true,
};

const VIRTUAL_ROW_HEIGHT = 224;
const VIRTUAL_OVERSCAN = 4;

export default function AutomationRuleList({
  initialRules,
  availableTags,
}: AutomationRuleListProps) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(
    initialRules[0]?.id ?? null
  );
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [triggerFilter, setTriggerFilter] = useState<"ALL" | TriggerType>("ALL");
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [form, setForm] = useState<RuleFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("Hi, can you share the price?");
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);
  const virtualListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchValue), 220);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.priority - b.priority),
    [rules]
  );

  const filteredRules = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return sortedRules.filter((rule) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && rule.isActive) ||
        (statusFilter === "INACTIVE" && !rule.isActive);
      const matchesTrigger =
        triggerFilter === "ALL" || rule.trigger === triggerFilter;
      const searchText = [
        rule.name,
        getTriggerLabel(rule.trigger),
        getActionLabel(rule.action),
        rule.responseText ?? "",
        rule.tag?.name ?? "",
        ...rule.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesTrigger && (!query || searchText.includes(query));
    });
  }, [debouncedSearch, sortedRules, statusFilter, triggerFilter]);

  const activeCount = rules.filter((rule) => rule.isActive).length;
  const inactiveCount = rules.length - activeCount;
  const templateCount = rules.filter((rule) => rule.source === "template").length;
  const shouldVirtualize = filteredRules.length > 35;
  const virtualViewportHeight = 720;
  const virtualStart = shouldVirtualize
    ? Math.max(0, Math.floor(virtualScrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN)
    : 0;
  const virtualVisibleCount = shouldVirtualize
    ? Math.ceil(virtualViewportHeight / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2
    : filteredRules.length;
  const visibleRules = shouldVirtualize
    ? filteredRules.slice(virtualStart, virtualStart + virtualVisibleCount)
    : filteredRules;
  const topSpacerHeight = shouldVirtualize ? virtualStart * VIRTUAL_ROW_HEIGHT : 0;
  const bottomSpacerHeight = shouldVirtualize
    ? Math.max(
        0,
        (filteredRules.length - virtualStart - visibleRules.length) * VIRTUAL_ROW_HEIGHT
      )
    : 0;

  const simulationResult = useMemo(
    () => simulateAutomation(sortedRules, testMessage, isFirstMessage),
    [isFirstMessage, sortedRules, testMessage]
  );

  const openAddModal = () => {
    setEditingRule(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEditModal = (rule: Rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      keywords: rule.keywords.join(", "),
      matchMode: rule.matchMode,
      caseSensitive: false,
      responseText: rule.responseText ?? "",
      tagId: rule.tagId ?? "",
      assignToAgent: false,
      escalate: rule.action === "ESCALATE_TO_HUMAN",
      aiResponse: rule.action === "FORWARD_TO_AI",
      isActive: rule.isActive,
    });
    setModalOpen(true);
  };

  const toggleRule = async (rule: Rule) => {
    const nextStatus = !rule.isActive;
    setRules((current) =>
      current.map((item) =>
        item.id === rule.id ? { ...item, isActive: nextStatus } : item
      )
    );

    try {
      const response = await fetch(`/api/automation/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!response.ok) throw new Error("Could not update rule status");
    } catch (error) {
      console.error(error);
      setRules((current) =>
        current.map((item) =>
          item.id === rule.id ? { ...item, isActive: rule.isActive } : item
        )
      );
    }
  };

  const persistPriority = async (nextRules: Rule[]) => {
    const updates = nextRules.map((rule, index) => ({
      id: rule.id,
      priority: index,
    }));

    try {
      const response = await fetch("/api/automation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!response.ok) throw new Error("Could not reorder rules");
    } catch (error) {
      console.error(error);
    }
  };

  const reorderRule = (targetId: string) => {
    if (!draggedRuleId || draggedRuleId === targetId) return;

    const oldIndex = sortedRules.findIndex((rule) => rule.id === draggedRuleId);
    const newIndex = sortedRules.findIndex((rule) => rule.id === targetId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...sortedRules];
    const [movedRule] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedRule);

    const withPriority = reordered.map((rule, index) => ({
      ...rule,
      priority: index,
    }));

    setRules(withPriority);
    void persistPriority(withPriority);
  };

  const duplicateRule = async (rule: Rule) => {
    const payload = buildPayload(
      {
        name: `${rule.name} copy`,
        trigger: rule.trigger,
        keywords: rule.keywords.join(", "),
        matchMode: rule.matchMode,
        caseSensitive: false,
        responseText: rule.responseText ?? "",
        tagId: rule.tagId ?? "",
        assignToAgent: false,
        escalate: rule.action === "ESCALATE_TO_HUMAN",
        aiResponse: rule.action === "FORWARD_TO_AI",
        isActive: false,
      },
      rules.length
    );

    try {
      const response = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { success: boolean; data?: Rule };
      if (!response.ok || !result.success || !result.data) {
        throw new Error("Could not duplicate rule");
      }
      setRules((current) => [...current, result.data as Rule]);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteRule = async (rule: Rule) => {
    if (!window.confirm(`Delete "${rule.name}"? This cannot be undone.`)) return;

    const previousRules = rules;
    setRules((current) => current.filter((item) => item.id !== rule.id));

    try {
      const response = await fetch(`/api/automation/${rule.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete rule");
      if (expandedRuleId === rule.id) setExpandedRuleId(null);
    } catch (error) {
      console.error(error);
      setRules(previousRules);
    }
  };

  const saveRule = async () => {
    setSaving(true);
    const payload = buildPayload(form, editingRule?.priority ?? rules.length);

    try {
      const response = await fetch(
        editingRule ? `/api/automation/${editingRule.id}` : "/api/automation",
        {
          method: editingRule ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = (await response.json()) as { success: boolean; data?: Rule };

      if (!response.ok || !result.success || !result.data) {
        throw new Error("Could not save rule");
      }

      setRules((current) =>
        editingRule
          ? current.map((rule) => (rule.id === editingRule.id ? result.data as Rule : rule))
          : [...current, result.data as Rule]
      );
      setExpandedRuleId(result.data.id);
      setModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const topRule = sortedRules.find((rule) => rule.isActive);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Automation Rules</h1>
              <Badge className="gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activeCount} Active {activeCount === 1 ? "Rule" : "Rules"}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Control how your system handles incoming messages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setTestPanelOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Test Automation
            </Button>
            <Button variant="secondary" disabled title="Template marketplace is coming soon">
              <Layers3 className="h-4 w-4" />
              Templates
            </Button>
            <Button onClick={openAddModal} className="shadow-sm">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="pl-9"
              placeholder="Search rules by name, keyword, or action"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={triggerFilter}
            onChange={(event) => setTriggerFilter(event.target.value as "ALL" | TriggerType)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter by trigger type"
          >
            <option value="ALL">All trigger types</option>
            <option value="FIRST_MESSAGE">First message</option>
            <option value="KEYWORD">Keyword</option>
            <option value="ALL_MESSAGES">Every message</option>
            <option value="OUTSIDE_HOURS">Outside hours</option>
            <option value="MEDIA_RECEIVED">Media received</option>
          </select>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span>
                Rules run top to bottom. <span className="font-medium text-foreground">First match wins.</span>
              </span>
            </div>
            {shouldVirtualize && (
              <Badge variant="outline" className="w-fit gap-1.5 text-muted-foreground">
                <Workflow className="h-3.5 w-3.5" />
                Optimized list rendering
              </Badge>
            )}
          </div>

          {filteredRules.length === 0 ? (
            <EmptyState hasRules={rules.length > 0} onCreate={openAddModal} />
          ) : (
            <div
              ref={virtualListRef}
              onScroll={(event) => setVirtualScrollTop(event.currentTarget.scrollTop)}
              className={cn(
                "space-y-3",
                shouldVirtualize &&
                  "max-h-[720px] overflow-y-auto pr-1 scrollbar-hide"
              )}
            >
              {topSpacerHeight > 0 && <div style={{ height: topSpacerHeight }} />}
              {visibleRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  expanded={expandedRuleId === rule.id}
                  onExpand={() =>
                    setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)
                  }
                  onToggle={() => toggleRule(rule)}
                  onEdit={() => openEditModal(rule)}
                  onDuplicate={() => void duplicateRule(rule)}
                  onDelete={() => void deleteRule(rule)}
                  onDragStart={() => setDraggedRuleId(rule.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    reorderRule(rule.id);
                    setDraggedRuleId(null);
                  }}
                />
              ))}
              {bottomSpacerHeight > 0 && <div style={{ height: bottomSpacerHeight }} />}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          {testPanelOpen && (
            <SimulationPanel
              message={testMessage}
              onMessageChange={setTestMessage}
              isFirstMessage={isFirstMessage}
              onFirstMessageChange={setIsFirstMessage}
              result={simulationResult}
            />
          )}

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Rule Health</h2>
                <p className="text-xs text-muted-foreground">At-a-glance automation coverage</p>
              </div>
              <Workflow className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MetricCard label="Active" value={activeCount} tone="green" />
              <MetricCard label="Paused" value={inactiveCount} tone="gray" />
              <MetricCard label="Templates" value={templateCount} tone="blue" />
            </div>
            <div className="mt-4 rounded-xl bg-muted/50 p-3">
              <p className="text-xs font-medium text-foreground">Current first match</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {topRule ? topRule.name : "No active rules yet"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Design-ready Next Steps</h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <FutureItem icon={Layers3} text="Rule grouping" />
              <FutureItem icon={Workflow} text="Visual workflow builder" />
              <FutureItem icon={Sparkles} text="AI-powered suggestions" />
              <FutureItem icon={MessageCircle} text="Template marketplace" />
            </div>
          </div>
        </aside>
      </div>

      <RuleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        form={form}
        setForm={setForm}
        editing={Boolean(editingRule)}
        saving={saving}
        availableTags={availableTags}
        onSave={() => void saveRule()}
      />
    </div>
  );
}

function RuleCard({
  rule,
  expanded,
  onExpand,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  rule: Rule;
  expanded: boolean;
  onExpand: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
}) {
  return (
    <article
      onClick={onExpand}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md",
        !rule.isActive && "bg-muted/35"
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[28px_minmax(160px,0.8fr)_minmax(260px,1.6fr)_auto] lg:items-center">
        <div
          draggable
          onDragStart={(event) => {
            event.stopPropagation();
            onDragStart();
          }}
          className="hidden cursor-grab rounded-md p-1 text-muted-foreground/50 transition hover:bg-muted hover:text-foreground active:cursor-grabbing lg:block"
          title="Drag to reorder priority"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <h3 className="truncate text-sm font-semibold">{rule.name}</h3>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                rule.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {rule.isActive ? "Active" : "Inactive"}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              P{rule.priority + 1}
            </span>
            {rule.source === "template" && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                Template
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <LogicGroup label="If">
            <Pill className="bg-slate-100 text-slate-700">
              {getTriggerLabel(rule.trigger)}
            </Pill>
            {rule.trigger === "KEYWORD" &&
              rule.keywords.slice(0, 3).map((keyword) => (
                <Pill key={keyword} className="bg-blue-50 text-blue-700">
                  Keyword: {keyword}
                </Pill>
              ))}
            {rule.keywords.length > 3 && (
              <Pill className="bg-muted text-muted-foreground">
                +{rule.keywords.length - 3} more
              </Pill>
            )}
          </LogicGroup>

          <LogicGroup label="Then">
            {getActionPills(rule).map((pill) => (
              <Pill key={pill.label} className={pill.className}>
                {pill.icon}
                {pill.label}
              </Pill>
            ))}
          </LogicGroup>
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <SwitchButton enabled={rule.isActive} onClick={onToggle} />
          <IconButton label="Edit rule" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton label="Duplicate rule" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </IconButton>
          <IconButton label="Delete rule" danger onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5" />
          Last triggered: {formatRelativeTime(rule.lastTriggeredAt)}
        </span>
        <span>Triggered {getTodayCount(rule)} times today</span>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailBlock
            label="Full conditions"
            value={getFullConditionText(rule)}
          />
          <DetailBlock
            label="Message preview"
            value={rule.responseText || getActionPreview(rule.action)}
          />
          <DetailBlock label="Delay logic" value="Send immediately after matching" />
          <DetailBlock
            label="Tags and AI"
            value={`${rule.tag?.name ?? "No tag"} · ${
              rule.action === "FORWARD_TO_AI" ? "AI response on" : "AI response off"
            }`}
          />
        </div>
      )}
    </article>
  );
}

function RuleModal({
  open,
  onOpenChange,
  form,
  setForm,
  editing,
  saving,
  availableTags,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: RuleFormState;
  setForm: (form: RuleFormState) => void;
  editing: boolean;
  saving: boolean;
  availableTags: Tag[];
  onSave: () => void;
}) {
  const previewMessage =
    form.responseText.trim() || "Your automated reply will appear here.";

  const updateForm = <K extends keyof RuleFormState>(
    key: K,
    value: RuleFormState[K]
  ) => setForm({ ...form, [key]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit automation rule" : "Add automation rule"}</DialogTitle>
          <DialogDescription>
            Build the rule in plain language. The preview shows what customers will see.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <StepBlock step="1" title="Trigger">
            <div className="grid gap-3 sm:grid-cols-2">
              {triggerOptions.map((option) => {
                const selected = form.trigger === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled && option.value !== "TIME_BASED") {
                        updateForm("trigger", option.value);
                      }
                    }}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      selected && "border-primary bg-primary/5 ring-1 ring-primary/20",
                      option.disabled
                        ? "cursor-not-allowed opacity-55"
                        : "hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{option.label}</span>
                      {option.disabled && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          Future
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </StepBlock>

          <StepBlock step="2" title="Conditions">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label htmlFor="rule-keywords">Keywords</Label>
                <Input
                  id="rule-keywords"
                  value={form.keywords}
                  onChange={(event) => updateForm("keywords", event.target.value)}
                  placeholder="price, discount, order status"
                  disabled={form.trigger !== "KEYWORD"}
                />
                <p className="text-xs text-muted-foreground">
                  Separate keywords with commas.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="match-mode">Match style</Label>
                <select
                  id="match-mode"
                  value={form.matchMode}
                  onChange={(event) =>
                    updateForm("matchMode", event.target.value as MatchMode)
                  }
                  disabled={form.trigger !== "KEYWORD"}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="CONTAINS">Contains</option>
                  <option value="EXACT">Exact message</option>
                  <option value="STARTS_WITH">Starts with</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateForm("caseSensitive", !form.caseSensitive)}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span
                className={cn(
                  "flex h-5 w-9 items-center rounded-full p-0.5 transition",
                  form.caseSensitive ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-full bg-white shadow-sm transition",
                    form.caseSensitive && "translate-x-4"
                  )}
                />
              </span>
              Case sensitive matching
            </button>
          </StepBlock>

          <StepBlock step="3" title="Actions">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule-message">Send message</Label>
                <Textarea
                  id="rule-message"
                  value={form.responseText}
                  onChange={(event) => updateForm("responseText", event.target.value)}
                  className="min-h-[110px]"
                  placeholder="Write the reply customers should receive"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-tag">Add tag</Label>
                  <select
                    id="rule-tag"
                    value={form.tagId}
                    onChange={(event) => updateForm("tagId", event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">No tag</option>
                    {availableTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule name</Label>
                  <Input
                    id="rule-name"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <ToggleTile
                  label="Assign to agent"
                  description="Mark for the team queue"
                  active={form.assignToAgent}
                  onClick={() => updateForm("assignToAgent", !form.assignToAgent)}
                />
                <ToggleTile
                  label="Escalate"
                  description="Needs human attention"
                  active={form.escalate}
                  onClick={() => updateForm("escalate", !form.escalate)}
                />
                <ToggleTile
                  label="AI response"
                  description="Let AI draft the answer"
                  active={form.aiResponse}
                  onClick={() => updateForm("aiResponse", !form.aiResponse)}
                />
              </div>
            </div>
          </StepBlock>

          <StepBlock step="4" title="Preview">
            <div className="rounded-xl border bg-muted/35 p-4">
              <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm shadow-sm">
                Hi, I need help with pricing.
              </div>
              <div className="ml-auto mt-3 max-w-[82%] rounded-2xl rounded-br-sm bg-emerald-600 px-3 py-2 text-sm text-white shadow-sm">
                {previewMessage}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill className="bg-green-50 text-green-700">
                  <Send className="h-3 w-3" />
                  Send reply
                </Pill>
                {form.tagId && (
                  <Pill className="bg-blue-50 text-blue-700">
                    <TagIcon className="h-3 w-3" />
                    Add tag
                  </Pill>
                )}
                {form.assignToAgent && (
                  <Pill className="bg-purple-50 text-purple-700">
                    <UserCheck className="h-3 w-3" />
                    Assign
                  </Pill>
                )}
                {form.aiResponse && (
                  <Pill className="bg-gradient-to-r from-fuchsia-100 to-cyan-100 text-slate-800">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </Pill>
                )}
              </div>
            </div>
          </StepBlock>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !form.name.trim()}>
            {saving ? "Saving..." : editing ? "Save Rule" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SimulationPanel({
  message,
  onMessageChange,
  isFirstMessage,
  onFirstMessageChange,
  result,
}: {
  message: string;
  onMessageChange: (message: string) => void;
  isFirstMessage: boolean;
  onFirstMessageChange: (value: boolean) => void;
  result: { rule: Rule | null; response: string };
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Test Automation</h2>
          <p className="text-xs text-muted-foreground">
            Type a customer message and see the first matching rule.
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-purple-600" />
      </div>

      <div className="mt-4 space-y-3">
        <Textarea
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          className="min-h-[96px]"
          placeholder="Type a WhatsApp message"
        />
        <button
          type="button"
          onClick={() => onFirstMessageChange(!isFirstMessage)}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span
            className={cn(
              "flex h-5 w-9 items-center rounded-full p-0.5 transition",
              isFirstMessage ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "h-4 w-4 rounded-full bg-white shadow-sm transition",
                isFirstMessage && "translate-x-4"
              )}
            />
          </span>
          First customer message
        </button>

        <div className="rounded-xl border bg-muted/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Triggered rule
          </p>
          <p className="mt-1 text-sm font-semibold">
            {result.rule ? result.rule.name : "No rule matched"}
          </p>
          <div className="mt-3 rounded-lg bg-white p-3 text-sm shadow-sm">
            {result.response}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  hasRules,
  onCreate,
}: {
  hasRules: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
        <Bot className="h-8 w-8 text-emerald-700" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">
        {hasRules ? "No matching rules" : "No automation yet. Create your first rule."}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {hasRules
          ? "Try changing your search or filters to see more automations."
          : "Start with a welcome message, a pricing keyword, or an AI fallback."}
      </p>
      {!hasRules && (
        <Button className="mt-5" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      )}
    </div>
  );
}

function LogicGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

function SwitchButton({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-6 w-11 items-center rounded-full p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        enabled ? "bg-emerald-600" : "bg-muted-foreground/30"
      )}
      aria-pressed={enabled}
      title={enabled ? "Disable rule" : "Enable rule"}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow-sm transition",
          enabled && "translate-x-5"
        )}
      />
    </button>
  );
}

function IconButton({
  label,
  danger,
  children,
  onClick,
}: {
  label: string;
  danger?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground",
        danger && "hover:bg-red-50 hover:text-red-600"
      )}
    >
      {children}
    </button>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/45 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-5 text-foreground">{value}</p>
    </div>
  );
}

function StepBlock({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {step}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ToggleTile({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition hover:border-primary/40",
        active && "border-primary bg-primary/5 ring-1 ring-primary/20"
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "gray" | "blue";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
  }[tone];

  return (
    <div className={cn("rounded-xl p-3 text-center", toneClass)}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}

function FutureItem({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
}

function getTriggerLabel(trigger: TriggerType) {
  switch (trigger) {
    case "KEYWORD":
      return "Keyword match";
    case "FIRST_MESSAGE":
      return "On first message";
    case "OUTSIDE_HOURS":
      return "Outside business hours";
    case "MEDIA_RECEIVED":
      return "When media is received";
    case "ALL_MESSAGES":
      return "Every message";
  }
}

function getActionLabel(action: AutoAction) {
  switch (action) {
    case "SEND_TEXT":
      return "Send reply";
    case "SEND_CATALOG":
      return "Send catalog";
    case "SEND_GREETING":
      return "Send greeting";
    case "FORWARD_TO_AI":
      return "AI response";
    case "ESCALATE_TO_HUMAN":
      return "Escalate";
    case "SET_TAG":
      return "Add tag";
  }
}

function getActionPills(rule: Rule) {
  const pills: Array<{ label: string; className: string; icon: React.ReactNode }> = [];

  if (rule.responseText || ["SEND_TEXT", "SEND_GREETING", "SEND_CATALOG"].includes(rule.action)) {
    pills.push({
      label: getActionLabel(rule.action),
      className: "bg-green-50 text-green-700",
      icon: <Send className="h-3 w-3" />,
    });
  }

  if (rule.tag) {
    pills.push({
      label: `Tag: ${rule.tag.name}`,
      className: "bg-blue-50 text-blue-700",
      icon: <TagIcon className="h-3 w-3" />,
    });
  }

  if (rule.action === "FORWARD_TO_AI") {
    pills.push({
      label: "AI",
      className: "bg-gradient-to-r from-fuchsia-100 to-cyan-100 text-slate-800",
      icon: <Sparkles className="h-3 w-3" />,
    });
  }

  if (rule.action === "ESCALATE_TO_HUMAN") {
    pills.push({
      label: "Escalate",
      className: "bg-orange-50 text-orange-700",
      icon: <AlertTriangle className="h-3 w-3" />,
    });
    pills.push({
      label: "Assign to agent",
      className: "bg-purple-50 text-purple-700",
      icon: <UserCheck className="h-3 w-3" />,
    });
  }

  if (pills.length === 0) {
    pills.push({
      label: getActionLabel(rule.action),
      className: "bg-green-50 text-green-700",
      icon: <Send className="h-3 w-3" />,
    });
  }

  return pills;
}

function buildPayload(form: RuleFormState, priority: number) {
  const keywords = form.keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  let action: AutoAction = "SEND_TEXT";
  if (form.aiResponse) action = "FORWARD_TO_AI";
  else if (form.escalate || form.assignToAgent) action = "ESCALATE_TO_HUMAN";
  else if (form.tagId && !form.responseText.trim()) action = "SET_TAG";

  return {
    name: form.name.trim(),
    trigger: form.trigger,
    keywords,
    matchMode: form.matchMode,
    action,
    responseText: form.responseText.trim() || null,
    tagId: form.tagId || null,
    priority,
    isActive: form.isActive,
  };
}

function simulateAutomation(
  rules: Rule[],
  message: string,
  isFirstMessage: boolean
): { rule: Rule | null; response: string } {
  const match = rules.find((rule) => rule.isActive && ruleMatches(rule, message, isFirstMessage));

  if (!match) {
    return {
      rule: null,
      response: "No automation will run. The conversation stays in the inbox.",
    };
  }

  return {
    rule: match,
    response:
      match.responseText ||
      (match.action === "FORWARD_TO_AI"
        ? "AI will draft a helpful reply using your business context."
        : match.action === "ESCALATE_TO_HUMAN"
          ? "This conversation will be sent to the team queue."
          : `${getActionLabel(match.action)} will run.`),
  };
}

function ruleMatches(rule: Rule, message: string, isFirstMessage: boolean) {
  const normalizedMessage = message.trim().toLowerCase();

  switch (rule.trigger) {
    case "FIRST_MESSAGE":
      return isFirstMessage;
    case "ALL_MESSAGES":
      return true;
    case "KEYWORD":
      return rule.keywords.some((keyword) => {
        const normalizedKeyword = keyword.toLowerCase();
        if (rule.matchMode === "EXACT") return normalizedMessage === normalizedKeyword;
        if (rule.matchMode === "STARTS_WITH") {
          return normalizedMessage.startsWith(normalizedKeyword);
        }
        return normalizedMessage.includes(normalizedKeyword);
      });
    case "OUTSIDE_HOURS":
    case "MEDIA_RECEIVED":
      return false;
  }
}

function formatRelativeTime(value?: Date | string | null) {
  if (!value) return "Not yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return `${days} days ago`;
}

function getTodayCount(rule: Rule) {
  if (!rule.isActive) return 0;
  return (rule.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + rule.priority) % 36;
}

function getFullConditionText(rule: Rule) {
  if (rule.trigger !== "KEYWORD") return getTriggerLabel(rule.trigger);
  return `${getTriggerLabel(rule.trigger)} · ${rule.matchMode.toLowerCase().replace("_", " ")} · ${rule.keywords.join(", ") || "No keywords"}`;
}

function getActionPreview(action: AutoAction) {
  if (action === "FORWARD_TO_AI") return "AI drafts a response for this customer.";
  if (action === "ESCALATE_TO_HUMAN") return "The conversation moves to the team queue.";
  if (action === "SET_TAG") return "The customer is tagged for follow-up.";
  return `${getActionLabel(action)} is sent to the customer.`;
}
