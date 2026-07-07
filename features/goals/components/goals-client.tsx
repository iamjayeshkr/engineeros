"use client";

import { useState, useTransition } from "react";
import { 
  Plus, ChevronDown, ChevronRight, Edit2, Trash2, Calendar, 
  AlertCircle, CheckCircle2, Circle, Ban, Target, HelpCircle,
  GitCommit, ArrowRight, Loader2
} from "lucide-react";
import { createGoalAction, updateGoalAction, deleteGoalAction } from "@/features/goals/actions";
import { GoalType, Priority, Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  userId: string;
  parentId: string | null;
  title: string;
  type: GoalType;
  priority: Priority;
  tags: string[];
  estHours: number | null;
  actualHours: number | null;
  progress: number;
  status: Status;
  dependsOnIds: string[];
  startDate: string | Date | null;
  dueDate: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalType>("DAILY");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>("NOT_STARTED");
  const [estHours, setEstHours] = useState<string>("");
  const [actualHours, setActualHours] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dependsOnIds, setDependsOnIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  // Tree toggle state
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    // Expand root goals by default
    const roots: Record<string, boolean> = {};
    initialGoals.forEach(g => {
      if (!g.parentId) roots[g.id] = true;
    });
    return roots;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = (parentId: string | null = null) => {
    setEditingGoal(null);
    setSelectedParentId(parentId);
    setTitle("");
    setType(parentId ? "DAILY" : "LONG_TERM");
    setPriority("MEDIUM");
    setProgress(0);
    setStatus("NOT_STARTED");
    setEstHours("");
    setActualHours("");
    setStartDate("");
    setDueDate("");
    setDependsOnIds([]);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedParentId(goal.parentId);
    setTitle(goal.title);
    setType(goal.type);
    setPriority(goal.priority);
    setProgress(goal.progress);
    setStatus(goal.status);
    setEstHours(goal.estHours?.toString() ?? "");
    setActualHours(goal.actualHours?.toString() ?? "");
    setStartDate(goal.startDate ? new Date(goal.startDate).toISOString().split("T")[0] : "");
    setDueDate(goal.dueDate ? new Date(goal.dueDate).toISOString().split("T")[0] : "");
    setDependsOnIds(goal.dependsOnIds);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleStatusChange = async (goalId: string, newStatus: Status) => {
    const updatedProgress = newStatus === "DONE" ? 100 : newStatus === "NOT_STARTED" ? 0 : undefined;
    
    startTransition(async () => {
      const payload: any = { status: newStatus };
      if (updatedProgress !== undefined) payload.progress = updatedProgress;

      const res = await updateGoalAction(goalId, payload);
      if (res.success && res.goal) {
        // Since database updates parent cascade, refetch/re-sync client state
        // To keep it simple and reactive, we update client state
        // For strict synchronization, we can just replace with returned goal + parent cascade updates
        // To be safe, we reload or re-calculate. Let's merge the result.
        // The most robust way is to update the single item first:
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...res.goal } : g));
        // We'll update the rest in transition. Wait! The action revalidates the path,
        // so we can refresh the window or fetch fresh goals.
        // Let's trigger a full state refresh.
        window.location.reload();
      }
    });
  };

  const handleProgressChange = async (goalId: string, value: number) => {
    startTransition(async () => {
      let newStatus: Status = "IN_PROGRESS";
      if (value === 100) newStatus = "DONE";
      if (value === 0) newStatus = "NOT_STARTED";

      const res = await updateGoalAction(goalId, { progress: value, status: newStatus });
      if (res.success) {
        window.location.reload();
      }
    });
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal and all of its sub-goals?")) return;
    startTransition(async () => {
      const res = await deleteGoalAction(goalId);
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
      parentId: selectedParentId,
      title,
      type,
      priority,
      progress,
      status,
      estHours: estHours ? parseFloat(estHours) : null,
      actualHours: actualHours ? parseFloat(actualHours) : null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      dependsOnIds,
    };

    startTransition(async () => {
      let res;
      if (editingGoal) {
        res = await updateGoalAction(editingGoal.id, payload);
      } else {
        res = await createGoalAction(payload);
      }

      if (res.success) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || "Something went wrong");
      }
    });
  };

  // Helper: Build tree structure
  const buildGoalTree = (parentId: string | null = null): Goal[] => {
    return goals
      .filter(g => g.parentId === parentId)
      .filter(g => filterType === "ALL" || g.type === filterType)
      .filter(g => filterStatus === "ALL" || g.status === filterStatus);
  };

  const rootGoals = buildGoalTree(null);

  // Helper Badge components
  const PriorityBadge = ({ p }: { p: Priority }) => {
    const colors = {
      HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
      MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      LOW: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };
    return (
      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide", colors[p])}>
        {p}
      </span>
    );
  };

  const TypeBadge = ({ t }: { t: GoalType }) => {
    const colors = {
      LONG_TERM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      QUARTERLY: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      MONTHLY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      WEEKLY: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      DAILY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return (
      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide", colors[t])}>
        {t.replace("_", " ")}
      </span>
    );
  };

  const StatusIcon = ({ s, className }: { s: Status; className?: string }) => {
    switch (s) {
      case "DONE":
        return <CheckCircle2 className={cn("h-4.5 w-4.5 text-emerald-500", className)} />;
      case "IN_PROGRESS":
        return <Circle className={cn("h-4.5 w-4.5 text-amber-500 fill-amber-500/20", className)} />;
      case "BLOCKED":
        return <Ban className={cn("h-4.5 w-4.5 text-red-500", className)} />;
      default:
        return <Circle className={cn("h-4.5 w-4.5 text-zinc-600", className)} />;
    }
  };

  // Recursive Tree Node Renderer
  const GoalNode = ({ goal, depth = 0 }: { goal: Goal; depth: number }) => {
    const subGoals = goals.filter(g => g.parentId === goal.id);
    const hasChildren = subGoals.length > 0;
    const isExpanded = !!expandedIds[goal.id];

    return (
      <div className="space-y-1">
        {/* Node row */}
        <div 
          style={{ paddingLeft: `${depth * 1.5}rem` }}
          className={cn(
            "group flex items-center justify-between rounded-md border border-border/40 bg-zinc-900/40 py-2.5 pr-3 pl-2 transition-all hover:bg-zinc-900 hover:border-zinc-800",
            goal.status === "DONE" && "opacity-75"
          )}
        >
          <div className="flex flex-1 items-center gap-3 min-w-0">
            {/* Expand toggle */}
            <button 
              onClick={() => toggleExpand(goal.id)}
              className={cn(
                "p-0.5 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition-colors",
                !hasChildren && "opacity-0 cursor-default"
              )}
              disabled={!hasChildren}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {/* Status Checkbox */}
            <button
              onClick={() => handleStatusChange(goal.id, goal.status === "DONE" ? "IN_PROGRESS" : "DONE")}
              className="focus:outline-none transition-transform active:scale-95"
            >
              <StatusIcon s={goal.status} />
            </button>

            {/* Title & Metadata */}
            <div className="flex flex-col min-w-0">
              <span className={cn(
                "text-sm text-white font-medium truncate",
                goal.status === "DONE" && "line-through text-zinc-500"
              )}>
                {goal.title}
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <TypeBadge t={goal.type} />
                <PriorityBadge p={goal.priority} />
                
                {/* Dates */}
                {(goal.startDate || goal.dueDate) && (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    {goal.startDate ? new Date(goal.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : "—"}
                    <ArrowRight className="h-2 w-2" />
                    {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : "—"}
                  </span>
                )}

                {/* Estimate hours */}
                {goal.estHours !== null && (
                  <span className="text-[10px] text-zinc-500">
                    Est: {goal.estHours}h {goal.actualHours !== null && `(Act: ${goal.actualHours}h)`}
                  </span>
                )}

                {/* Depends On */}
                {goal.dependsOnIds.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500">
                    <GitCommit className="h-3 w-3" />
                    {goal.dependsOnIds.length} dep
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress and Actions */}
          <div className="flex items-center gap-4">
            {/* Progress Slider / Bar */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    goal.status === "DONE" ? "bg-emerald-500" : goal.status === "BLOCKED" ? "bg-red-500" : "bg-accent"
                  )}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              
              {/* Slider for leaf goals or direct adjustment */}
              {!hasChildren ? (
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={goal.progress}
                  onChange={(e) => handleProgressChange(goal.id, parseInt(e.target.value))}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              ) : (
                <span className="text-xs text-zinc-500 w-8 text-right font-medium">{goal.progress}%</span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openAddModal(goal.id)}
                title="Add Sub-goal"
                className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openEditModal(goal)}
                title="Edit Goal"
                className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(goal.id)}
                title="Delete Goal"
                className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Child nodes */}
        {hasChildren && isExpanded && (
          <div className="pl-1 border-l border-zinc-800/60 ml-3.5 space-y-1.5 py-1">
            {subGoals.map(subGoal => (
              <GoalNode key={subGoal.id} goal={subGoal} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Goals & Roadmap Planner
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Define nested quarterly milestones, weekly sprints, and daily tasks.</p>
        </div>
        <button
          onClick={() => openAddModal(null)}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select text-xs bg-zinc-900 border-zinc-800 text-zinc-300 rounded px-2 py-1"
          >
            <option value="ALL">All Types</option>
            <option value="LONG_TERM">Long Term</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="WEEKLY">Weekly</option>
            <option value="DAILY">Daily</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select text-xs bg-zinc-900 border-zinc-800 text-zinc-300 rounded px-2 py-1"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Global Loading Spinner */}
        {isPending && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Loader2 className="h-3 w-3 animate-spin text-accent" />
            Updating parent cascading progress...
          </span>
        )}
      </div>

      {/* Tree list container */}
      <div className="space-y-3">
        {rootGoals.length === 0 ? (
          <div className="card p-8 text-center border-zinc-800 bg-zinc-900/20">
            <HelpCircle className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-zinc-400">No goals found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Create a parent goal or adjust filters to view items in your sprint.</p>
            <button
              onClick={() => openAddModal(null)}
              className="mt-4 px-3 py-1.5 text-xs text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
            >
              Get Started
            </button>
          </div>
        ) : (
          rootGoals.map(goal => (
            <GoalNode key={goal.id} goal={goal} depth={0} />
          ))
        )}
      </div>

      {/* Edit/Create Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingGoal ? "Edit Goal Details" : selectedParentId ? "Add Sub-Goal" : "Create New Goal"}
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
                  placeholder="e.g. Master system design fundamentals"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as GoalType)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="LONG_TERM">Long Term</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Status and Progress (Only in edit mode for leaf goals) */}
              {editingGoal && (
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Progress ({progress}%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
              )}

              {/* Estimate & Actual Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={estHours}
                    onChange={(e) => setEstHours(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Actual Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={actualHours}
                    onChange={(e) => setActualHours(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Depends On</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto border border-zinc-800 rounded-md p-2 bg-zinc-950/80">
                  {goals.filter(g => !editingGoal || g.id !== editingGoal.id).length === 0 ? (
                    <p className="text-zinc-500 text-xs italic px-1 py-0.5">No other goals available.</p>
                  ) : (
                    goals
                      .filter(g => !editingGoal || g.id !== editingGoal.id)
                      .map(g => {
                        const isChecked = dependsOnIds.includes(g.id);
                        return (
                          <label key={g.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-zinc-900 cursor-pointer select-none text-xs text-zinc-300 transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDependsOnIds([...dependsOnIds, g.id]);
                                } else {
                                  setDependsOnIds(dependsOnIds.filter(id => id !== g.id));
                                }
                              }}
                              className="rounded bg-zinc-900 border-zinc-850 text-accent focus:ring-accent h-3.5 w-3.5"
                            />
                            <span className="truncate">{g.title}</span>
                          </label>
                        );
                      })
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Select one or more goals this goal depends on.</p>
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
                  {editingGoal ? "Save Changes" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
