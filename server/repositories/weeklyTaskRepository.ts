// server/repositories/weeklyTaskRepository.ts
import { getDb } from "../db.js";
import type { WeeklyTask } from "../../shared/types.js";

function rowToWeeklyTask(row: any): WeeklyTask {
  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    weekStartDate: row.week_start_date,
    title: row.title,
    isDone: row.is_done === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listWeeklyTasks(params: { weekStartDate: string }): WeeklyTask[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM weekly_tasks
       WHERE week_start_date = ?
       ORDER BY is_done ASC, id DESC`
    )
    .all(params.weekStartDate);

  return rows.map(rowToWeeklyTask);
}

export function addWeeklyTask(params: { weekStartDate: string; title: string; clientId?: string }) {
  const db = getDb();

  // clientId があれば冪等（同じclientIdなら重複追加しない）
  if (params.clientId) {
    const existing = db
      .prepare("SELECT * FROM weekly_tasks WHERE client_id = ?")
      .get(params.clientId);
    if (existing) return rowToWeeklyTask(existing);
  }

  const info = db
    .prepare(
      `INSERT INTO weekly_tasks (client_id, week_start_date, title, is_done)
       VALUES (?, ?, ?, 0)`
    )
    .run(params.clientId ?? null, params.weekStartDate, params.title);

  const row = db.prepare("SELECT * FROM weekly_tasks WHERE id = ?").get(info.lastInsertRowid);
  return rowToWeeklyTask(row);
}

export function setWeeklyTaskDone(params: { id: number; isDone: boolean }) {
  const db = getDb();
  db.prepare(
    `UPDATE weekly_tasks
     SET is_done = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(params.isDone ? 1 : 0, params.id);
}

export function deleteWeeklyTask(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM weekly_tasks WHERE id = ?").run(id);
}
