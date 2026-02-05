import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { buildDashboard } from "./buildDashboard.js";
import { replyDashboard } from "./helpers.js";
import { ann, meta, zViewDate } from "./tooling.js";

import * as todoRepo from "../repositories/todoRepository.js";


export function registerTodoTools(server: McpServer) {
  server.registerTool(
    "add_todo",
    {
      title: "Add todo",
      description: "Use this when the user wants to add a new todo item.",
      inputSchema: { viewDate: zViewDate, title: z.string().min(1), clientId: z.string().optional() },
      annotations: ann({ readOnly: false, destructive: false }),
      _meta: meta({
        invoking: "Todoを追加中...",
        invoked: "Todoを追加しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      await todoRepo.addTodo({ title: args.title, clientId: args.clientId });
      const data = await buildDashboard({ viewDate: args.viewDate });
      return replyDashboard("Todoを追加しました。", data);
    }
  );

  server.registerTool(
    "set_todo_done",
    {
      title: "Set todo done",
      description: "Use this when the widget toggles completion for a todo item.",
      inputSchema: { viewDate: zViewDate, id: z.number().int().positive(), isDone: z.boolean() },
      annotations: ann({ readOnly: false, destructive: false }),
      _meta: meta({
        invoking: "状態を更新中...",
        invoked: "状態を更新しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      await todoRepo.setTodoDone({ id: args.id, isDone: args.isDone });
      const data = await buildDashboard({ viewDate: args.viewDate });
      return replyDashboard(null, data);
    }
  );

  server.registerTool(
    "delete_todo",
    {
      title: "Delete todo",
      description: "Use this when the user explicitly wants to delete a todo item.",
      inputSchema: { viewDate: zViewDate, id: z.number().int().positive() },
      annotations: ann({ readOnly: false, destructive: true }),
      _meta: meta({
        invoking: "Todoを削除中...",
        invoked: "Todoを削除しました",
        widgetAccessible: true,
      }),
    },
    async (args) => {
      await todoRepo.deleteTodo(args.id);
      const data = await buildDashboard({ viewDate: args.viewDate });
      return replyDashboard("Todoを削除しました。", data);
    }
  );
}
