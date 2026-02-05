import type { DashboardData } from "../../shared/types.js";

type TextContent = { type: "text"; text: string };

export function replyDashboard(message: string | null, data: DashboardData) {
  const content: TextContent[] = message ? [{ type: "text", text: message }] : [];
  return { content, structuredContent: data };
}
