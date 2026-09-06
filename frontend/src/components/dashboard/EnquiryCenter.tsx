"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Clock3,
  HelpCircle,
  Inbox,
  Layers,
  Loader2,
  MessageCircleQuestion,
  Newspaper,
  PenSquare,
  Send,
  Trash2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/providers/AuthProvider";
import { queryKeys } from "@/lib/queryKeys";
import {
  createEnquiry,
  getEnquiries,
  getEnquiryStats,
  resolveEnquiry,
} from "@/lib/api/enquiries";
import { createNews, deleteNews, getNews, updateNews } from "@/lib/api/news";
import type {
  Enquiry,
  EnquiryCategory,
  EnquiryStats,
  EnquiryStatus,
  NewsItem,
} from "@/lib/api/types";

const CATEGORIES: { value: EnquiryCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "ticketing", label: "Ticketing" },
  { value: "lost_and_found", label: "Lost & Found" },
  { value: "safety", label: "Safety" },
  { value: "technical", label: "Technical" },
  { value: "complaint", label: "Complaint" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" },
];

function categoryLabel(value: EnquiryCategory) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function StatusBadge({ status }: { status: EnquiryStatus }) {
  if (status === "resolved") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
        <CheckCircle2 size={12} />
        Resolved
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
        <Wrench size={12} />
        In progress
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      <Clock3 size={12} />
      Open
    </span>
  );
}


function EnquiryStatsBar({
  stats,
  loading,
}: {
  stats: EnquiryStats | null;
  loading: boolean;
}) {
  const cards: {
    label: string;
    value: number;
    icon: typeof Layers;
    tone: string;
  }[] = [
    { label: "Total", value: stats?.total ?? 0, icon: Layers, tone: "text-foreground" },
    { label: "Open", value: stats?.open ?? 0, icon: Clock3, tone: "text-primary" },
    {
      label: "In progress",
      value: stats?.in_progress ?? 0,
      icon: Wrench,
      tone: "text-amber-500",
    },
    {
      label: "Resolved",
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      tone: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${c.tone}`}>
            <c.icon size={14} />
            {c.label}
          </div>
          <p className="mt-2 text-2xl font-bold">
            {loading ? <Loader2 size={18} className="animate-spin" /> : c.value}
          </p>
        </div>
      ))}
    </div>
  );
}


function EnquiryCard({
  enquiry,
  canManage,
  onResolved,
}: {
  enquiry: Enquiry;
  canManage: boolean;
  onResolved: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReply(status: EnquiryStatus, e?: FormEvent) {
    e?.preventDefault();
    if (!reply.trim()) {
      setError("Enter a reply before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resolveEnquiry(enquiry.id, { admin_reply: reply.trim(), status });
      setReplying(false);
      setReply("");
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit reply.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border p-5 transition hover:border-primary">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{enquiry.subject}</h4>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {categoryLabel(enquiry.category)}
            </span>
            <StatusBadge status={enquiry.status} />
          </div>
          {canManage && enquiry.user && (
            <p className="mt-1 text-xs text-muted">
              From {enquiry.user.full_name}
              {enquiry.user.email ? ` · ${enquiry.user.email}` : ""}
            </p>
          )}
        </div>
        <p className="text-xs text-muted">
          {new Date(enquiry.created_at).toLocaleString()}
        </p>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-muted">
        {enquiry.message}
      </p>

      {enquiry.admin_reply && (
        <div className="mt-4 rounded-xl bg-muted/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground">
            Response from the metro team
            {enquiry.resolved_at
              ? ` · ${new Date(enquiry.resolved_at).toLocaleString()}`
              : ""}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm">{enquiry.admin_reply}</p>
        </div>
      )}

      {canManage && enquiry.status !== "resolved" && (
        <div className="mt-4">
          {!replying ? (
            <Button size="sm" variant="outline" onClick={() => setReplying(true)}>
              <MessageCircleQuestion size={14} />
              Respond
            </Button>
          ) : (
            <form onSubmit={(e) => handleReply("resolved", e)} className="space-y-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Write a reply for the passenger..."
                className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Reply &amp; resolve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleReply("in_progress")}
                >
                  <Wrench size={14} />
                  Reply &amp; mark in progress
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplying(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}


function NewsFeed() {
  const news = useApiData(queryKeys.news, (signal) => getNews(false, signal), []);

  return (
    <div className="space-y-4">
      {news.loading ? (
        <p className="text-sm text-muted">Loading news...</p>
      ) : news.error ? (
        <p className="text-sm text-red-500">{news.error}</p>
      ) : (news.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-border p-6 text-center">
          <Newspaper className="mx-auto text-muted" size={24} />
          <p className="mt-3 text-sm text-muted">
            No news has been published yet. Check back soon.
          </p>
        </div>
      ) : (
        (news.data ?? []).map((item) => (
          <div key={item.id} className="rounded-2xl border border-border p-5">
            <h4 className="font-semibold">{item.title}</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
              {item.content}
            </p>
            <p className="mt-3 text-xs text-muted">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}



function ReceivingPanel({
  stats,
  statsLoading,
}: {
  stats: EnquiryStats | null;
  statsLoading: boolean;
}) {
  const mine = useApiData(queryKeys.enquiries, (signal) => getEnquiries(undefined, signal), []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Sent Enquiries</h2>
        <p className="mt-1 text-sm text-muted">
          Every enquiry you&apos;ve sent, and the metro team&apos;s reply once
          they respond.
        </p>
      </div>

      <EnquiryStatsBar stats={stats} loading={statsLoading} />

      {mine.loading ? (
        <p className="text-sm text-muted">Loading your enquiries...</p>
      ) : mine.error ? (
        <p className="text-sm text-red-500">{mine.error}</p>
      ) : (mine.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-border p-6 text-center">
          <HelpCircle className="mx-auto text-muted" size={24} />
          <p className="mt-3 text-sm text-muted">
            You haven&apos;t sent any enquiries yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(mine.data ?? []).map((enquiry) => (
            <EnquiryCard
              key={enquiry.id}
              enquiry={enquiry}
              canManage={false}
              onResolved={mine.refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function SendingPanel({ onCreated }: { onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<EnquiryCategory>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 5) {
      setError("Add a short subject and a short description of your enquiry.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createEnquiry({
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      setSubject("");
      setCategory("general");
      setMessage("");
      setSuccess("Your enquiry has been sent. The metro team will respond soon.");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Send a New Enquiry</h2>
        <p className="mt-1 text-sm text-muted">
          Tell us what happened - our team typically responds within one
          business day.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-card p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="e.g. Lost my bag on the Blue Line"
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EnquiryCategory)}
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Describe your enquiry</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Tell us what happened, when, and at which station - as much detail as you can."
            className="w-full rounded-xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
        )}
        {success && (
          <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-600">
            {success}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {submitting ? "Sending..." : "Send enquiry"}
        </Button>
      </form>
    </div>
  );
}


function ManageNews() {
  const news = useApiData(queryKeys.news, (signal) => getNews(true, signal), []);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || content.trim().length < 3) {
      setError("Add a title and some content for the announcement.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createNews({ title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      setFormOpen(false);
      news.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish the news item.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item: NewsItem) {
    setBusyId(item.id);
    try {
      await updateNews(item.id, { is_active: !item.is_active });
      news.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: NewsItem) {
    setBusyId(item.id);
    try {
      await deleteNews(item.id);
      news.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-bold">News &amp; Announcements</h2>
          <p className="mt-1 text-sm text-muted">
            Published here appears on every passenger&apos;s Latest News feed.
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen((v) => !v)}>
          <PenSquare size={16} />
          {formOpen ? "Cancel" : "Post news"}
        </Button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-3xl border border-border bg-card p-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Green Line extended service on weekends"
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Details passengers should know..."
              className="w-full rounded-xl border border-border bg-card p-4 text-sm outline-none focus:border-primary"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Newspaper size={16} />
            )}
            {submitting ? "Publishing..." : "Publish"}
          </Button>
        </form>
      )}

      <div className="rounded-3xl border border-border bg-card p-6">
        {news.loading ? (
          <p className="text-sm text-muted">Loading news...</p>
        ) : news.error ? (
          <p className="text-sm text-red-500">{news.error}</p>
        ) : (news.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">No news items yet.</p>
        ) : (
          <div className="space-y-4">
            {(news.data ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border p-5"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{item.title}</h4>
                    {!item.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        Unpublished
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                    {item.content}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => toggleActive(item)}
                  >
                    {item.is_active ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function ReceivingInbox({
  stats,
  statsLoading,
  onChange,
}: {
  stats: EnquiryStats | null;
  statsLoading: boolean;
  onChange: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("open");
  const enquiries = useApiData(
    queryKeys.enquiries,
    (signal) => getEnquiries(statusFilter === "all" ? undefined : statusFilter, signal),
    [statusFilter],
  );

  function handleResolved() {
    enquiries.refresh();
    onChange();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-bold">Enquiry Inbox</h2>
          <p className="mt-1 text-sm text-muted">
            Every enquiry passengers have sent, newest first. Reply to respond
            and resolve.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EnquiryStatus | "all")}
          className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <EnquiryStatsBar stats={stats} loading={statsLoading} />

      <div className="rounded-3xl border border-border bg-card p-6">
        {enquiries.loading ? (
          <p className="text-sm text-muted">Loading enquiries...</p>
        ) : enquiries.error ? (
          <p className="text-sm text-red-500">{enquiries.error}</p>
        ) : (enquiries.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-border p-6 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={24} />
            <p className="mt-3 text-sm text-muted">
              No enquiries match this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(enquiries.data ?? []).map((enquiry) => (
              <EnquiryCard
                key={enquiry.id}
                enquiry={enquiry}
                canManage
                onResolved={handleResolved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


type PassengerTab = "news" | "receiving" | "sending";
type StaffTab = "receiving" | "news";

export default function EnquiryCenter() {
  const { profile } = useAuth();
  const isStaff = profile?.role === "admin" || profile?.role === "operator";

  const stats = useApiData(
    queryKeys.enquiryStats,
    (signal) => getEnquiryStats(signal),
    [],
  );

  const [passengerTab, setPassengerTab] = useState<PassengerTab>("news");
  const [staffTab, setStaffTab] = useState<StaffTab>("receiving");

  if (isStaff) {
    const tabs: { key: StaffTab; label: string; icon: typeof Newspaper }[] = [
      { key: "receiving", label: "Receiving (Inbox)", icon: Inbox },
      { key: "news", label: "Manage News", icon: Newspaper },
    ];
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStaffTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                staffTab === tab.key
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-muted"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        {staffTab === "receiving" ? (
          <ReceivingInbox
            stats={stats.data}
            statsLoading={stats.loading}
            onChange={stats.refresh}
          />
        ) : (
          <ManageNews />
        )}
      </div>
    );
  }

  const tabs: { key: PassengerTab; label: string; icon: typeof Newspaper }[] = [
    { key: "news", label: "Latest News", icon: Newspaper },
    { key: "sending", label: "Sending", icon: Send },
    { key: "receiving", label: "Receiving", icon: Inbox },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPassengerTab(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              passengerTab === tab.key
                ? "bg-primary text-white"
                : "text-muted hover:bg-muted"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {passengerTab === "news" && <NewsFeed />}
      {passengerTab === "sending" && (
        <SendingPanel
          onCreated={() => {
            setPassengerTab("receiving");
            stats.refresh();
          }}
        />
      )}
      {passengerTab === "receiving" && (
        <ReceivingPanel stats={stats.data} statsLoading={stats.loading} />
      )}
    </div>
  );
}