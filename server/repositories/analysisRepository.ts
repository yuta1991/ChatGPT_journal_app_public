// server/repositories/analysisRepository.ts
import { getDb } from "../db.js";
import type { Analysis } from "../../shared/types.js";

function rowToAnalysis(row: any): Analysis {
  return {
    id: row.id,
    periodType: row.period_type,
    startDate: row.start_date,
    endDate: row.end_date,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export function createAnalysis(params: {
  periodType: "week" | "month";
  startDate: string;
  endDate: string;
  summary: string;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO analyses (period_type, start_date, end_date, summary)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(period_type, start_date, end_date)
     DO UPDATE SET summary = excluded.summary`
  ).run(params.periodType, params.startDate, params.endDate, params.summary);
}

export function getLatestAnalyses(limit: number): Analysis[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM analyses
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(limit);

  return rows.map(rowToAnalysis);
}
