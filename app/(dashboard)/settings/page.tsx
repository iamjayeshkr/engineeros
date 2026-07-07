import { requireUser } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/prisma";
import { Settings, Shield, User } from "lucide-react";
import { DeleteAccountDialog } from "@/features/auth/components/delete-account-dialog";

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
            <Shield className="h-4 w-4 text-accent" />
            Data & Privacy
          </h3>

          <div className="space-y-2 text-xs">
            <p className="text-zinc-500 leading-relaxed mb-2">
              Your prep data is yours. It's never sold or shared with third parties.
              You can permanently delete your account and everything in it at any time —
              no "contact support" required.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-5 border-red-500/20 bg-red-500/[0.03] space-y-4">
          <h3 className="text-xs font-bold text-red-400/80 uppercase tracking-wider border-b border-red-500/10 pb-2">
            Danger Zone
          </h3>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              Permanently delete your account and all data — goals, DSA log, roadmap,
              projects, applications, resume versions, and study history. This cannot be undone.
            </p>
            <DeleteAccountDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
