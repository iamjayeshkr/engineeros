import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up database first
  await prisma.goal.deleteMany({});
  await prisma.user.deleteMany({});

  // Create a user
  const user = await prisma.user.create({
    data: {
      id: "test-user-id",
      email: "test.user@example.com",
      name: "Test User",
      careerScore: 75,
      currentStreak: 5,
      longestStreak: 12,
    },
  });

  console.log(`Created user: ${user.name}`);

  // Create some goals
  const goal1 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Master Next.js 15 & Prisma v7",
      type: "LONG_TERM",
      priority: "HIGH",
      progress: 40,
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Solve 50 LeetCode problems",
      type: "QUARTERLY",
      priority: "MEDIUM",
      progress: 20,
    },
  });

  console.log(`Created goals: "${goal1.title}" and "${goal2.title}"`);
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  });
