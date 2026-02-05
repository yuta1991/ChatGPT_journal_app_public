// server/repositories/diaryRepository.ts
import { getDb } from "../db.js";
import type { Diary } from "../../shared/types.js";

function rowToDiary(row: any): Diary {
  const tags = [row.tag1, row.tag2, row.tag3, row.tag4, row.tag5].filter(Boolean);
  return {
    id: row.id,
    date: row.date,
    content: row.content ?? "",
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getDiaryByDate(date: string): Diary | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM diaries WHERE date = ?").get(date);
  return row ? rowToDiary(row) : null;
}

export function upsertDiary(params: { date: string; content: string; tags: string[] }) {
  const db = getDb();
  const tags = (params.tags ?? []).slice(0, 5);
  const t1 = tags[0] ?? null;
  const t2 = tags[1] ?? null;
  const t3 = tags[2] ?? null;
  const t4 = tags[3] ?? null;
  const t5 = tags[4] ?? null;

  // date UNIQUE なので upsert
  db.prepare(
    `INSERT INTO diaries (date, content, tag1, tag2, tag3, tag4, tag5)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       content = excluded.content,
       tag1 = excluded.tag1,
       tag2 = excluded.tag2,
       tag3 = excluded.tag3,
       tag4 = excluded.tag4,
       tag5 = excluded.tag5,
       updated_at = datetime('now')`
  ).run(params.date, params.content ?? "", t1, t2, t3, t4, t5);

  return getDiaryByDate(params.date);
}

export function updateDiaryContent(params: { date: string; content: string }) {
  const db = getDb();
  db.prepare(
    `UPDATE diaries
     SET content = ?, updated_at = datetime('now')
     WHERE date = ?`
  ).run(params.content ?? "", params.date);
}

export function updateDiaryTags(params: { date: string; tags: string[] }) {
  const db = getDb();
  const tags = (params.tags ?? []).slice(0, 5);
  const t1 = tags[0] ?? null;
  const t2 = tags[1] ?? null;
  const t3 = tags[2] ?? null;
  const t4 = tags[3] ?? null;
  const t5 = tags[4] ?? null;

  db.prepare(
    `UPDATE diaries
     SET tag1 = ?, tag2 = ?, tag3 = ?, tag4 = ?, tag5 = ?, updated_at = datetime('now')
     WHERE date = ?`
  ).run(t1, t2, t3, t4, t5, params.date);
}

export function listDiariesInRange(params: { startDate: string; endDate: string }): Diary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM diaries
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`
    )
    .all(params.startDate, params.endDate);

  return rows.map(rowToDiary);
}
