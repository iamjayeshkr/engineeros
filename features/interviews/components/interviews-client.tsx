"use client";

import { useState, useTransition } from "react";
import { 
  Briefcase, Plus, Trash2, Edit2, AlertCircle, Loader2, Calendar, 
  ChevronRight, Sparkles, MessageSquare, ClipboardCheck, XCircle, CheckCircle2
} from "lucide-react";
import { 
  createApplicationAction, 
  updateApplicationAction, 
  deleteApplicationAction,
  createRoundAction,
  updateRoundAction,
  deleteRoundAction
} from "@/features/interviews/actions";
import { AppStage } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface Round {
  id: string;
  applicationId: string;
  roundName: string;
  scheduledAt: string | null;
  feedback: string | null;
  result: string | null;
  notes: string | null;
}

interface Application {
  id: string;
  company: string;
  role: string;
  stage: AppStage;
  appliedAt: string;
  rounds: Round[];
}

export function InterviewsClient({ initialApps }: { initialApps: Application[] }) {
  const [apps, setApps] = useState<Application[]>(initialApps);
  const [isPending, startTransition] = useTransition();

  // App Modal State
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  // Form App State
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState<AppStage>("APPLIED");
  const [appliedAt, setAppliedAt] = useState("");
  const [appError, setAppError] = useState("");

  // Round Modal State
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [roundName, setRoundName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const openAddAppModal = () => {
    setEditingApp(null);
    setCompany("");
    setRole("");
    setStage("APPLIED");
    setAppliedAt(new Date().toISOString().split("T")[0]);
    setAppError("");
    setIsAppModalOpen(true);
  };

  const openEditAppModal = (app: Application) => {
    setEditingApp(app);
    setCompany(app.company);
    setRole(app.role);
    setStage(app.stage);
    setAppliedAt(new Date(app.appliedAt).toISOString().split("T")[0]);
    setAppError("");
    setIsAppModalOpen(true);
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job application?")) return;
    startTransition(async () => {
      const res = await deleteApplicationAction(id);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError("");

    if (!company.trim() || !role.trim()) {
      setAppError("Company and role are required");
      return;
    }

    const payload = {
      company,
      role,
      stage,
      appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
    };

    startTransition(async () => {
      let res;
      if (editingApp) {
        res = await updateApplicationAction(editingApp.id, payload);
      } else {
        res = await createApplicationAction(payload);
      }

      if (res.success) {
        setIsAppModalOpen(false);
        window.location.reload();
      } else {
        setAppError(res.error || "Failed to save application");
      }
    });
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !roundName.trim()) return;

    startTransition(async () => {
      const res = await createRoundAction({
        applicationId: selectedAppId,
        roundName,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        notes: notes || null,
      });

      if (res.success) {
        setIsRoundModalOpen(false);
        setRoundName("");
        setScheduledAt("");
        setNotes("");
        window.location.reload();
      }
    });
  };

  const handleDeleteRound = async (id: string) => {
    if (!confirm("Are you sure you want to delete this round?")) return;
    startTransition(async () => {
      const res = await deleteRoundAction(id);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const StageIcon = ({ s }: { s: AppStage }) => {
    switch (s) {
      case "OFFER":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "INTERVIEW":
        return <MessageSquare className="h-4 w-4 text-accent" />;
      case "OA":
        return <ClipboardCheck className="h-4 w-4 text-indigo-400" />;
      default:
        return <Calendar className="h-4 w-4 text-zinc-500" />;
    }
  };

  const StageBadge = ({ s }: { s: AppStage }) => {
    const colors = {
      APPLIED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      OA: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      INTERVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      OFFER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase", colors[s])}>
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-accent" />
            Interview Tracker & Application Pipeline
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track active job application states and coordinate upcoming rounds.</p>
        </div>
        <button
          onClick={openAddAppModal}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Application
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="card p-8 text-center border-zinc-800 bg-zinc-900/10">
          <Briefcase className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-zinc-400">No applications tracked yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Start logging job applications to keep your interview prep and interview rounds aligned.</p>
          <button
            onClick={openAddAppModal}
            className="mt-4 px-3 py-1.5 text-xs text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {apps.map((app) => (
            <div 
              key={app.id}
              className="card border-border/40 bg-zinc-900/30 p-5 hover:border-zinc-800 transition-all flex flex-col md:flex-row justify-between gap-5 group"
            >
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-zinc-950 rounded border border-zinc-800 shrink-0">
                  <StageIcon s={app.stage} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white text-sm">{app.company}</h3>
                    <ChevronRight className="h-3 w-3 text-zinc-600" />
                    <span className="text-zinc-300 text-xs">{app.role}</span>
                    <StageBadge s={app.stage} />
                  </div>
                  
                  <div className="text-xs text-zinc-500">
                    Applied on {new Date(app.appliedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                  </div>

                  {/* Interview Rounds */}
                  {app.rounds.length > 0 && (
                    <div className="space-y-2 mt-3 bg-zinc-950/40 p-3 border border-zinc-800/40 rounded-md">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scheduled Rounds</h4>
                      <div className="divide-y divide-zinc-900/60">
                        {app.rounds.map((round) => (
                          <div key={round.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                            <div>
                              <span className="font-medium text-zinc-300">{round.roundName}</span>
                              {round.scheduledAt && (
                                <span className="text-[10px] text-zinc-500 ml-2">
                                  ({new Date(round.scheduledAt).toLocaleDateString()} @ {new Date(round.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                                </span>
                              )}
                              {round.notes && <p className="text-[10px] text-zinc-500 mt-0.5">{round.notes}</p>}
                            </div>
                            <button
                              onClick={() => handleDeleteRound(round.id)}
                              className="text-zinc-700 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row md:flex-col justify-end items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => {
                    setSelectedAppId(app.id);
                    setIsRoundModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 text-xs text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded bg-zinc-950 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Round
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditAppModal(app)}
                    className="p-1.5 text-zinc-500 hover:text-white rounded border border-transparent hover:border-zinc-800"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteApp(app.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded border border-transparent hover:border-zinc-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Form Modal */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingApp ? "Edit Application Details" : "Log New Job Application"}
              </h3>
              <button 
                onClick={() => setIsAppModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            {appError && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-2.5 rounded text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {appError}
              </div>
            )}

            <form onSubmit={handleAppSubmit} className="space-y-3.5">
              {/* Company */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Role / Position</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer (Backend)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Stage & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Pipeline Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as AppStage)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="OA">Online Assessment</option>
                    <option value="INTERVIEW">Interviewing</option>
                    <option value="OFFER">Offer Received</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Applied Date</label>
                  <input
                    type="date"
                    value={appliedAt}
                    onChange={(e) => setAppliedAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3.5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(false)}
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
                  {editingApp ? "Save Changes" : "Log Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Round Form Modal */}
      {isRoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Log Interview Round</h3>
              <button 
                onClick={() => setIsRoundModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateRound} className="space-y-3.5">
              {/* Round Name */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Round Title</label>
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="e.g. System Design Round"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Round Notes / Preparation</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Focus on cache invalidation, database scaling..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3.5">
                <button
                  type="button"
                  onClick={() => setIsRoundModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-black bg-accent rounded hover:bg-accent-hover transition-colors"
                >
                  Create Round
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
