import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { buildDashboard } from "./buildDashboard.js";
import { replyDashboard } from "./helpers.js";
import { ann, meta, zViewDate } from "./tooling.js";

export function registerDashboardTools(server: McpServer) {
  server.registerTool(
    "load_dashboard",
    {
      title: "Load dashboard",
      description: "Use this when you need the latest dashboard data for a date.",
      inputSchema: { viewDate: zViewDate },
      annotations: ann({ readOnly: true, destructive: false, openWorld: false }),
      _meta: meta({
        invoking: "ダッシュボードを読み込み中...",
        invoked: "ダッシュボードを読み込みました",
        widgetAccessible: true,
        visibility: "public",
      }),
    },
    async (args) => {
      const data = await buildDashboard({ viewDate: args?.viewDate });
      return replyDashboard(null, data);
    }
  );
}
