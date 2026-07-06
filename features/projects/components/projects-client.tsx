"use client";

import { useState, useTransition } from "react";
import { 
  FolderKanban, Plus, Trash2, Edit2, CheckCircle2, Circle, 
  HelpCircle, AlertCircle, Loader2, Calendar, ClipboardList
} from "lucide-react";
import { 
  createProjectAction, 
  updateProjectAction, 
  deleteProjectAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction
} from "@/features/projects/actions";
import { ProjectKind, Status, RiskLevel } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  projectId: string;
  title: string;
  phase: string;
  status: Status;
}

interface Project {
  id: string;
  name: string;
  kind: ProjectKind;
  status: Status;
  owner: string | null;
  risk: RiskLevel | null;
  estHours: number | null;
  actualHours: number | null;
  progress: number;
  tasks: Task[];
}

export function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isPending, startTransition] = useTransition();

  // Project Modal State
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);

  // Form Project State
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ProjectKind>("FLAGSHIP");
  const [projStatus, setProjStatus] = useState<Status>("NOT_STARTED");
  const [owner, setOwner] = useState("");
  const [risk, setRisk] = useState<RiskLevel | null>(null);
  const [estHours, setEstHours] = useState("");
  const [actualHours, setActualHours] = useState("");
  const [projError, setProjError] = useState("");

  // Task inline state
  const [selectedProjId, setSelectedProjId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPhase, setNewTaskPhase] = useState("BACKEND");

  const openAddProjModal = () => {
    setEditingProj(null);
    setName("");
    setKind("FLAGSHIP");
    setProjStatus("NOT_STARTED");
    setOwner("");
    setRisk(null);
    setEstHours("");
    setActualHours("");
    setProjError("");
    setIsProjModalOpen(true);
  };

  const openEditProjModal = (proj: Project) => {
    setEditingProj(proj);
    setName(proj.name);
    setKind(proj.kind);
    setProjStatus(proj.status);
    setOwner(proj.owner ?? "");
    setRisk(proj.risk);
    setEstHours(proj.estHours?.toString() ?? "");
    setActualHours(proj.actualHours?.toString() ?? "");
    setProjError("");
    setIsProjModalOpen(true);
  };

  const handleDeleteProj = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project and all its tasks?")) return;
    startTransition(async () => {
      const res = await deleteProjectAction(id);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleProjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjError("");

    if (!name.trim()) {
      setProjError("Project name is required");
      return;
    }

    const payload = {
      name,
      kind,
      status: projStatus,
      owner: owner || null,
      risk,
      estHours: estHours ? parseFloat(estHours) : null,
      actualHours: actualHours ? parseFloat(actualHours) : null,
    };

    startTransition(async () => {
      let res;
      if (editingProj) {
        res = await updateProjectAction(editingProj.id, payload);
      } else {
        res = await createProjectAction(payload);
      }

      if (res.success) {
        setIsProjModalOpen(false);
        window.location.reload();
      } else {
        setProjError(res.error || "Failed to save project");
      }
    });
  };

  const handleCreateTask = async (projId: string) => {
    if (!newTaskTitle.trim()) return;
    startTransition(async () => {
      const res = await createTaskAction({
        projectId: projId,
        title: newTaskTitle,
        phase: newTaskPhase,
        status: "NOT_STARTED",
      });
      if (res.success) {
        setNewTaskTitle("");
        window.location.reload();
      }
    });
  };

  const handleTaskStatusToggle = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "IN_PROGRESS" : "DONE";
    startTransition(async () => {
      const res = await updateTaskAction(task.id, task.projectId, { status: newStatus });
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleDeleteTask = async (task: Task) => {
    startTransition(async () => {
      const res = await deleteTaskAction(task.id, task.projectId);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const RiskBadge = ({ r }: { r: RiskLevel | null }) => {
    if (!r) return null;
    const colors = {
      HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
      MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return (
      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", colors[r])}>
        {r} RISK
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-accent" />
            Project Tracker
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage Flagship architectural builds and Company Websites.</p>
        </div>
        <button
          onClick={openAddProjModal}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-8 text-center border-zinc-800 bg-zinc-900/10">
          <ClipboardList className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-zinc-400">No projects started</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Create a flagship software product build to trace system designs, codebases, and deployment pipelines.</p>
          <button
            onClick={openAddProjModal}
            className="mt-4 px-3 py-1.5 text-xs text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
          >
            Log Project
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((proj) => {
            const isExpanded = selectedProjId === proj.id;
            return (
              <div 
                key={proj.id}
                className="card border-border/40 bg-zinc-900/30 overflow-hidden hover:border-zinc-800 transition-all"
              >
                {/* Project Details Row */}
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-base">{proj.name}</h3>
                      <span className="bg-zinc-800 text-zinc-400 text-[10px] font-medium px-2 py-0.5 rounded border border-zinc-700">
                        {proj.kind.replace("_", " ")}
                      </span>
                      <RiskBadge r={proj.risk} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span>Status: <strong className="text-zinc-400 font-medium">{proj.status}</strong></span>
                      {proj.owner && <span>Lead: <strong className="text-zinc-400 font-medium">{proj.owner}</strong></span>}
                      {proj.estHours && (
                        <span>Hours: <strong className="text-zinc-400 font-medium">{proj.actualHours || 0}/{proj.estHours}h</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Buttons */}
                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                    <div className="space-y-1 w-32">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>Tasks Progress</span>
                        <span>{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedProjId(isExpanded ? null : proj.id)}
                        className="px-2.5 py-1.5 text-xs text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded bg-zinc-950"
                      >
                        {isExpanded ? "Hide Tasks" : `View Tasks (${proj.tasks.length})`}
                      </button>
                      <button
                        onClick={() => openEditProjModal(proj)}
                        className="p-1.5 text-zinc-500 hover:text-white rounded border border-transparent hover:border-zinc-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProj(proj.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded border border-transparent hover:border-zinc-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-tasks Section */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-5 space-y-4">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Milestone Deliverables & Checklist</h4>

                    {/* Inline Task Form */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-zinc-900/60 p-3 rounded-md border border-zinc-800">
                      <input
                        type="text"
                        placeholder="Add sub-deliverable (e.g. Implement OAuth login)"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <select
                        value={newTaskPhase}
                        onChange={(e) => setNewTaskPhase(e.target.value)}
                        className="w-full sm:w-36 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="FRONTEND">Frontend</option>
                        <option value="BACKEND">Backend</option>
                        <option value="DB">Database</option>
                        <option value="AUTH">Auth</option>
                        <option value="DEPLOY">Deploy</option>
                        <option value="TESTING">Testing</option>
                      </select>
                      <button
                        onClick={() => handleCreateTask(proj.id)}
                        className="w-full sm:w-auto px-4 py-1.5 text-xs text-black font-semibold bg-accent hover:bg-accent-hover rounded"
                      >
                        Add
                      </button>
                    </div>

                    {/* Tasks list */}
                    <div className="divide-y divide-zinc-800/40">
                      {proj.tasks.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-3 text-center">No tasks added to this project sprint yet.</p>
                      ) : (
                        proj.tasks.map((task) => (
                          <div 
                            key={task.id}
                            className="py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleTaskStatusToggle(task)}
                                className="focus:outline-none"
                              >
                                {task.status === "DONE" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-zinc-600" />
                                )}
                              </button>
                              <span className={cn(
                                "text-white font-medium",
                                task.status === "DONE" && "line-through text-zinc-500"
                              )}>
                                {task.title}
                              </span>
                              <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[9px] px-1.5 rounded uppercase font-semibold">
                                {task.phase}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="text-zinc-600 hover:text-red-400 opacity-0 hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Project Form Modal */}
      {isProjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingProj ? "Edit Project Details" : "Create New Project"}
              </h3>
              <button 
                onClick={() => setIsProjModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            {projError && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-2.5 rounded text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {projError}
              </div>
            )}

            <form onSubmit={handleProjSubmit} className="space-y-3.5">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Flagship SaaS Platform"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Kind & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Kind</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ProjectKind)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="FLAGSHIP">Flagship Project</option>
                    <option value="COMPANY_WEBSITE">Company Website</option>
                    <option value="OTHER">Other Build</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={projStatus}
                    onChange={(e) => setProjStatus(e.target.value as Status)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Owner & Risk */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Lead/Owner</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Solo Developer"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Risk Level</label>
                  <select
                    value={risk || ""}
                    onChange={(e) => setRisk((e.target.value ? e.target.value : null) as RiskLevel | null)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">No Risk Specified</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Est. Hours</label>
                  <input
                    type="number"
                    value={estHours}
                    onChange={(e) => setEstHours(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Actual Hours</label>
                  <input
                    type="number"
                    value={actualHours}
                    onChange={(e) => setActualHours(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3.5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsProjModalOpen(false)}
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
                  {editingProj ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
