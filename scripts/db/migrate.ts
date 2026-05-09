import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { getPool } from "@/lib/db/pool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const schemaPath = path.resolve(__dirname, "../../db/schema.sql");
  const sql = await readFile(schemaPath, "utf8");

  const pool = getPool();
  await pool.query(sql);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

