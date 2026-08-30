import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load env
import { readFileSync } from "fs";
const envContent = readFileSync(".env", "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)="(.+)"$/);
  if (match) envVars[match[1]] = match[2];
}

const DIRECT_URL = envVars["DIRECT_URL"];
if (!DIRECT_URL) {
  console.error("DIRECT_URL not found in .env");
  process.exit(1);
}

const { Pool } = require("pg");

const pool = new Pool({ connectionString: DIRECT_URL });

const sqls = [
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS "isEdited" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS "editHistory" JSONB`,
];

try {
  const client = await pool.connect();
  for (const sql of sqls) {
    console.log("Running:", sql);
    await client.query(sql);
    console.log("✅ Done");
  }
  console.log("\n✅ Migration complete! Both columns added to sales table.");
  client.release();
  await pool.end();
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
}
