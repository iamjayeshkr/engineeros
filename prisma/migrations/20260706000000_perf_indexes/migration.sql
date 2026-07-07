-- Postgres does not auto-index foreign key columns (unlike MySQL), so these
-- relations were doing sequential scans on every lookup/include:
--   - Goal.parentId          -> hierarchy/sibling queries (goals.repository)
--   - InterviewRound.applicationId -> Application include({ rounds: true })
--   - ResumeVersion.userId   -> resume list queries
--   - LearningItem.userId    -> learning list queries
-- Cheap to add now; expensive to discover later at scale.

CREATE INDEX "Goal_parentId_idx" ON "Goal"("parentId");

CREATE INDEX "InterviewRound_applicationId_idx" ON "InterviewRound"("applicationId");

CREATE INDEX "ResumeVersion_userId_idx" ON "ResumeVersion"("userId");

CREATE INDEX "LearningItem_userId_idx" ON "LearningItem"("userId");
