import "dotenv/config";
import { prisma } from "../lib/prisma";

async function verify() {
  console.log("🔍 Running database read verification...");
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      console.log(`✅ Connected.`);
      console.log(`Found user: ${user.name} (${user.email})`);
    } else {
      console.log("✅ Connected. But no users found in the database.");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

verify();
