"use client";

import { useState, useEffect } from "react";
import { 
  TestTube2, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, 
  HelpCircle, Star, ShieldAlert, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreLog {
  id: string;
  testName: string;
  platform: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  notes: string;
}

export default function TestingPage() {
  const [logs, setLogs] = useState<ScoreLog[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Form State
  const [testName, setTestName] = useState("");
  const [platform, setPlatform] = useState("LeetCode Mock");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("engineeros_testing_logs");
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default logs for beautiful density
      const seed = [
        {
          id: "1",
          testName: "Algorithms & Data Structures Assessment",
          platform: "HackerRank Mock",
          score: 85,
          maxScore: 100,
          percentage: 85,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: "Need to optimize space complexity on dynamic programming problems."
        },
        {
          id: "2",
          testName: "SDE-1 Systems Readiness Quiz",
          platform: "LeetCode Mock",
          score: 90,
          maxScore: 100,
          percentage: 90,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: "Perfect score on database indexing; missed one on DNS query caching."
        }
      ];
      setLogs(seed);
      localStorage.setItem("engineeros_testing_logs", JSON.stringify(seed));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!testName.trim() || !score || !maxScore) {
      setFormError("All score fields are required");
      return;
    }

    const s = parseFloat(score);
    const m = parseFloat(maxScore);
    if (isNaN(s) || isNaN(m) || m <= 0 || s < 0) {
      setFormError("Please enter valid scores");
      return;
    }

    const newLog: ScoreLog = {
      id: Math.random().toString(36).substring(7),
      testName,
      platform,
      score: s,
      maxScore: m,
      percentage: Math.round((s / m) * 100),
      date: new Date().toISOString().split("T")[0],
      notes,
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem("engineeros_testing_logs", JSON.stringify(updated));
    setIsModalOpen(false);
    setTestName("");
    setScore("");
    setNotes("");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this test score?")) return;
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem("engineeros_testing_logs", JSON.stringify(updated));
  };

  if (!isMounted) {
    return <div className="h-64 animate-pulse bg-zinc-900/10 rounded" />;
  }

  const averageScore = logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.percentage, 0) / logs.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <TestTube2 className="h-5 w-5 text-accent" />
            Mock Assessments & SDE Readiness Quizzes
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Test your backend architecture and coding speed using mock exam logs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs text-black font-semibold rounded bg-accent hover:bg-accent-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Score
        </button>
      </div>

      {/* Summary Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-border/40 bg-zinc-900/30 flex items-center gap-4">
          <div className="p-3 bg-accent-soft text-accent border border-accent/20 rounded-full">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block font-medium uppercase tracking-wider">Average Readiness Score</span>
            <span className="text-2xl font-bold text-white mt-1 block">{averageScore}%</span>
          </div>
        </div>

        <div className="card p-5 border-border/40 bg-zinc-900/30 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block font-medium uppercase tracking-wider">Quizzes Completed</span>
            <span className="text-2xl font-bold text-white mt-1 block">{logs.length}</span>
          </div>
        </div>

        <div className="card p-5 border-border/40 bg-zinc-900/30 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block font-medium uppercase tracking-wider">Mastery Tier</span>
            <span className="text-sm font-bold text-white mt-1.5 block px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded w-fit">
              {averageScore >= 90 ? "ELITE" : averageScore >= 75 ? "READY" : "TRAINING"}
            </span>
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="card p-8 text-center border-zinc-800 bg-zinc-900/10">
          <HelpCircle className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-zinc-400">No mock results logged</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">Start logging HackerRank assessment scores or LeetCode mock test summaries to trace your growth.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div 
              key={log.id}
              className="card border-border/40 bg-zinc-900/30 p-4 hover:border-zinc-800 transition-all flex justify-between items-center gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white text-sm">{log.testName}</h3>
                  <span className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {log.platform}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  Logged on {log.date}
                </div>
                {log.notes && (
                  <p className="text-xs text-zinc-400 bg-zinc-950/40 p-2 border border-zinc-850 rounded">
                    {log.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-sm font-bold text-white block">
                    {log.score} / {log.maxScore}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold block",
                    log.percentage >= 90 ? "text-emerald-400" : log.percentage >= 75 ? "text-amber-400" : "text-zinc-500"
                  )}>
                    {log.percentage}% Score
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Score Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Log Assessment Score</h3>
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

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Test Name */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Assessment Name</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Google Online Assessment Mock"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Platform */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="LeetCode Mock">LeetCode Mock</option>
                  <option value="HackerRank Mock">HackerRank Assessment</option>
                  <option value="Codeforces Div 2">Codeforces Div 2 Contest</option>
                  <option value="Triplebyte assessment">Triplebyte Assessment</option>
                  <option value="Other Mock">Other Assessment</option>
                </select>
              </div>

              {/* Score & Max Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Logged Score</label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Maximum Score</label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    placeholder="100"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Key Mistakes / Preparation Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Need to review topological sort, time limits..."
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
                  className="px-4 py-2 text-xs font-semibold text-black bg-accent rounded hover:bg-accent-hover transition-colors"
                >
                  Save Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
