import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const dbPath = path.join(__dirname, "..", "..", "dev.db");
export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

export function initSchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(sql);
}
