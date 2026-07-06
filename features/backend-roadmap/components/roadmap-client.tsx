"use client";

import { useState, useTransition } from "react";
import { 
  GitBranch, Plus, Trash2, Edit2, Sparkles, BookOpen, 
  HelpCircle, AlertCircle, Loader2, ArrowUpRight
} from "lucide-react";
import { createRoadmapItemAction, updateRoadmapItemAction, deleteRoadmapItemAction } from "@/features/backend-roadmap/actions";
import { cn } from "@/lib/utils";

interface RoadmapItem {
  id: string;
  topic: string;
  category: string;
  confidence: number;
  progress: number;
  notes: string | null;
  projectIds: string[];
}

export function RoadmapClient({ initialItems }: { initialItems: RoadmapItem[] }) {
  const [items, setItems] = useState<RoadmapItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  // Form State
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("System Design");
  const [confidence, setConfidence] = useState(1);
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const openAddModal = () => {
    setEditingItem(null);
    setTopic("");
    setCategory("System Design");
    setConfidence(1);
    setProgress(0);
    setNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: RoadmapItem) => {
    setEditingItem(item);
    setTopic(item.topic);
    setCategory(item.category);
    setConfidence(item.confidence);
    setProgress(item.progress);
    setNotes(item.notes ?? "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this topic from your roadmap?")) return;
    startTransition(async () => {
      const res = await deleteRoadmapItemAction(id);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!topic.trim()) {
      setFormError("Topic is required");
      return;
    }

    const payload = {
      topic,
      category,
      confidence,
      progress,
      notes: notes || null,
    };

    startTransition(async () => {
      let res;
      if (editingItem) {
        res = await updateRoadmapItemAction(editingItem.id, payload);
      } else {
        res = await createRoadmapItemAction(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "Something went wrong");
      }
    });
  };

  // Group by category
  const categories = Array.from(new Set(items.map(item => item.category)));

  // If no items, we seed some default backend roadmap items for excellent SDE-1 density!
  const defaultTopics = [
    { topic: "HTTP Protocol & REST APIs", category: "Networking" },
    { topic: "SQL Indexing & Query Tuning", category: "Databases" },
    { topic: "Redis Caching Strategies", category: "Databases" },
    { topic: "Docker & Containerization", category: "DevOps" },
    { topic: "OAuth 2.0 & JWT Security", category: "Security" },
    { topic: "Load Balancing & Horizontal Scaling", category: "System Design" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-accent" />
            Backend Engineering Roadmap
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track your conceptual mastery of backend system fundamentals.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Topic
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center border-zinc-800 bg-zinc-900/10">
          <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-zinc-400">No roadmap topics added</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Click below to auto-seed standard backend topics to start tracking.</p>
          <button
            onClick={async () => {
              startTransition(async () => {
                for (const t of defaultTopics) {
                  await createRoadmapItemAction({
                    topic: t.topic,
                    category: t.category,
                    confidence: 1,
                    progress: 0,
                  });
                }
                window.location.reload();
              });
            }}
            disabled={isPending}
            className="mt-4 px-3 py-1.5 text-xs text-black font-semibold bg-accent rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {isPending ? "Seeding..." : "Auto-Seed Backend Topics"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-l-2 border-accent pl-2">
                {cat}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items
                  .filter(item => item.category === cat)
                  .map(item => (
                    <div 
                      key={item.id}
                      className="card p-4 border-border/40 bg-zinc-900/30 hover:border-zinc-800 transition-all flex flex-col justify-between gap-4 group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-white group-hover:text-accent transition-colors">
                            {item.topic}
                          </h3>
                          {item.notes && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.notes}</p>
                          )}
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

                      <div className="space-y-2 border-t border-zinc-800/40 pt-3">
                        {/* Confidence Meter */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">Confidence</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={cn(
                                  "h-1.5 w-6 rounded-xs",
                                  level <= item.confidence
                                    ? "bg-accent"
                                    : "bg-zinc-800"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs text-zinc-500">
                            <span>Syllabus Covered</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
                {editingItem ? "Edit Topic Details" : "Add Roadmap Topic"}
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
              {/* Topic */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Distributed Caching"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="System Design">System Design</option>
                  <option value="Databases">Databases & Cache</option>
                  <option value="Networking">Networking & Security</option>
                  <option value="DevOps">DevOps & Cloud</option>
                  <option value="SDE Core">SDE Core Concepts</option>
                </select>
              </div>

              {/* Confidence */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Confidence (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setConfidence(lvl)}
                      className={cn(
                        "w-8 h-8 rounded border text-xs font-semibold",
                        confidence >= lvl
                          ? "bg-accent border-accent-hover text-black"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Progress ({progress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Study Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key concepts, definitions, resources..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
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
                  {editingItem ? "Save Changes" : "Add Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
