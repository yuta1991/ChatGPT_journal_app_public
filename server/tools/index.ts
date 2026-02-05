// server/tools/index.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerDashboardTools } from "./dashboardTools.js";
import { registerDiaryTools } from "./diaryTools.js";
import { registerTodoTools } from "./todoTools.js";
import { registerWeeklyTaskTools } from "./weeklyTaskTools.js";
import { registerAnalysisTools } from "./analysisTools.js";

export function registerAllTools(server: McpServer) {
  registerDashboardTools(server);
  registerTodoTools(server);
  registerWeeklyTaskTools(server);
  registerDiaryTools(server);
  registerAnalysisTools(server);
}

import type { DashboardData } from "../../shared/types.js";

const OUTPUT_TEMPLATE_URI = "ui://widget/journal.html";
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORIGIN = "https://brankie-municipally-marleigh.ngrok-free.dev";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// 日曜始まり（必要なら後で固定変更）
function getWeekStartDate(date: string) {
  const d = new Date(date + "T00:00:00Z");
  const day = d.getUTCDay(); // 0=Sun
  d.setUTCDate(d.getUTCDate() - day);
  return toIsoDate(d);
}

// DB未実装なので仮のDashboardData（空でOK）
function buildDashboard(viewDate?: string): DashboardData {
  const date = viewDate ?? toIsoDate(new Date());
  const weekStartDate = getWeekStartDate(date);

  return {
    view: { date, weekStartDate },
    diary: null,
    todos: [],
    weeklyTasks: [],
    analysisDraft: null,
    analysisHistory: [],
    suggestions: undefined,
  };
}

function readUiDistText(fileName: string) {
  // このファイル(server/tools/index.ts)の実在場所を基準に repo-root を求める
  const here = path.dirname(fileURLToPath(import.meta.url)); // .../server/tools
  const repoRoot = path.resolve(here, "..", "..");           // .../ (repo root)
  const fullPath = path.resolve(repoRoot, "ui", "dist", fileName);

  return readFileSync(fullPath, "utf8");
}

export function createJournalCoachServer() {
  const server = new McpServer({ name: "journal-coach", version: "0.1.0" });

  const JS = readUiDistText("widget.js");
  const CSS = readUiDistText("ui.css");

  const htmlContent = `
    <div id="journal-root"></div>
    <style>${CSS}</style>
    <script type="module">${JS}</script>
  `.trim();

  server.registerResource("journal-widget", OUTPUT_TEMPLATE_URI, {}, async () => ({
    contents: [
      {
        uri: OUTPUT_TEMPLATE_URI,
        mimeType: "text/html+skybridge",
        text: htmlContent,
        _meta: {
          "openai/widgetPrefersBorder": true,

          // ★CSP許可（まずはこれだけ入れて挙動を見る）
          "openai/widgetCSP": {
            connect_domains: [ORIGIN],
            resource_domains: [ORIGIN],
          },

          // （任意）警告を減らす目的
          "openai/widgetDomain": ORIGIN,
        },
      },
    ],
  }));

  registerAllTools(server);

  return server;
}
