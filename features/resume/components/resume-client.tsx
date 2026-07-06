"use client";

import { useState, useTransition } from "react";
import { 
  FileText, Plus, Trash2, Edit2, AlertCircle, Loader2, Sparkles,
  Link, Calendar, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { createResumeAction, updateResumeAction, deleteResumeAction } from "@/features/resume/actions";
import { cn } from "@/lib/utils";

interface ResumeVersion {
  id: string;
  label: string;
  targetRole: string | null;
  fileUrl: string | null;
  starStories: any | null; // { situation, task, action, result }
  createdAt: string;
}

export function ResumeClient({ initialResumes }: { initialResumes: ResumeVersion[] }) {
  const [resumes, setResumes] = useState<ResumeVersion[]>(initialResumes);
  const [isPending, startTransition] = useTransition();

  // Expanded stories state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<ResumeVersion | null>(null);

  // Form State
  const [label, setLabel] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [storySit, setStorySit] = useState("");
  const [storyTask, setStoryTask] = useState("");
  const [storyAct, setStoryAct] = useState("");
  const [storyRes, setStoryRes] = useState("");
  const [formError, setFormError] = useState("");

  const openAddModal = () => {
    setEditingResume(null);
    setLabel("");
    setTargetRole("Backend Engineer");
    setFileUrl("");
    setStorySit("");
    setStoryTask("");
    setStoryAct("");
    setStoryRes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (res: ResumeVersion) => {
    setEditingResume(res);
    setLabel(res.label);
    setTargetRole(res.targetRole ?? "");
    setFileUrl(res.fileUrl ?? "");
    setStorySit(res.starStories?.situation ?? "");
    setStoryTask(res.starStories?.task ?? "");
    setStoryAct(res.starStories?.action ?? "");
    setStoryRes(res.starStories?.result ?? "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume version?")) return;
    startTransition(async () => {
      const res = await deleteResumeAction(id);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!label.trim()) {
      setFormError("Label is required");
      return;
    }

    const payload = {
      label,
      targetRole: targetRole || null,
      fileUrl: fileUrl || null,
      starStories: (storySit || storyTask || storyAct || storyRes) ? {
        situation: storySit,
        task: storyTask,
        action: storyAct,
        result: storyRes
      } : null,
    };

    startTransition(async () => {
      let res;
      if (editingResume) {
        res = await updateResumeAction(editingResume.id, payload);
      } else {
        res = await createResumeAction(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "Failed to save version");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Resume Hub & STAR Stories
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage job-specific resume variants and track STAR method responses.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Version
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="card p-8 text-center border-zinc-800 bg-zinc-900/10">
          <FileText className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-zinc-400">No resumes registered</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Upload and track specific resume variations customized for different roles.</p>
          <button
            onClick={openAddModal}
            className="mt-4 px-3 py-1.5 text-xs text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
          >
            Log Resume
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {resumes.map((res) => {
            const isExpanded = expandedId === res.id;
            return (
              <div 
                key={res.id}
                className="card border-border/40 bg-zinc-900/30 p-5 hover:border-zinc-800 transition-all space-y-4 group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800 shrink-0">
                      <FileText className="h-4.5 w-4.5 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm">{res.label}</h3>
                        {res.targetRole && (
                          <span className="text-zinc-500 text-xs">for {res.targetRole}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Added {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                        {res.fileUrl && (
                          <a 
                            href={res.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-0.5 text-accent hover:underline"
                          >
                            <Link className="h-3 w-3" />
                            Document URL
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {res.starStories && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : res.id)}
                        className="px-2 py-1 text-xs text-zinc-400 border border-zinc-800 hover:text-white rounded bg-zinc-950 flex items-center gap-1"
                      >
                        STAR Story
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(res)}
                      className="p-1 text-zinc-500 hover:text-white rounded"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* STAR Story Breakdown */}
                {isExpanded && res.starStories && (
                  <div className="bg-zinc-950/60 border border-zinc-800/40 p-4 rounded-md space-y-3.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span className="font-bold text-white uppercase tracking-wider text-[10px]">Behavioral STAR Story Breakdown</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {res.starStories.situation && (
                        <div className="space-y-1">
                          <strong className="text-zinc-500 uppercase tracking-wide text-[9px]">Situation</strong>
                          <p className="leading-relaxed bg-zinc-900/40 p-2 rounded border border-zinc-800/40">{res.starStories.situation}</p>
                        </div>
                      )}
                      {res.starStories.task && (
                        <div className="space-y-1">
                          <strong className="text-zinc-500 uppercase tracking-wide text-[9px]">Task</strong>
                          <p className="leading-relaxed bg-zinc-900/40 p-2 rounded border border-zinc-800/40">{res.starStories.task}</p>
                        </div>
                      )}
                      {res.starStories.action && (
                        <div className="space-y-1">
                          <strong className="text-zinc-500 uppercase tracking-wide text-[9px]">Action Taken</strong>
                          <p className="leading-relaxed bg-zinc-900/40 p-2 rounded border border-zinc-800/40">{res.starStories.action}</p>
                        </div>
                      )}
                      {res.starStories.result && (
                        <div className="space-y-1">
                          <strong className="text-emerald-500 uppercase tracking-wide text-[9px]">Result</strong>
                          <p className="leading-relaxed bg-emerald-500/5 p-2 rounded border border-emerald-500/10 text-emerald-400">{res.starStories.result}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingResume ? "Edit Resume Settings" : "Add Resume Version"}
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
              {/* Label */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Resume Variant Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Google-Specific Resume, Systems Eng V1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Role & URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Target Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Backend Engineer"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">PDF File URL</label>
                  <input
                    type="text"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="e.g. https://drive.google.com/..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* STAR Stories Section */}
              <div className="border-t border-zinc-800 pt-3.5 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Link a STAR Behavioral Story
                </h4>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Situation (Context)</label>
                  <textarea
                    value={storySit}
                    onChange={(e) => setStorySit(e.target.value)}
                    placeholder="Describe the challenge or situation you faced..."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Task (Goal)</label>
                    <textarea
                      value={storyTask}
                      onChange={(e) => setStoryTask(e.target.value)}
                      placeholder="What needed to be done?"
                      rows={2}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase mb-1">Action (What you did)</label>
                    <textarea
                      value={storyAct}
                      onChange={(e) => setStoryAct(e.target.value)}
                      placeholder="Detail your personal actions..."
                      rows={2}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-emerald-500 uppercase mb-1 font-semibold">Result (Outcome / Metrics)</label>
                  <textarea
                    value={storyRes}
                    onChange={(e) => setStoryRes(e.target.value)}
                    placeholder="What did you achieve? (e.g. Reduced cache latency by 40%)"
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none resize-none focus:border-emerald-500/55"
                  />
                </div>
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
                  {editingResume ? "Save Changes" : "Log Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
