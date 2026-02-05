// server/services/tagService.ts
export function generateTagsFromContent(content: string): string[] {
  const text = (content ?? "").trim();
  if (!text) return [];

  const candidates: Array<[RegExp, string]> = [
    [/仕事|業務|会社|会議/, "仕事"],
    [/運動|筋トレ|ラン|走/, "運動"],
    [/勉強|学習|読書/, "学習"],
    [/家族|子ども|妻|夫/, "家族"],
    [/疲れ|眠い|体調|頭痛/, "体調"],
    [/嬉しい|楽しい|最高/, "ポジティブ"],
    [/不安|つらい|落ち込|イライラ/, "メンタル"],
  ];

  const tags: string[] = [];
  for (const [re, tag] of candidates) {
    if (re.test(text) && !tags.includes(tag)) tags.push(tag);
    if (tags.length >= 5) break;
  }

  // 何も引っかからない時の保険
  if (tags.length === 0) tags.push("日記");

  return tags.slice(0, 5);
}
