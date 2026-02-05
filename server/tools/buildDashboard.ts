// server/tools/buildDashboard.ts
import type { DashboardData } from "../../shared/types.js";
import * as diaryRepo from "../repositories/diaryRepository.js";
import * as todoRepo from "../repositories/todoRepository.js";
import * as weeklyRepo from "../repositories/weeklyTaskRepository.js";
import * as analysisRepo from "../repositories/analysisRepository.js";

export const ANALYSIS_HISTORY_LIMIT = 30;

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// 日曜始まり（今の挙動を維持）
export function getWeekStartDate(date: string) {
  const d = new Date(date + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun
  d.setUTCDate(d.getUTCDate() - day);
  return toIsoDate(d);
}

export async function buildDashboard(params: {
  viewDate?: string;
  suggestions?: DashboardData["suggestions"];
  analysisDraft?: DashboardData["analysisDraft"];
}): Promise<DashboardData> {
  const date = params.viewDate ?? toIsoDate(new Date());
  const weekStartDate = getWeekStartDate(date);

  const diary = diaryRepo.getDiaryByDate(date);
  const todos = todoRepo.listTodos();
  const weeklyTasks = weeklyRepo.listWeeklyTasks({ weekStartDate });
  const analysisHistory = analysisRepo.getLatestAnalyses(ANALYSIS_HISTORY_LIMIT);

  return {
    view: { date, weekStartDate },
    diary,
    todos,
    weeklyTasks,
    analysisDraft: params.analysisDraft ?? null,
    analysisHistory,
    suggestions: params.suggestions,
  };
}
