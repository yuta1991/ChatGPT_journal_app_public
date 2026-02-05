// server/db.ts
import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let db: Database.Database | null = null;

function ensureDir(p: string) {
  mkdirSync(p, { recursive: true });
}

export function getDb() {
  if (db) return db;

  // npm workspaces 経由だと process.cwd() が repo 直下でないことがあるため、
  // このファイル位置（server/db.ts）を基準にパスを解決する。
  const serverDir = path.dirname(fileURLToPath(import.meta.url)); // .../server

  // DBファイルは server/data/journal.sqlite に保存
  const dataDir = path.resolve(serverDir, "data");
  ensureDir(dataDir);

  const dbPath = process.env.DB_PATH ?? path.resolve(dataDir, "journal.sqlite");
  db = new Database(dbPath);

  // 安全寄りの設定
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // schema.sql を適用
  const schemaPath = path.resolve(serverDir, "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  db.exec(schema);

  return db;
}
