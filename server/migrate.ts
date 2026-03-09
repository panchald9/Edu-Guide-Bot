import { pool } from "./db";

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Add password column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password VARCHAR NOT NULL DEFAULT '';
    `);
    
    // Add isAdmin column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin VARCHAR NOT NULL DEFAULT 'false';
    `);
    
    // Remove profile_image_url column if exists
    await client.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS profile_image_url;
    `);
    
    // Make email NOT NULL if not already
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN email SET NOT NULL;
    `);
    
    // Set default for id column
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `);
    
    // Remove user_id from sessions table if exists
    await client.query(`
      ALTER TABLE sessions 
      DROP COLUMN IF EXISTS user_id;
    `);
    
    await client.query("COMMIT");
    console.log("Migration completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
