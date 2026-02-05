// server/repositories/todoRepository.ts
import { getDb } from "../db.js";
import type { Todo } from "../../shared/types.js";

function rowToTodo(row: any): Todo {
  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    title: row.title,
    isDone: row.is_done === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listTodos(): Todo[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM todos ORDER BY id DESC").all();
  return rows.map(rowToTodo);
}

export function addTodo(params: { title: string; clientId?: string }) {
  const db = getDb();

  // clientId がある場合は重複挿入を避ける（任意）
  if (params.clientId) {
    const existing = db
      .prepare("SELECT * FROM todos WHERE client_id = ?")
      .get(params.clientId);
    if (existing) return rowToTodo(existing);
  }

  const info = db
    .prepare(
      `INSERT INTO todos (client_id, title, is_done)
       VALUES (?, ?, 0)`
    )
    .run(params.clientId ?? null, params.title);

  const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(info.lastInsertRowid);
  return rowToTodo(row);
}

export function setTodoDone(params: { id: number; isDone: boolean }) {
  const db = getDb();
  db.prepare(
    `UPDATE todos
     SET is_done = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(params.isDone ? 1 : 0, params.id);
}

export function deleteTodo(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM todos WHERE id = ?").run(id);
}
