// server/tools/weeklyTaskTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildDashboard, getWeekStartDate } from "./buildDashboard.js";
import { replyDashboard } from "./helpers.js";
import { ann, meta, zIsoDate, zViewDate } from "./tooling.js";

import * as weeklyRepo from "../repositories/weeklyTaskRepository.js";

export function registerWeeklyTaskTools(server: McpServer) {
  server.registerTool(
    "add_weekly_task",
    {
      title: "Add weekly task",
      description: "Use this when the user wants to add a weekly task for the current week.",
      inputSchema: {
        viewDate: zViewDate,
        weekStartDate: zIsoDate.optional(),
        title: z.string().min(1),
        clientId: z.string().optional(),
      },
      annotations: ann({ readOnly: false, destructive: false }),
      _meta: meta({
        invoking: "週間タスクを追加中...",
        invoked: "週間タスクを追加しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      const baseDate = args.viewDate ?? new Date().toISOString().slice(0, 10);
      const weekStartDate = args.weekStartDate ?? getWeekStartDate(baseDate);

      weeklyRepo.addWeeklyTask({
        weekStartDate,
        title: args.title,
        clientId: args.clientId,
      });

      const data = await buildDashboard({ viewDate: args.viewDate ?? baseDate });
      return replyDashboard("週間タスクを追加しました。", data);
    }
  );

  server.registerTool(
    "set_weekly_task_done",
    {
      title: "Set weekly task done",
      description: "Use this when the widget toggles completion for a weekly task item.",
      inputSchema: {
        viewDate: zViewDate,
        id: z.number().int().positive(),
        isDone: z.boolean(),
      },
      annotations: ann({ readOnly: false, destructive: false }),
      _meta: meta({
        invoking: "状態を更新中...",
        invoked: "状態を更新しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      weeklyRepo.setWeeklyTaskDone({ id: args.id, isDone: args.isDone });
      const data = await buildDashboard({ viewDate: args.viewDate });
      return replyDashboard(null, data);
    }
  );

  server.registerTool(
    "delete_weekly_task",
    {
      title: "Delete weekly task",
      description: "Use this when the user explicitly wants to delete a weekly task item.",
      inputSchema: {
        viewDate: zViewDate,
        id: z.number().int().positive(),
      },
      annotations: ann({ readOnly: false, destructive: true }),
      _meta: meta({
        invoking: "週間タスクを削除中...",
        invoked: "週間タスクを削除しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      weeklyRepo.deleteWeeklyTask(args.id);
      const data = await buildDashboard({ viewDate: args.viewDate });
      return replyDashboard("週間タスクを削除しました。", data);
    }
  );
}
