import { requireUser } from "@/lib/auth/supabase-server";
import { interviewsService } from "@/server/services/interviews.service";
import { InterviewsClient } from "@/features/interviews/components/interviews-client";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const user = await requireUser();
  const apps = await interviewsService.getApplications(user.id);

  // Serialize Date objects to strings
  const serializedApps = apps.map((app) => ({
    ...app,
    appliedAt: app.appliedAt.toISOString(),
    rounds: app.rounds.map((round) => ({
      ...round,
      scheduledAt: round.scheduledAt ? round.scheduledAt.toISOString() : null,
    })),
  }));

  return <InterviewsClient initialApps={serializedApps} />;
}
