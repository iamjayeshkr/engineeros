import { requireUser } from "@/lib/auth/supabase-server";
import { learningService } from "@/server/services/learning.service";
import { LearningClient } from "@/features/learning/components/learning-client";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const user = await requireUser();
  const items = await learningService.getLearningItems(user.id);

  return <LearningClient initialItems={items} />;
}
