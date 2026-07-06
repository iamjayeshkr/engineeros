"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { studySessionService } from "@/server/services/study-session.service";
import { logStudySessionSchema } from "@/lib/validations/study-session";
import { revalidatePath } from "next/cache";

export async function logStudySessionAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = logStudySessionSchema.parse(formData);

    const session = await studySessionService.logStudySession({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/analytics");

    return { success: true, session };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log study session" };
  }
}
