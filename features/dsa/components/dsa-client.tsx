"use client";

import { useState, useTransition } from "react";
import { 
  Plus, Edit2, Trash2, Calendar, AlertCircle, Search, 
  Bookmark, BookmarkCheck, Sparkles, RefreshCcw, Check,
  ExternalLink, Code2, Loader2, HelpCircle
} from "lucide-react";
import { createDsaProblemAction, updateDsaProblemAction, deleteDsaProblemAction, markAsRevisedAction } from "@/features/dsa/actions";
import { Platform, Difficulty } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface DsaProblem {
  id: string;
  userId: string;
  title: string;
  platform: Platform;
  difficulty: Difficulty;
  topic: string[];
  companyTags: string[];
  timeTakenMins: number | null;
  mistakes: string | null;
  confidence: number;
  revisionCount: number;
  bookmarked: boolean;
  solvedAt: string;
  nextRevisionAt: string | null;
}

export function DsaClient({ initialProblems, initialQueue }: { initialProblems: DsaProblem[]; initialQueue: DsaProblem[] }) {
  const [problems, setProblems] = useState<DsaProblem[]>(initialProblems);
  const [queue, setQueue] = useState<DsaProblem[]>(initialQueue);
  const [activeTab, setActiveTab] = useState<"ALL" | "REVISION">("ALL");
  const [isPending, startTransition] = useTransition();

  // Search and filter state
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterPlatform, setFilterPlatform] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<DsaProblem | null>(null);

  // Quick Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisingProblem, setRevisingProblem] = useState<DsaProblem | null>(null);
  const [newConfidence, setNewConfidence] = useState(3);

  // Form State
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("LEETCODE");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [confidence, setConfidence] = useState(3);
  const [timeTakenMins, setTimeTakenMins] = useState("");
  const [mistakes, setMistakes] = useState("");
  const [topicsStr, setTopicsStr] = useState("");
  const [companiesStr, setCompaniesStr] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [solvedAt, setSolvedAt] = useState("");
  const [formError, setFormError] = useState("");

  const openAddModal = () => {
    setEditingProblem(null);
    setTitle("");
    setPlatform("LEETCODE");
    setDifficulty("MEDIUM");
    setConfidence(3);
    setTimeTakenMins("");
    setMistakes("");
    setTopicsStr("");
    setCompaniesStr("");
    setBookmarked(false);
    setSolvedAt(new Date().toISOString().split("T")[0]);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (problem: DsaProblem) => {
    setEditingProblem(problem);
    setTitle(problem.title);
    setPlatform(problem.platform);
    setDifficulty(problem.difficulty);
    setConfidence(problem.confidence);
    setTimeTakenMins(problem.timeTakenMins?.toString() ?? "");
    setMistakes(problem.mistakes ?? "");
    setTopicsStr(problem.topic.join(", "));
    setCompaniesStr(problem.companyTags.join(", "));
    setBookmarked(problem.bookmarked);
    setSolvedAt(new Date(problem.solvedAt).toISOString().split("T")[0]);
    setFormError("");
    setIsModalOpen(true);
  };

  const openQuickRevision = (problem: DsaProblem) => {
    setRevisingProblem(problem);
    setNewConfidence(problem.confidence);
    setIsRevisionModalOpen(true);
  };

  const handleBookmarkToggle = async (problem: DsaProblem) => {
    startTransition(async () => {
      const res = await updateDsaProblemAction(problem.id, { bookmarked: !problem.bookmarked });
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleDelete = async (problemId: string) => {
    if (!confirm("Are you sure you want to delete this solved log?")) return;
    startTransition(async () => {
      const res = await deleteDsaProblemAction(problemId);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingProblem) return;

    startTransition(async () => {
      const res = await markAsRevisedAction(revisingProblem.id, newConfidence);
      if (res.success) {
        setIsRevisionModalOpen(false);
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

    const topic = topicsStr.split(",").map(s => s.trim()).filter(s => s.length > 0);
    const companyTags = companiesStr.split(",").map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
      title,
      platform,
      difficulty,
      confidence,
      timeTakenMins: timeTakenMins ? parseInt(timeTakenMins) : null,
      mistakes: mistakes || null,
      topic,
      companyTags,
      bookmarked,
      solvedAt: solvedAt ? new Date(solvedAt) : new Date(),
    };

    startTransition(async () => {
      let res;
      if (editingProblem) {
        res = await updateDsaProblemAction(editingProblem.id, payload);
      } else {
        res = await createDsaProblemAction(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "Failed to save details");
      }
    });
  };

  // Filter problems logic
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.topic.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
                          p.companyTags.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchesDifficulty = filterDifficulty === "ALL" || p.difficulty === filterDifficulty;
    const matchesPlatform = filterPlatform === "ALL" || p.platform === filterPlatform;
    return matchesSearch && matchesDifficulty && matchesPlatform;
  });

  const DifficultyBadge = ({ d }: { d: Difficulty }) => {
    const colors = {
      EASY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      HARD: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide", colors[d])}>
        {d}
      </span>
    );
  };

  const PlatformBadge = ({ p }: { p: Platform }) => {
    const colors = {
      LEETCODE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      CODEFORCES: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      GFG: "bg-green-500/10 text-green-400 border-green-500/20",
      OTHER: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };
    return (
      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide", colors[p])}>
        {p}
      </span>
    );
  };

  const ConfidenceMeter = ({ value }: { value: number }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={cn(
              "h-2 w-2 rounded-full border",
              star <= value
                ? "bg-amber-500 border-amber-600"
                : "bg-zinc-800 border-zinc-700"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <Code2 className="h-5 w-5 text-accent" />
            DSA solved logs & Spaced Repetition Queue
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track your Leetcode solved logs and get revision alerts automatically.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Problem
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab("ALL")}
          className={cn(
            "px-4 py-2 text-xs font-semibold border-b-2 -mb-[2px] transition-all",
            activeTab === "ALL" 
              ? "border-accent text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          All Solved Logs ({problems.length})
        </button>
        <button
          onClick={() => setActiveTab("REVISION")}
          className={cn(
            "px-4 py-2 text-xs font-semibold border-b-2 -mb-[2px] transition-all flex items-center gap-1.5",
            activeTab === "REVISION" 
              ? "border-accent text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          Revision Queue
          {queue.length > 0 && (
            <span className="rounded-full bg-accent/20 border border-accent/30 text-accent px-1.5 py-0.5 text-[10px] font-bold">
              {queue.length} due
            </span>
          )}
        </button>
      </div>

      {activeTab === "ALL" ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by title, topics, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-border/60 rounded px-8 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="select text-xs bg-zinc-900 border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>

              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="select text-xs bg-zinc-900 border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5"
              >
                <option value="ALL">All Platforms</option>
                <option value="LEETCODE">LeetCode</option>
                <option value="CODEFORCES">Codeforces</option>
                <option value="GFG">GeeksforGeeks</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border border-border/40 bg-zinc-900/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-zinc-950/60 text-zinc-400 font-medium select-none">
                  <th className="py-2.5 px-3 w-10"></th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Solved At</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3 text-center">Revisions</th>
                  <th className="py-2.5 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      <HelpCircle className="h-6 w-6 mx-auto mb-1 text-zinc-600" />
                      No solved problems logged yet or matches found.
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map((problem) => (
                    <tr 
                      key={problem.id}
                      className="hover:bg-zinc-900/30 group transition-colors"
                    >
                      {/* Bookmark Icon */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleBookmarkToggle(problem)}
                          className={cn(
                            "text-zinc-500 hover:text-amber-500 transition-colors",
                            problem.bookmarked && "text-amber-500"
                          )}
                        >
                          {problem.bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        </button>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{problem.title}</span>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {problem.topic.map(t => (
                              <span key={t} className="bg-zinc-800 text-[10px] text-zinc-400 px-1 py-0.5 rounded">{t}</span>
                            ))}
                            {problem.companyTags.map(c => (
                              <span key={c} className="bg-accent-soft text-[10px] text-accent px-1 py-0.5 rounded">{c}</span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-3">
                        <PlatformBadge p={problem.platform} />
                      </td>

                      {/* Difficulty */}
                      <td className="py-3 px-3">
                        <DifficultyBadge d={problem.difficulty} />
                      </td>

                      {/* Solved Date */}
                      <td className="py-3 px-3 text-zinc-400">
                        {new Date(problem.solvedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-3">
                        <ConfidenceMeter value={problem.confidence} />
                      </td>

                      {/* Revisions */}
                      <td className="py-3 px-3 text-center text-zinc-400 font-semibold">
                        {problem.revisionCount}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openQuickRevision(problem)}
                            title="Quick Revision Check"
                            className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(problem)}
                            title="Edit solved log"
                            className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(problem.id)}
                            title="Delete"
                            className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Revision queue view
        <div className="space-y-4">
          <div className="bg-accent-soft/20 border border-accent/20 rounded p-4 flex gap-3 items-start">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white">Spaced Repetition Algorithm Active</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Problems solved with lower confidence are scheduled sooner for revision. Review them regularly to keep your streak alive and sharpen your recall.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queue.length === 0 ? (
              <div className="col-span-full card p-8 text-center border-zinc-800 bg-zinc-900/10">
                <HelpCircle className="h-7 w-7 text-zinc-600 mx-auto mb-1.5" />
                <h4 className="text-xs font-semibold text-zinc-400">Queue is clean!</h4>
                <p className="text-xs text-zinc-500 mt-1">No problems are currently due for spaced revision.</p>
              </div>
            ) : (
              queue.map((problem) => {
                const diffTime = new Date(problem.nextRevisionAt!).getTime() - Date.now();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const overDue = diffDays <= 0;

                return (
                  <div 
                    key={problem.id}
                    className="card p-4 border-border/40 bg-zinc-900/30 flex flex-col justify-between gap-3 hover:border-zinc-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-white">{problem.title}</span>
                        <DifficultyBadge d={problem.difficulty} />
                      </div>
                      
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        <PlatformBadge p={problem.platform} />
                        {problem.topic.slice(0, 2).map(t => (
                          <span key={t} className="bg-zinc-800 text-[10px] text-zinc-500 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          Solved: {new Date(problem.solvedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                        <span className={cn(
                          "font-medium",
                          overDue ? "text-red-400" : "text-zinc-500"
                        )}>
                          {overDue ? "Revision Overdue" : `Due in ${diffDays}d`}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/60 pt-3 flex items-center justify-between mt-1">
                      <ConfidenceMeter value={problem.confidence} />
                      <button
                        onClick={() => openQuickRevision(problem)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-black bg-accent hover:bg-accent-hover rounded flex items-center gap-1 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Resolve Revision
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Log/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingProblem ? "Edit Logged Problem" : "Log New Solved Problem"}
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
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 3Sum"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Platform & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as Platform)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="LEETCODE">LeetCode</option>
                    <option value="CODEFORCES">Codeforces</option>
                    <option value="GFG">GeeksforGeeks</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Time taken & Solved date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Time Taken (mins)</label>
                  <input
                    type="number"
                    value={timeTakenMins}
                    onChange={(e) => setTimeTakenMins(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Solved Date</label>
                  <input
                    type="date"
                    value={solvedAt}
                    onChange={(e) => setSolvedAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Confidence */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Confidence Score (1-5)</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setConfidence(num)}
                      className={cn(
                        "w-8 h-8 rounded border text-xs font-semibold flex items-center justify-center transition-all",
                        confidence >= num
                          ? "bg-amber-500 border-amber-600 text-black font-bold"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                  <span className="text-xs text-zinc-500 ml-2">
                    {confidence === 5 ? "Perfect" : confidence === 4 ? "Solid" : confidence === 3 ? "Standard" : confidence === 2 ? "Shaky" : "Help required"}
                  </span>
                </div>
              </div>

              {/* Topics & Companies */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Topics (comma separated)</label>
                  <input
                    type="text"
                    value={topicsStr}
                    onChange={(e) => setTopicsStr(e.target.value)}
                    placeholder="e.g. Arrays, Two Pointers"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Companies (comma separated)</label>
                  <input
                    type="text"
                    value={companiesStr}
                    onChange={(e) => setCompaniesStr(e.target.value)}
                    placeholder="e.g. Google, Amazon"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Mistakes/Notes */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Key mistakes or lessons</label>
                <textarea
                  value={mistakes}
                  onChange={(e) => setMistakes(e.target.value)}
                  placeholder="e.g. Forgot index boundary checks on empty array"
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
                />
              </div>

              {/* Bookmark */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bookmarked"
                  checked={bookmarked}
                  onChange={(e) => setBookmarked(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-accent focus:ring-accent"
                />
                <label htmlFor="bookmarked" className="text-xs text-zinc-400 select-none cursor-pointer">Bookmark this problem for future review</label>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3.5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-black bg-accent rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editingProblem ? "Save Changes" : "Log Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Revision Modal */}
      {isRevisionModalOpen && revisingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <RefreshCcw className="h-4 w-4 text-accent" />
                Quick Revision Check
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Re-solved: <span className="font-semibold text-zinc-300">{revisingProblem.title}</span></p>
            </div>

            <form onSubmit={handleRevisionSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">New Confidence Score</label>
                <div className="flex justify-between items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setNewConfidence(num)}
                      className={cn(
                        "w-10 h-10 rounded border text-xs font-bold flex items-center justify-center transition-all",
                        newConfidence >= num
                          ? "bg-amber-500 border-amber-600 text-black font-bold"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs text-zinc-500 mt-3.5">
                  Next revision automatically scheduled in {newConfidence === 5 ? "30 days" : newConfidence === 4 ? "14 days" : newConfidence === 3 ? "7 days" : newConfidence === 2 ? "3 days" : "1 day"}.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3.5">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-black bg-accent rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {isPending ? "Logging..." : "Confirm Solved"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
