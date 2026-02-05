import { useEffect, useMemo, useState } from "react";
import type { DashboardData } from "../../shared/types";
import { useToolOutput } from "./hooks/useOpenAiGlobal";

function isDashboardData(x: any): x is DashboardData {
  return !!x && typeof x === "object" && !!x.view && typeof x.view?.date === "string";
}

function formatJst(dateStr?: string) {
  if (!dateStr) return "";

  const isoLike = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z";
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function App() {
  const globalToolOutput = useToolOutput<DashboardData>();
  const [toolOutput, setToolOutput] = useState<DashboardData | undefined>(globalToolOutput);

  // host が toolOutput を更新できる環境なら、それを優先して同期
  useEffect(() => {
    if (globalToolOutput) setToolOutput(globalToolOutput);
  }, [globalToolOutput]);

  const viewDate = toolOutput?.view?.date;

  // ----- Todos -----
  const [title, setTitle] = useState("");
  const todos = useMemo(() => toolOutput?.todos ?? [], [toolOutput]);

  // ----- Weekly Tasks -----
  const [weeklyTitle, setWeeklyTitle] = useState("");
  const weekStartDate = toolOutput?.view?.weekStartDate;
  const weeklyTasks = useMemo(() => toolOutput?.weeklyTasks ?? [], [toolOutput]);

  // ----- Dialy -----
  const [diaryContent, setDiaryContent] = useState("");
  const [diaryTagsText, setDiaryTagsText] = useState(""); // "仕事,疲れた" みたいに入力

  // ★追記：toolOutput（=サーバの最新）に diary を同期
  useEffect(() => {
    const d = toolOutput?.diary;
    if (!toolOutput?.view?.date) return;

    // 初期表示/日付変更/保存後に追従
    setDiaryContent(d?.content ?? "");
    setDiaryTagsText((d?.tags ?? []).join(","));
  }, [toolOutput?.view?.date, toolOutput?.diary?.updatedAt]);

  const callTool = async (name: string, args: any) => {
    const openai = (window as any).openai;
    if (!openai?.callTool) {
      alert("window.openai.callTool が見つかりません（ChatGPT内のウィジェットで開いていますか？）");
      return null;
    }

    try {
      const res = await openai.callTool(name, args);

      // host差異吸収：structuredContent があればそれを、なければ res を見る
      const next = (res as any)?.structuredContent ?? res;

      // DashboardData っぽい返り値なら、ローカルstateを更新して即反映
      if (isDashboardData(next)) {
        setToolOutput(next);
      }

      return res;
    } catch (e) {
      console.error(e);
      alert("ツール呼び出しに失敗しました。サーバー/接続設定を確認してください。");
      return null;
    }
  };

  // 起動時に1回だけ読み込み（toolOutput が空の時の初期化）
  useEffect(() => {
    void callTool("load_dashboard", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTodo = async () => {
    const t = title.trim();
    if (!t) return;

    const res = await callTool("add_todo", { viewDate, title: t });

    // 成功時だけ入力を消す（失敗時は残す）
    if (res && !(res as any).isError) setTitle("");
  };

  const addWeeklyTask = async () => {
    const t = weeklyTitle.trim();
    if (!t) return;

    // weekStartDate はサーバ側で viewDate から算出するので渡さなくてOK
    const res = await callTool("add_weekly_task", { viewDate, title: t });

    if (res && !(res as any).isError) setWeeklyTitle("");
  };

  // ★追記：日記保存
  const saveDiary = async () => {
    if (!viewDate) return;

    const tags = diaryTagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    await callTool("save_diary", {
      viewDate,
      date: viewDate,
      content: diaryContent,
      tags,
    });
  };

  // ===== ここから追記：Analysis =====
  const [periodType, setPeriodType] = useState<"week" | "month">("week");
  const [analysisStartDate, setAnalysisStartDate] = useState("");

  // ★保存日時表示のため：最後に「保存」した分析を特定するキー
  const [lastSavedAnalysisKey, setLastSavedAnalysisKey] = useState("");

  // ★分析を特定するキー生成（periodType + start/end）
  const makeAnalysisKey = (a: { periodType: string; startDate: string; endDate: string }) =>
    `${a.periodType}:${a.startDate}:${a.endDate}`;

  // ★履歴は起動直後は折り畳み
  const [analysisHistoryOpen, setAnalysisHistoryOpen] = useState(false);

  // ★最新1件（カード上に見せたい用）
  const latestAnalysis = useMemo(() => {
    const hist = toolOutput?.analysisHistory ?? [];
    if (hist.length === 0) return null;
    return [...hist].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
  }, [toolOutput?.analysisHistory]);

  // A案：起動時に startDate を自動入力しない（入力欄は空のまま）
  // ===== ここまで追記：Analysis =====

  // ===== UIテーマ（追記：ガラス/紫グロー統一）=====
  const UI = {
    text: "rgba(255,255,255,0.92)",
    muted: "rgba(255,255,255,0.66)",
    cardBg: "rgba(255,255,255,0.07)",
    cardBorder: "rgba(255,255,255,0.14)",
    fieldBg: "rgba(0,0,0,0.22)",
    fieldBorder: "rgba(255,255,255,0.16)",
    accentA: "rgba(99,102,241,1)",
    accentB: "rgba(168,85,247,1)",
    success: "rgba(34,197,94,0.9)",
  };

  const cardStyle: React.CSSProperties = {
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${UI.cardBorder}`,
    background: UI.cardBg,
    boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${UI.fieldBorder}`,
    background: UI.fieldBg,
    color: UI.text,
    outline: "none",
  };

  const ghostButton: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${UI.fieldBorder}`,
    background: "rgba(255,255,255,0.06)",
    color: UI.text,
    cursor: "pointer",
  };

  const primaryButton: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: `linear-gradient(135deg, ${UI.accentA}, ${UI.accentB})`,
    color: "white",
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(120,90,255,0.35)",
  };

  const rowCardStyle: React.CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${UI.fieldBorder}`,
    background: "rgba(0,0,0,0.18)",
    color: UI.text,
  };

  return (
    <div
      style={{
        padding: 14,
        fontFamily: "system-ui",
        color: UI.text,
        background:
          "radial-gradient(900px 600px at 20% 0%, rgba(99,102,241,0.35), transparent 60%)," +
          "radial-gradient(900px 600px at 90% 30%, rgba(168,85,247,0.28), transparent 55%)," +
          "rgba(10,10,15,1)",
      }}
    >
      <div style={{ display: "grid", gap: 12, maxWidth: 720, margin: "0 auto" }}>
        {/* ===== Diary ===== */}
        <section style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Diary</div>

          <textarea
            value={diaryContent}
            onChange={(e) => setDiaryContent(e.target.value)}
            placeholder="今日の出来事や気分を自由に書いてください"
            rows={6}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 120,
              lineHeight: 1.5,
            }}
          />

          <button onClick={saveDiary} style={{ ...primaryButton, width: "100%", marginTop: 10 }}>
            保存
          </button>

          <input
            value={diaryTagsText}
            onChange={(e) => setDiaryTagsText(e.target.value)}
            placeholder="タグ（カンマ区切り、最大5つ） 例：仕事,運動,疲れた"
            style={{ ...inputStyle, marginTop: 10 }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={async () => {
                await callTool("generate_diary_tags", { viewDate, content: diaryContent });
              }}
              style={ghostButton}
            >
              タグ候補を生成
            </button>

            <button
              onClick={async () => {
                const tags = (toolOutput?.suggestions?.diaryTags ?? []).slice(0, 5);
                if (tags.length === 0) return;
                setDiaryTagsText(tags.join(","));
              }}
              style={ghostButton}
              title="生成されたタグを入力欄に反映"
            >
              候補を適用
            </button>
          </div>

          {(toolOutput?.suggestions?.diaryTags?.length ?? 0) > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: UI.muted }}>
              タグ候補: {(toolOutput?.suggestions?.diaryTags ?? []).join(", ")}
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 12, color: UI.muted }}>
            保存日時（日本時間）: {formatJst(toolOutput?.diary?.updatedAt) || "(未保存)"}
          </div>
        </section>

        {/* ===== Weekly Tasks ===== */}
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Weekly Tasks</div>
            <div style={{ fontSize: 12, color: UI.muted }}>追加</div>
          </div>

          <div style={{ fontSize: 12, color: UI.muted, marginTop: 6 }}>
            weekStartDate: {weekStartDate ?? "(loading...)"}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={weeklyTitle}
              onChange={(e) => setWeeklyTitle(e.target.value)}
              placeholder="例：今週やること"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addWeeklyTask} style={ghostButton}>
              追加
            </button>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {weeklyTasks.map((w) => (
              <div key={w.id} style={rowCardStyle}>
                <button
                  type="button"
                  onClick={() =>
                    callTool("set_weekly_task_done", { viewDate, id: w.id, isDone: !w.isDone })
                  }
                  aria-pressed={w.isDone}
                  title={w.isDone ? "未完了に戻す" : "完了にする"}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: `1px solid ${UI.fieldBorder}`,
                    background: w.isDone ? UI.success : "transparent",
                    color: w.isDone ? "#001" : UI.text,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                    cursor: "pointer",
                  }}
                >
                  {w.isDone ? "✓" : ""}
                </button>

                <div style={{ flex: 1, textDecoration: w.isDone ? "line-through" : "none" }}>
                  {w.title}
                </div>

                <button
                  onClick={() => callTool("delete_weekly_task", { viewDate, id: w.id })}
                  style={{ ...ghostButton, padding: "8px 10px" }}
                  title="削除"
                >
                  削除
                </button>
              </div>
            ))}

            {weeklyTasks.length === 0 && <div style={{ color: UI.muted }}>まだ週間タスクがありません</div>}
          </div>
        </section>

        {/* ===== Todos ===== */}
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Todos</div>
            <div style={{ fontSize: 12, color: UI.muted }}>追加</div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：test"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addTodo} style={ghostButton}>
              追加
            </button>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {todos.map((t) => (
              <div key={t.id} style={rowCardStyle}>
                <button
                  type="button"
                  onClick={() => callTool("set_todo_done", { viewDate, id: t.id, isDone: !t.isDone })}
                  aria-pressed={t.isDone}
                  title={t.isDone ? "未完了に戻す" : "完了にする"}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: `1px solid ${UI.fieldBorder}`,
                    background: t.isDone ? UI.success : "transparent",
                    color: t.isDone ? "#001" : UI.text,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                    cursor: "pointer",
                  }}
                >
                  {t.isDone ? "✓" : ""}
                </button>

                <div style={{ flex: 1, textDecoration: t.isDone ? "line-through" : "none" }}>
                  {t.title}
                </div>

                <button
                  onClick={() => callTool("delete_todo", { viewDate, id: t.id })}
                  style={{ ...ghostButton, padding: "8px 10px" }}
                  title="削除"
                >
                  削除
                </button>
              </div>
            ))}

            {todos.length === 0 && <div style={{ color: UI.muted }}>まだTodoがありません</div>}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: UI.muted }}>
            viewDate: {viewDate ?? "(loading...)"}
          </div>
        </section>

        {/* ===== Analysis ===== */}
        <section style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Analysis</div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              style={{
                ...inputStyle,
                width: "auto",
                minWidth: 130,
                background: "rgba(255,255,255,0.92)",
                color: "#111",
              }}
            >
              <option value="week">week（週）</option>
              <option value="month">month（月）</option>
            </select>

            <input
              type="date"
              value={analysisStartDate}
              onChange={(e) => setAnalysisStartDate(e.target.value)}
              style={{
                ...inputStyle,
                width: "auto",
                minWidth: 180,
                background: "rgba(255,255,255,0.92)",
                color: "#111",
                appearance: "auto",
                colorScheme: "light",
              }}
            />

            <button
              onClick={async () => {
                if (!analysisStartDate) {
                  alert("startDate を入力してください（例：2025-12-14）");
                  return;
                }
                await callTool("run_analysis", { viewDate, periodType, startDate: analysisStartDate });
              }}
              style={primaryButton}
              title="AIで分析文（draft）を作ります"
            >
              分析を生成
            </button>
          </div>

          {/* draft（生成結果） */}
          {toolOutput?.analysisDraft && (
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              <div style={{ fontSize: 12, color: UI.muted }}>
                draft: {toolOutput.analysisDraft.startDate}〜{toolOutput.analysisDraft.endDate}
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${UI.fieldBorder}`,
                  background: "rgba(255,255,255,0.06)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                }}
              >
                {toolOutput.analysisDraft.summary}
              </div>

              <button
                onClick={async () => {
                  const d = toolOutput.analysisDraft!;
                  // ★保存したdraftを特定しておく（保存後にcreatedAtを拾う）
                  setLastSavedAnalysisKey(makeAnalysisKey(d));

                  await callTool("save_analysis", { viewDate, ...d });
                }}
                style={{ ...ghostButton, width: 120 }}
              >
                保存
              </button>
            </div>
          )}

          {/* 保存日時（日本時間） */}
          {lastSavedAnalysisKey && (
            <div style={{ fontSize: 12, color: UI.muted, marginTop: 8 }}>
              保存日時（日本時間）:{" "}
              {(() => {
                const hit = (toolOutput?.analysisHistory ?? []).find(
                  (a) => makeAnalysisKey(a) === lastSavedAnalysisKey
                );
                return hit ? formatJst(hit.createdAt) : "(保存後に反映されます)";
              })()}
            </div>
          )}

          {/* 起動直後に“履歴が勝手に見えてしまう”対策：最新1件だけを要約表示 */}
          {latestAnalysis && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: UI.muted, marginBottom: 6 }}>直近（最新の分析）</div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${UI.fieldBorder}`,
                  background: "rgba(0,0,0,0.18)",
                }}
              >
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 8 }}>
                  {latestAnalysis.periodType} {latestAnalysis.startDate}〜{latestAnalysis.endDate} /{" "}
                  {formatJst(latestAnalysis.createdAt)}
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{latestAnalysis.summary}</div>
              </div>
            </div>
          )}

          {/* 履歴（折り畳み） */}
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setAnalysisHistoryOpen((v) => !v)}
              style={{ ...ghostButton, width: "100%", textAlign: "left" }}
            >
              履歴（最新20件）{analysisHistoryOpen ? " ▲" : " ▼"}
            </button>

            {analysisHistoryOpen && (
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {(toolOutput?.analysisHistory ?? []).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 14,
                      border: `1px solid ${UI.fieldBorder}`,
                      background: "rgba(255,255,255,0.06)",
                      color: UI.text,
                    }}
                  >
                    <div style={{ fontSize: 12, color: UI.muted, marginBottom: 8 }}>
                      {a.periodType} {a.startDate}〜{a.endDate} / {formatJst(a.createdAt)}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{a.summary}</div>
                  </div>
                ))}

                {(toolOutput?.analysisHistory?.length ?? 0) === 0 && (
                  <div style={{ color: UI.muted }}>まだ分析履歴がありません</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
