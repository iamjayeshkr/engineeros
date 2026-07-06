import { requireUser } from "@/lib/auth/supabase-server";
import { resumeService } from "@/server/services/resume.service";
import { ResumeClient } from "@/features/resume/components/resume-client";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const user = await requireUser();
  const resumes = await resumeService.getResumes(user.id);

  // Serialize dates
  const serialized = resumes.map((res) => ({
    ...res,
    createdAt: res.createdAt.toISOString(),
  }));

  return <ResumeClient initialResumes={serialized} />;
}
