// server/tools/diaryTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildDashboard } from "./buildDashboard.js";
import { replyDashboard } from "./helpers.js";
import { ann, meta, zIsoDate, zViewDate } from "./tooling.js";

import * as diaryRepo from "../repositories/diaryRepository.js";
import { generateTagsFromContent } from "../services/tagService.js";

export function registerDiaryTools(server: McpServer) {
  server.registerTool(
    "get_diary_by_date",
    {
      title: "Get diary by date",
      description: "Use this when you need to display the diary entry for a specific date.",
      inputSchema: { viewDate: zViewDate, date: zIsoDate },
      annotations: ann({ readOnly: true, destructive: false }),
      _meta: meta({
        invoking: "日記を読み込み中...",
        invoked: "日記を読み込みました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      const data = await buildDashboard({ viewDate: args?.date ?? args?.viewDate });
      return replyDashboard(null, data);
    }
  );

  server.registerTool(
    "save_diary",
    {
      title: "Save diary",
      description: "Use this when the user wants to create or update a diary entry for a date.",
      inputSchema: {
        viewDate: zViewDate,
        date: zIsoDate,
        content: z.string().default(""),
        tags: z.array(z.string().min(1)).max(5).optional(),
      },
      annotations: ann({ readOnly: false, destructive: false }),
      _meta: meta({
        invoking: "日記を保存中...",
        invoked: "日記を保存しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      const date = args.date;
      const content = (args.content ?? "").toString();
      const tags = (args.tags ?? []).slice(0, 5);

      diaryRepo.upsertDiary({ date, content, tags });

      const data = await buildDashboard({ viewDate: args.viewDate ?? date });
      return replyDashboard("日記を保存しました。", data);
    }
  );

  server.registerTool(
  "generate_diary_tags",
  {
    title: "Generate diary tags",
    description: "Use this when the user wants tag suggestions for the current diary content.",
    inputSchema: { viewDate: zViewDate, content: z.string().default("") },
    annotations: ann({ readOnly: true, destructive: false }),
    _meta: meta({
      invoking: "タグ候補を生成中...",
      invoked: "タグ候補を生成しました",
      widgetAccessible: true,
    }),
  },
  async (args) => {
    const tags = generateTagsFromContent(args.content ?? "").slice(0, 5);
    const data = await buildDashboard({
      viewDate: args.viewDate,
      suggestions: { diaryTags: tags },
    });
    return replyDashboard(null, data);
  }
);
}
