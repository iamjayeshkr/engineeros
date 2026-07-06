import { useState, useTransition } from "react";
import { Clock, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { logStudySessionAction } from "@/features/study-session/actions";
import { cn } from "@/lib/utils";

export function StudyLoggerButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("DSA");
  const [minutes, setMinutes] = useState("60");
  const [deepWork, setDeepWork] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("DSA");
    setMinutes("60");
    setDeepWork(false);
    setError("");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedMinutes = parseInt(minutes);
    if (isNaN(parsedMinutes) || parsedMinutes <= 0) {
      setError("Please enter a valid number of minutes.");
      return;
    }

    startTransition(async () => {
      const res = await logStudySessionAction({
        date: new Date(date),
        category,
        minutes: parsedMinutes,
        deepWork,
      });

      if (res.success) {
        setIsOpen(false);
        // Refresh page to trigger server component data reload (streaks, heatmap, etc.)
        window.location.reload();
      } else {
        setError(res.error || "Failed to log study session");
      }
    });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 rounded-md bg-accent-soft px-3 py-1.5 text-xs text-white border border-border/80 hover:bg-accent/20 transition-all font-semibold active:scale-95",
          className
        )}
      >
        <Clock className="h-3.5 w-3.5 text-accent" />
        Log Hours
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-md rounded-xl shadow-2xl shadow-accent/5 p-6 space-y-5 text-left transition-all">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-accent" />
                Log Study Hours
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-2.5 rounded-md text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-850 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40/20 transition-all duration-150"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-850 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40/20 transition-all duration-150 appearance-none pr-8"
                  >
                    <option value="DSA">DSA Practice</option>
                    <option value="BACKEND">Backend Engineering</option>
                    <option value="PROJECT">Project Development</option>
                    <option value="INTERVIEW_PREP">Interview Prep</option>
                    <option value="LEARNING">General Learning</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Minutes */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Minutes Studied</label>
                <input
                  type="number"
                  min="1"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full bg-zinc-950/80 border border-zinc-850 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40/20 transition-all duration-150"
                />
              </div>

              {/* Deep Work */}
              <div className="flex items-center gap-2.5 bg-zinc-950/30 border border-zinc-850/40 rounded-md px-3 py-2">
                <input
                  type="checkbox"
                  id="deepWork"
                  checked={deepWork}
                  onChange={(e) => setDeepWork(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-accent focus:ring-accent focus:ring-offset-zinc-900 h-3.5 w-3.5"
                />
                <label htmlFor="deepWork" className="text-xs text-zinc-400 select-none cursor-pointer">
                  Deep Work session (uninterrupted focus)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2 rounded-md hover:bg-zinc-800/40 transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-accent text-zinc-950 font-bold hover:bg-accent-hover shadow-lg shadow-accent/15 px-5 py-2 rounded-md active:scale-95 transition-all text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
