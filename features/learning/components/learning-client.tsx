"use client";

import { useState, useTransition } from "react";
import { 
  BookOpen, Plus, Trash2, Edit2, AlertCircle, Loader2, Sparkles,
  Bookmark, CheckCircle2, Circle, Eye, HelpCircle, FileText
} from "lucide-react";
import { createLearningItemAction, updateLearningItemAction, deleteLearningItemAction } from "@/features/learning/actions";
import { LearningType, Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface LearningItem {
  id: string;
  title: string;
  type: LearningType;
  status: Status;
  notes: string | null;
  highlights: any | null; // { summary }
}

export function LearningClient({ initialItems }: { initialItems: LearningItem[] }) {
  const [items, setItems] = useState<LearningItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LearningType>("COURSE");
  const [status, setStatus] = useState<Status>("NOT_STARTED");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [formError, setFormError] = useState("");

  const openAddModal = () => {
    setEditingItem(null);
    setTitle("");
    setType("COURSE");
    setStatus("NOT_STARTED");
    setNotes("");
    setSummary("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: LearningItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type);
    setStatus(item.status);
    setNotes(item.notes ?? "");
    setSummary(item.highlights?.summary ?? "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study resource log?")) return;
    startTransition(async () => {
      const res = await deleteLearningItemAction(id);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleStatusToggle = async (item: LearningItem) => {
    const nextStatus = item.status === "DONE" ? "IN_PROGRESS" : "DONE";
    startTransition(async () => {
      const res = await updateLearningItemAction(item.id, { status: nextStatus });
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }

    const payload = {
      title,
      type,
      status,
      notes: notes || null,
      highlights: summary ? { summary } : null,
    };

    startTransition(async () => {
      let res;
      if (editingItem) {
        res = await updateLearningItemAction(editingItem.id, payload);
      } else {
        res = await createLearningItemAction(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "Failed to save study item");
      }
    });
  };

  const filtered = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const TypeBadge = ({ t }: { t: LearningType }) => {
    const colors = {
      COURSE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      BOOK: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      ARTICLE: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      VIDEO: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    };
    return (
      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide", colors[t])}>
        {t}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            Learning Log & Study Resources
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Catalog courses, technical books, video sessions, and write-ups.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Resource
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-zinc-800 pb-4">
        <input
          type="text"
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-40 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="COURSE">Courses</option>
          <option value="BOOK">Books</option>
          <option value="ARTICLE">Articles</option>
          <option value="VIDEO">Videos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center border-zinc-800 bg-zinc-900/10">
          <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-zinc-400">No resources logged</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Track your courses, textbooks, or documentation links here.</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-3 py-1.5 text-xs text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
          >
            Log Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div 
              key={item.id}
              className="card border-border/40 bg-zinc-900/30 p-4 hover:border-zinc-800 transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleStatusToggle(item)}
                      className="focus:outline-none"
                    >
                      {item.status === "DONE" ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-zinc-600" />
                      )}
                    </button>
                    <span className={cn(
                      "font-semibold text-sm text-white",
                      item.status === "DONE" && "line-through text-zinc-500"
                    )}>
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 text-zinc-500 hover:text-white rounded"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <TypeBadge t={item.type} />
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                    {item.status}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-zinc-400 bg-zinc-950/40 p-2 border border-zinc-800/40 rounded-md">
                    {item.notes}
                  </p>
                )}
              </div>

              {item.highlights?.summary && (
                <div className="border-t border-zinc-800/40 pt-3 text-[11px] text-zinc-500 flex items-start gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <p className="line-clamp-2">{item.highlights.summary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingItem ? "Edit Study Resource" : "Log Study Resource"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-2.5 rounded text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Resource Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Designing Data-Intensive Applications"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Resource Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LearningType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="COURSE">Course</option>
                    <option value="BOOK">Book</option>
                    <option value="ARTICLE">Article</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Log Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Review schedules, chapters, links..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              {/* Summary / Highlights */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Key Takeaway Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One sentence summary of the core thesis..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3.5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-black bg-accent rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editingItem ? "Save Changes" : "Log Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
