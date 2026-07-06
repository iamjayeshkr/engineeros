import { requireUser } from "@/lib/auth/supabase-server";
import { dsaService } from "@/server/services/dsa.service";
import { DsaClient } from "@/features/dsa/components/dsa-client";

export const dynamic = "force-dynamic";

export default async function DsaPage() {
  const user = await requireUser();
  
  const [problems, queue] = await Promise.all([
    dsaService.getDsaProblems(user.id),
    dsaService.getRevisionQueue(user.id),
  ]);

  // Serialize Date fields to strings for safe Client Component boundary crossing
  const serializeDsa = (list: any[]) =>
    list.map((p) => ({
      ...p,
      solvedAt: p.solvedAt.toISOString(),
      nextRevisionAt: p.nextRevisionAt ? p.nextRevisionAt.toISOString() : null,
    }));

  return (
    <DsaClient
      initialProblems={serializeDsa(problems)}
      initialQueue={serializeDsa(queue)}
    />
  );
}
