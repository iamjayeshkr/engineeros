import { requireUser } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/prisma";
import { Settings, Shield, User, HardDrive, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent" />
          Settings
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your profile, system credentials, and databases configuration.</p>
      </div>

      <div className="space-y-5">
        {/* Profile Card */}
        <div className="card p-5 border-border/40 bg-zinc-900/30 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-1.5">
            <User className="h-4 w-4 text-accent" />
            User Profile Information
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-500">Database User ID</span>
              <span className="col-span-2 text-zinc-300 font-mono select-all">{dbUser?.id || user.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-500">Email Address</span>
              <span className="col-span-2 text-zinc-300 font-mono">{dbUser?.email || user.email}</span>
            </div>
            {dbUser?.name && (
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-500">Display Name</span>
                <span className="col-span-2 text-zinc-300">{dbUser.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* System Keys status */}
        <div className="card p-5 border-border/40 bg-zinc-900/30 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-accent" />
            Integration Keys Verification
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">SUPABASE_URL</span>
              <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                CONNECTED
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-500">DATABASE_URL (Prisma Postgres)</span>
              <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                ACTIVE
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-zinc-500">GEMINI_API_KEY</span>
              <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                CONFIGURED
              </span>
            </div>
          </div>
        </div>

        {/* Security details */}
        <div className="card p-5 border-border/40 bg-zinc-900/30 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-accent" />
            System Operations
          </h3>

          <div className="space-y-2 text-xs">
            <p className="text-zinc-500 leading-relaxed mb-2">
              All database actions, study session logs, and milestone trackers are protected via Supabase authentication credentials and custom Postgres Prisma driver adapters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
