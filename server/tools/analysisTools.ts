// server/tools/analysisTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildDashboard, getWeekStartDate } from "./buildDashboard.js";
import { replyDashboard } from "./helpers.js";
import { ann, meta, zIsoDate, zViewDate } from "./tooling.js";

import * as diaryRepo from "../repositories/diaryRepository.js";
import * as analysisRepo from "../repositories/analysisRepository.js";
import { runBehaviorAnalysis } from "../services/analysisService.js";

function addDays(start: string, days: number) {
  const d = new Date(start + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeEndDate(periodType: "week" | "month", startDate: string) {
  if (periodType === "week") return addDays(startDate, 6);

  const d = new Date(startDate + "T00:00:00Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const firstNext = new Date(Date.UTC(y, m + 1, 1));
  firstNext.setUTCDate(firstNext.getUTCDate() - 1);
  return firstNext.toISOString().slice(0, 10);
}

export function registerAnalysisTools(server: McpServer) {
  server.registerTool(
    "run_analysis",
    {
      title: "Run analysis",
      description: "Use this when the user wants an analysis for a period.",
      inputSchema: {
        viewDate: zViewDate,
        periodType: z.enum(["week", "month"]),
        startDate: zIsoDate,
      },
      annotations: ann({ readOnly: false, destructive: false }),
      _meta: meta({
        invoking: "分析を生成中...",
        invoked: "分析を生成しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      const endDate = computeEndDate(args.periodType, args.startDate);
      const diaries = diaryRepo.listDiariesInRange({ startDate: args.startDate, endDate });

      const result = runBehaviorAnalysis({
        periodType: args.periodType,
        startDate: args.startDate,
        endDate,
        diaries,
      });

      const data = await buildDashboard({
        viewDate: args.viewDate ?? args.startDate,
        analysisDraft: {
          periodType: args.periodType,
          startDate: args.startDate,
          endDate,
          summary: result.summary,
        },
      });

      return replyDashboard(null, data);
    }
  );

  server.registerTool(
    "save_analysis",
    {
      title: "Save analysis",
      description: "Use this when the user confirms they want to save the analysis draft.",
      inputSchema: {
        viewDate: zViewDate,
        periodType: z.enum(["week", "month"]),
        startDate: zIsoDate,
        endDate: zIsoDate,
        summary: z.string().min(1),
      },
      annotations: ann({ readOnly: false, destructive: false }),
      _meta: meta({
        invoking: "分析を保存中...",
        invoked: "分析を保存しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      analysisRepo.createAnalysis({
        periodType: args.periodType,
        startDate: args.startDate,
        endDate: args.endDate,
        summary: args.summary,
      });

      const data = await buildDashboard({
        viewDate: args.viewDate ?? args.startDate,
        analysisDraft: null,
      });

      return replyDashboard("分析を保存しました。", data);
    }
  );
}
