// shared/types.ts
export type Diary = {
  id: number;
  date: string; // YYYY-MM-DD
  content: string;
  tags: string[]; // 最大5
  createdAt: string;
  updatedAt: string;
};

export type Todo = {
  id: number;
  clientId?: string;
  title: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyTask = {
  id: number;
  clientId?: string;
  weekStartDate: string; // YYYY-MM-DD
  title: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Analysis = {
  id: number;
  periodType: "week" | "month";
  startDate: string;
  endDate: string;
  summary: string;
  createdAt: string;
};

export type AnalysisDraft = {
  periodType: "week" | "month";
  startDate: string;
  endDate: string;
  summary: string;
};

export type DashboardData = {
  view: {
    date: string; // UIが表示している日付（サーバー確定値）
    weekStartDate: string; // UIが表示している週の開始日（サーバー確定値）
  };
  diary: Diary | null;
  todos: Todo[];
  weeklyTasks: WeeklyTask[];
  analysisDraft: AnalysisDraft | null;
  analysisHistory: Analysis[]; // 最大N件（v1: 20想定）
  suggestions?: {
    diaryTags?: string[]; // generate_diary_tags 用（未保存）
  };
};
