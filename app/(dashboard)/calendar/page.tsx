import { requireUser } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/prisma";
import { CalendarClient } from "@/components/shared/calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requireUser();

  // Query all items with dates
  const [goals, rounds, sessions] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: user.id, dueDate: { not: null } },
      select: { id: true, title: true, dueDate: true, type: true },
    }),
    prisma.interviewRound.findMany({
      where: { application: { userId: user.id }, scheduledAt: { not: null } },
      select: { id: true, roundName: true, scheduledAt: true, application: { select: { company: true } } },
    }),
    prisma.studySession.findMany({
      where: { userId: user.id },
      select: { id: true, date: true, category: true, minutes: true },
    }),
  ]);

  // Serialize events for the client component
  const events = [
    ...goals.map((g) => ({
      id: `goal-${g.id}`,
      title: `Goal Due: ${g.title}`,
      date: g.dueDate!.toISOString(),
      type: "GOAL",
    })),
    ...rounds.map((r) => ({
      id: `round-${r.id}`,
      title: `${r.application.company} - ${r.roundName}`,
      date: r.scheduledAt!.toISOString(),
      type: "INTERVIEW",
    })),
    ...sessions.map((s) => ({
      id: `session-${s.id}`,
      title: `Studied: ${s.category} (${s.minutes}m)`,
      date: s.date.toISOString(),
      type: "STUDY",
    })),
  ];

  return <CalendarClient initialEvents={events} />;
}
