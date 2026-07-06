import { requireUser } from "@/lib/auth/supabase-server";
import { projectsService } from "@/server/services/projects.service";
import { ProjectsClient } from "@/features/projects/components/projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await projectsService.getProjects(user.id);

  return <ProjectsClient initialProjects={projects} />;
}
