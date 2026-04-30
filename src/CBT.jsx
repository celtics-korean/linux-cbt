import { useState, useEffect, useCallback } from "react";
import questions from "./data";

/* ───────────────────────────────── 유틸 ───────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ───────────────────────────────── 스타일 ───────────────────────────────── */
const S = {
  wrap: {
    minHeight: "100vh",
    background: "#f5f6fa",
    fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
    paddingBottom: 60,
  },
  header: {
    background: "linear-gradient(135deg, #1a3c8f 0%, #2563eb 100%)",
    color: "#fff",
    padding: "0 20px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 12px rgba(37,99,235,.35)",
  },
  headerInner: {
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 58,
    gap: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", whiteSpace: "nowrap" },
  scoreBadge: {
    background: "rgba(255,255,255,.18)",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  progressBar: {
    height: 4,
    background: "rgba(255,255,255,.2)",
    position: "relative",
    overflow: "hidden",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "#7dd3fc",
    transition: "width .4s ease",
  }),
  card: {
    maxWidth: 760,
    margin: "28px auto 0",
    padding: "0 16px",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  qNum: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },
  questionBox: {
    background: "#fff",
    borderRadius: 14,
    padding: "24px 24px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,.07), 0 4px 18px rgba(0,0,0,.04)",
    marginBottom: 12,
  },
  questionText: {
    fontSize: 16.5,
    lineHeight: 1.75,
    color: "#1e293b",
    fontWeight: 500,
    wordBreak: "keep-all",
  },
  optionBtn: (state) => {
    const base = {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      width: "100%",
      textAlign: "left",
      padding: "14px 18px",
      marginBottom: 9,
      border: "2px solid",
      borderRadius: 10,
      cursor: "pointer",
      fontSize: 15,
      lineHeight: 1.6,
      fontFamily: "inherit",
      transition: "all .18s ease",
      wordBreak: "keep-all",
    };
    if (state === "correct") return { ...base, background: "#f0fdf4", borderColor: "#22c55e", color: "#15803d" };
    if (state === "wrong")   return { ...base, background: "#fff1f2", borderColor: "#f43f5e", color: "#be123c" };
    if (state === "idle-answered") return { ...base, background: "#fff", borderColor: "#e2e8f0", color: "#94a3b8" };
    return { ...base, background: "#fff", borderColor: "#e2e8f0", color: "#334155" };
  },
  optionNum: (state) => {
    const base = {
      minWidth: 26,
      height: 26,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      flexShrink: 0,
      marginTop: 1,
    };
    if (state === "correct") return { ...base, background: "#22c55e", color: "#fff" };
    if (state === "wrong")   return { ...base, background: "#f43f5e", color: "#fff" };
    return { ...base, background: "#f1f5f9", color: "#64748b" };
  },
  descBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 10,
    padding: "16px 18px",
    marginTop: 10,
    marginBottom: 4,
  },
  descTitle: { fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 },
  descText: { fontSize: 14, color: "#78350f", lineHeight: 1.7 },
  noDesc: { fontSize: 14, color: "#a16207", fontStyle: "italic" },
  nextBtn: {
    display: "block",
    margin: "16px auto 0",
    padding: "13px 40px",
    background: "linear-gradient(135deg, #1a3c8f, #2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: ".3px",
    boxShadow: "0 4px 14px rgba(37,99,235,.4)",
    transition: "transform .15s, box-shadow .15s",
  },
  /* ── 결과 화면 ── */
  resultWrap: {
    maxWidth: 700,
    margin: "36px auto 0",
    padding: "0 16px",
  },
  resultCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "32px 28px",
    boxShadow: "0 2px 20px rgba(0,0,0,.08)",
    marginBottom: 18,
  },
  resultTitle: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: 6,
  },
  resultSub: { textAlign: "center", fontSize: 14, color: "#64748b", marginBottom: 28 },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 28,
  },
  statItem: (color) => ({
    background: color + "10",
    borderRadius: 12,
    padding: "16px 10px",
    textAlign: "center",
  }),
  statNum: (color) => ({ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }),
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionBtn: (primary) => ({
    flex: 1,
    minWidth: 120,
    padding: "12px 16px",
    background: primary ? "linear-gradient(135deg,#1a3c8f,#2563eb)" : "#f1f5f9",
    color: primary ? "#fff" : "#334155",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 700,
    transition: "opacity .15s",
  }),
  wrongList: {
    background: "#fff",
    borderRadius: 14,
    padding: "20px 22px",
    boxShadow: "0 1px 8px rgba(0,0,0,.07)",
  },
  wrongListTitle: { fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 },
  wrongItem: {
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: 14,
    marginBottom: 14,
  },
  wrongQ: { fontSize: 14, color: "#334155", lineHeight: 1.6, marginBottom: 6 },
  wrongAns: { fontSize: 12.5, color: "#64748b" },
  /* ── 시작 화면 ── */
  startWrap: {
    maxWidth: 540,
    margin: "50px auto 0",
    padding: "0 16px",
    textAlign: "center",
  },
  startCard: {
    background: "#fff",
    borderRadius: 18,
    padding: "40px 32px",
    boxShadow: "0 4px 30px rgba(0,0,0,.09)",
  },
  startIcon: { fontSize: 56, marginBottom: 14 },
  startTitle: { fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 8 },
  startSub: { fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 28 },
  optGroup: { textAlign: "left", marginBottom: 24 },
  optLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "#f8fafc",
    borderRadius: 10,
    marginBottom: 8,
    cursor: "pointer",
    fontSize: 14,
    color: "#334155",
    fontWeight: 500,
    border: "2px solid transparent",
    transition: "border-color .15s",
  },
  bigStartBtn: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg,#1a3c8f,#2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: ".5px",
    boxShadow: "0 6px 18px rgba(37,99,235,.4)",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════════════════════════════════════ */
export default function CBT() {
  /* ── 앱 단계: start | quiz | result ── */
  const [phase, setPhase] = useState("start");

  /* ── 옵션 ── */
  const [doShuffle, setDoShuffle] = useState(true);
  const [wrongOnly, setWrongOnly] = useState(false);

  /* ── 퀴즈 상태 ── */
  const [pool, setPool]     = useState([]);
  const [idx, setIdx]       = useState(0);
  const [selected, setSelected] = useState(null);
  const [showDesc, setShowDesc] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [score, setScore]   = useState(0);
  const [wrongs, setWrongs] = useState([]); // { q, options, a, desc, myAnswer }

  /* ── 저장된 오답 (localStorage) ── */
  const savedWrongs = (() => {
    try { return JSON.parse(localStorage.getItem("cbt_wrongs") || "[]"); } catch { return []; }
  })();

  /* ── 시작 ── */
  const startQuiz = useCallback((overridePool) => {
    let base = overridePool || (wrongOnly ? savedWrongs : questions);
    if (!base || base.length === 0) base = questions;
    const p = doShuffle ? shuffle(base) : [...base];
    setPool(p);
    setIdx(0);
    setSelected(null);
    setShowDesc(false);
    setScore(0);
    setWrongs([]);
    setPhase("quiz");
  }, [doShuffle, wrongOnly]);

  /* ── 답 선택 ── */
  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    setShowDesc(true);
    const cur = pool[idx];
    if (i === cur.a) {
      setScore(s => s + 1);
    } else {
      setWrongs(w => [...w, { ...cur, myAnswer: i }]);
    }
  };

  /* ── 다음 문제 ── */
  const handleNext = () => {
    if (idx + 1 >= pool.length) {
      // 오답 저장
      try {
        const newWrongs = [...wrongs];
        if (selected !== null && selected !== pool[idx].a) {
          // 마지막 문제가 오답이면 이미 wrongs에 들어있음
        }
        localStorage.setItem("cbt_wrongs", JSON.stringify(newWrongs));
      } catch {}
      setPhase("result");
    } else {
      setIdx(i => i + 1);
      setSelected(null);
      setShowDesc(false);
      setDescOpen(false);
    }
  };

  /* ── 옵션 상태 계산 ── */
  const optionState = (i) => {
    if (selected === null) return "idle";
    const cur = pool[idx];
    if (i === cur.a) return "correct";
    if (i === selected) return "wrong";
    return "idle-answered";
  };

  const pct = pool.length ? Math.round((idx / pool.length) * 100) : 0;
  const cur = pool[idx];

  /* ══════ 시작 화면 ══════ */
  if (phase === "start") {
    return (
      <div style={S.wrap}>
        <div style={S.startWrap}>
          <div style={S.startCard}>
            <div style={S.startIcon}>🐧</div>
            <h2 style={S.startTitle}>리눅스 마스터 2급 CBT</h2>
            <p style={S.startSub}>
              총 <strong>{questions.length}개</strong> 문제가 준비되어 있습니다.<br />
              옵션을 설정하고 시험을 시작하세요.
            </p>

            <div style={S.optGroup}>
              <label style={{ ...S.optLabel, borderColor: doShuffle ? "#2563eb" : "transparent" }}>
                <input
                  type="checkbox"
                  checked={doShuffle}
                  onChange={e => setDoShuffle(e.target.checked)}
                  style={{ width: 17, height: 17, accentColor: "#2563eb" }}
                />
                🔀 문제 랜덤 셔플
              </label>
              <label style={{ ...S.optLabel, borderColor: wrongOnly ? "#f43f5e" : "transparent" }}>
                <input
                  type="checkbox"
                  checked={wrongOnly}
                  onChange={e => setWrongOnly(e.target.checked)}
                  style={{ width: 17, height: 17, accentColor: "#f43f5e" }}
                  disabled={savedWrongs.length === 0}
                />
                ❌ 오답만 풀기
                {savedWrongs.length > 0
                  ? <span style={{ marginLeft: "auto", fontSize: 12, color: "#f43f5e" }}>{savedWrongs.length}개</span>
                  : <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>오답 없음</span>
                }
              </label>
            </div>

            <button style={S.bigStartBtn} onClick={() => startQuiz()}>
              시험 시작 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════ 결과 화면 ══════ */
  if (phase === "result") {
    const total = pool.length;
    const correct = score;
    const wrong = wrongs.length;
    const rate = Math.round((correct / total) * 100);
    const pass = rate >= 60;

    return (
      <div style={S.wrap}>
        <div style={{ ...S.header }}>
          <div style={S.headerInner}>
            <span style={S.headerTitle}>🐧 리눅스 마스터 CBT</span>
            <span style={S.scoreBadge}>시험 완료</span>
          </div>
        </div>

        <div style={S.resultWrap}>
          <div style={S.resultCard}>
            <div style={S.resultTitle}>
              {pass ? "🎉 합격권!" : "📚 더 공부해봐요"}
            </div>
            <p style={S.resultSub}>총 {total}문제 응시 완료</p>

            <div style={S.statGrid}>
              <div style={S.statItem("#2563eb")}>
                <div style={S.statNum("#2563eb")}>{rate}%</div>
                <div style={S.statLabel}>정답률</div>
              </div>
              <div style={S.statItem("#22c55e")}>
                <div style={S.statNum("#22c55e")}>{correct}</div>
                <div style={S.statLabel}>정답</div>
              </div>
              <div style={S.statItem("#f43f5e")}>
                <div style={S.statNum("#f43f5e")}>{wrong}</div>
                <div style={S.statLabel}>오답</div>
              </div>
            </div>

            {/* 정답률 바 */}
            <div style={{ background: "#f1f5f9", borderRadius: 8, height: 12, overflow: "hidden", marginBottom: 24 }}>
              <div style={{
                height: "100%",
                width: `${rate}%`,
                background: pass ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#f43f5e,#fb7185)",
                borderRadius: 8,
                transition: "width 1s ease",
              }} />
            </div>

            <div style={S.actionRow}>
              <button style={S.actionBtn(true)} onClick={() => startQuiz()}>
                🔄 전체 다시 풀기
              </button>
              {wrongs.length > 0 && (
                <button style={S.actionBtn(false)} onClick={() => {
                  setWrongOnly(true);
                  startQuiz(wrongs);
                }}>
                  ❌ 오답만 ({wrongs.length}개)
                </button>
              )}
              <button style={S.actionBtn(false)} onClick={() => setPhase("start")}>
                🏠 홈으로
              </button>
            </div>
          </div>

          {wrongs.length > 0 && (
            <div style={S.wrongList}>
              <p style={S.wrongListTitle}>❌ 오답 목록 ({wrongs.length}개)</p>
              {wrongs.map((w, i) => (
                <div key={i} style={i < wrongs.length - 1 ? S.wrongItem : { ...S.wrongItem, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                  <p style={S.wrongQ}><strong>Q{i + 1}.</strong> {w.q}</p>
                  <p style={S.wrongAns}>
                    내 답: <span style={{ color: "#f43f5e", fontWeight: 600 }}>{w.options[w.myAnswer]}</span>
                    {"  →  "}
                    정답: <span style={{ color: "#22c55e", fontWeight: 600 }}>{w.options[w.a]}</span>
                  </p>
                  {w.desc && (
                    <p style={{ ...S.wrongAns, color: "#78350f", marginTop: 4 }}>💡 {w.desc}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════ 퀴즈 화면 ══════ */
  return (
    <div style={S.wrap}>
      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <span style={S.headerTitle}>🐧 리눅스 마스터 CBT</span>
          <span style={S.scoreBadge}>
            ✅ {score} / {idx} 문제
          </span>
        </div>
        <div style={S.progressBar}>
          <div style={S.progressFill(pct)} />
        </div>
      </div>

      <div style={S.card}>
        {/* 메타 */}
        <div style={S.metaRow}>
          <span style={S.qNum}>문제 {idx + 1} / {pool.length}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            진행률 {pct}%
          </span>
        </div>

        {/* 문제 */}
        <div style={S.questionBox}>
          <p style={S.questionText}>{cur.q}</p>
        </div>

        {/* 선택지 */}
        <div>
          {cur.options.map((opt, i) => {
            const state = optionState(i);
            return (
              <button key={i} onClick={() => handleAnswer(i)} style={S.optionBtn(state)}>
                <span style={S.optionNum(state)}>{i + 1}</span>
                <span>{opt}</span>
                {selected !== null && i === cur.a && (
                  <span style={{ marginLeft: "auto", flexShrink: 0 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 정오답 표시 + 버튼 행 */}
        {showDesc && (
          <div style={{ marginTop: 14 }}>
            {/* 결과 배지 */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 8, marginBottom: 12,
              background: selected === cur.a ? "#f0fdf4" : "#fff1f2",
              border: `1.5px solid ${selected === cur.a ? "#22c55e" : "#f43f5e"}`,
              fontSize: 14, fontWeight: 700,
              color: selected === cur.a ? "#15803d" : "#be123c",
            }}>
              {selected === cur.a ? "✅ 정답입니다!" : "❌ 오답입니다!"}
            </div>

            {/* 버튼 행: 해설 보기 + 다음 문제 */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDescOpen(v => !v)}
                style={{
                  flex: 1, padding: "11px 16px",
                  background: descOpen ? "#fef9c3" : "#fff",
                  border: `1.5px solid ${descOpen ? "#f59e0b" : "#d1d5db"}`,
                  borderRadius: 9, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 600,
                  color: descOpen ? "#92400e" : "#374151",
                  transition: "all .15s",
                }}
              >
                {descOpen ? "💡 해설 닫기" : "💡 해설 보기"}
              </button>
              <button style={{ ...S.nextBtn, margin: 0, flex: 1 }} onClick={handleNext}>
                {idx + 1 >= pool.length ? "결과 보기 🏁" : "다음 문제 →"}
              </button>
            </div>

            {/* 해설 내용 */}
            {descOpen && (
              <div style={{ ...S.descBox, marginTop: 12 }}>
                {cur.desc
                  ? <p style={S.descText}>{cur.desc}</p>
                  : <p style={S.noDesc}>해설이 없는 문제입니다.</p>
                }
              </div>
            )}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
