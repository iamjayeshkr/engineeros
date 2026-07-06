import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in environment.");
  process.exit(1);
}

// 1. Initialize Supabase Admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 2. Initialize Prisma client with adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const email = "demo@engineeros.dev";
  const password = "Password123!";
  const name = "Demo User";

  console.log(`Creating user in Supabase Auth: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (authError) {
    if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
      console.log("User already exists in Supabase. Syncing to PostgreSQL database...");
    } else {
      console.error("Supabase Error:", authError.message);
      process.exit(1);
    }
  }

  // Get user ID
  let userId = authData.user?.id;

  if (!userId) {
    // Retrieve existing user ID by listing users
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("Failed to list users:", listError.message);
      process.exit(1);
    }
    const existingUser = usersData.users.find(u => u.email === email);
    if (!existingUser) {
      console.error("Could not find user after creation/conflict.");
      process.exit(1);
    }
    userId = existingUser.id;
  }

  console.log(`Supabase User ID: ${userId}`);

  // 3. Insert/Upsert into PostgreSQL using Prisma
  console.log("Upserting user in PostgreSQL Database...");
  const dbUser = await prisma.user.upsert({
    where: { email },
    update: {
      id: userId,
      name,
    },
    create: {
      id: userId,
      email,
      name,
      careerScore: 80,
      currentStreak: 2,
      longestStreak: 5,
    },
  });

  console.log("✅ User created successfully!");
  console.log(`- Email: ${email}`);
  console.log(`- Password: ${password}`);
  console.log(`- Database User ID: ${dbUser.id}`);

  await pool.end();
}

run().catch((e) => {
  console.error("Execution error:", e);
  process.exit(1);
});
