import { requireUser } from "@/lib/auth/supabase-server";
import { goalsService } from "@/server/services/goals.service";
import { GoalsClient } from "@/features/goals/components/goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const goals = await goalsService.getGoals(user.id);

  // Serialize Date fields to strings for safe Client Component boundary crossing
  const serializedGoals = goals.map((g) => ({
    ...g,
    startDate: g.startDate ? g.startDate.toISOString() : null,
    dueDate: g.dueDate ? g.dueDate.toISOString() : null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));

  return <GoalsClient initialGoals={serializedGoals} />;
}
