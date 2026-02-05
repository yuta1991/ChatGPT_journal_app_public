import { z } from "zod";

// あなたのResource URIに合わせてください（今の設計のまま）
export const OUTPUT_TEMPLATE_URI = "ui://widget/journal.html";

// YYYY-MM-DD の軽いバリデーション
export const zIsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const zViewDate = zIsoDate.optional();

// Tool meta（書き忘れ事故を防ぐ）
export function meta(params: {
  invoking: string;
  invoked: string;
  widgetAccessible?: boolean; // default true
  visibility?: "public" | "private";
}) {
  return {
    "openai/outputTemplate": OUTPUT_TEMPLATE_URI,
    "openai/toolInvocation/invoking": params.invoking.slice(0, 64),
    "openai/toolInvocation/invoked": params.invoked.slice(0, 64),
    ...(params.widgetAccessible === false ? {} : { "openai/widgetAccessible": true }),
        ...(params.visibility === "private"
      ? { "openai/visibility": "private" }
      : {}),
  } as const;
}

// annotations（公式の3ヒント）
export function ann(params: { readOnly: boolean; destructive: boolean; openWorld?: boolean }) {
  return {
    readOnlyHint: params.readOnly,
    destructiveHint: params.destructive,
    openWorldHint: params.openWorld ?? false,
  } as const;
}
