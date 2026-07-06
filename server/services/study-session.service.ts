import { studySessionRepository, LogStudySessionInput } from "@/server/repositories/study-session.repository";
import { differenceInCalendarDays, subDays } from "date-fns";

export const studySessionService = {
  async logStudySession(data: LogStudySessionInput) {
    // 1. Save session
    const session = await studySessionRepository.upsertStudySession(data);

    // 2. Recalculate streaks
    await this.recalculateUserStreaks(data.userId);

    return session;
  },

  async getStudySessionsSince(userId: string, days: number) {
    const date = subDays(new Date(), days);
    return studySessionRepository.getStudySessionsSince(userId, date);
  },

  async recalculateUserStreaks(userId: string): Promise<void> {
    const dates = await studySessionRepository.getAllUniqueActiveDates(userId);
    const userSnapshot = await studySessionRepository.getUserSnapshot(userId);
    if (!userSnapshot) return;

    if (dates.length === 0) {
      await studySessionRepository.updateUserSnapshotStreaks(userId, 0, userSnapshot.longestStreak);
      return;
    }

    // Sort dates descending for current streak calculation
    const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());

    // Check current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestActiveDate = new Date(sortedDates[0]);
    latestActiveDate.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    const diffToToday = differenceInCalendarDays(today, latestActiveDate);

    // If the latest active date is today or yesterday, the streak is active
    if (diffToToday <= 1) {
      currentStreak = 1;
      let checkDate = latestActiveDate;

      for (let i = 1; i < sortedDates.length; i++) {
        const prevActiveDate = new Date(sortedDates[i]);
        prevActiveDate.setHours(0, 0, 0, 0);

        const diff = differenceInCalendarDays(checkDate, prevActiveDate);
        if (diff === 1) {
          currentStreak++;
          checkDate = prevActiveDate;
        } else if (diff > 1) {
          // Streak broken
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    // Check longest streak
    // Sort dates ascending
    const ascDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    let longestStreak = userSnapshot.longestStreak || 0;
    let tempStreak = 1;

    for (let i = 1; i < ascDates.length; i++) {
      const prevDate = new Date(ascDates[i - 1]);
      prevDate.setHours(0, 0, 0, 0);
      
      const currDate = new Date(ascDates[i]);
      currDate.setHours(0, 0, 0, 0);

      const diff = differenceInCalendarDays(currDate, prevDate);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Make sure longest streak is at least the current streak
    longestStreak = Math.max(longestStreak, currentStreak);

    // Save streaks
    await studySessionRepository.updateUserSnapshotStreaks(userId, currentStreak, longestStreak);
  },
};
