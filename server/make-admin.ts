import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { pool } from "./db";

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("Usage: npm run make-admin <email>");
    process.exit(1);
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    await db.update(users).set({ isAdmin: "true" }).where(eq(users.email, email));
    console.log(`✓ User ${email} is now an admin`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

makeAdmin();
