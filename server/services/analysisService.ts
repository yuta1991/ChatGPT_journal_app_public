// server/services/analysisService.ts
import type { Diary } from "../../shared/types.js";

export function runBehaviorAnalysis(params: {
  periodType: "week" | "month";
  startDate: string;
  endDate: string;
  diaries: Diary[];
}) {
  const daysWithEntries = params.diaries.filter((d) => (d.content ?? "").trim().length > 0).length;

  const tagCounts = new Map<string, number>();
  for (const d of params.diaries) {
    for (const t of d.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, n]) => `${t}(${n})`);

  const summary = [
    `期間: ${params.startDate} 〜 ${params.endDate}（${params.periodType}）`,
    `記録日数: ${daysWithEntries} 日`,
    `よく出たタグ: ${topTags.length ? topTags.join(", ") : "なし"}`,
    "",
    "所見:",
    daysWithEntries >= 4 ? "・記録の継続ができています。" : "・記録が少なめなので、まずは短文でも継続が有効です。",
    "・次にやると良いこと: 明日やる1つを具体化して書く（例: 15分だけ）。",
  ].join("\n");

  return { summary };
}
