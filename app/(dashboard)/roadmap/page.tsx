import { requireUser } from "@/lib/auth/supabase-server";
import { roadmapService } from "@/server/services/roadmap.service";
import { RoadmapClient } from "@/features/backend-roadmap/components/roadmap-client";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const user = await requireUser();
  const items = await roadmapService.getRoadmap(user.id);

  return <RoadmapClient initialItems={items} />;
}
