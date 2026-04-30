import { useState, useCallback, useEffect, useRef } from "react";
import questions from "./data";

/* ─── 유틸 ─── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CATEGORIES = ["전체", ...Array.from(new Set(questions.map(q => q.category))).sort()];

const LS = {
  PROGRESS: "cbt_progress",
  WRONGS:   "cbt_wrongs",
  BOOKMARKS:"cbt_bookmarks",
  HISTORY:  "cbt_history",
};

const ls = {
  get: (k, def = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)    => { try { localStorage.removeItem(k); } catch {} },
};

/* ─── 스타일 ─── */
const C = {
  blue:  "#2563eb", darkBlue: "#1a3c8f",
  green: "#22c55e", red: "#f43f5e",
  yellow:"#f59e0b", purple:"#6366f1",
  gray:  "#64748b", lightGray:"#f1f5f9",
};

const S = {
  wrap: { minHeight:"100vh", background:"#f5f6fa", fontFamily:"'Pretendard','Noto Sans KR',sans-serif", paddingBottom:80 },
  header: { background:`linear-gradient(135deg,${C.darkBlue} 0%,${C.blue} 100%)`, color:"#fff", padding:"0 16px", position:"sticky", top:0, zIndex:200, boxShadow:"0 2px 12px rgba(37,99,235,.35)" },
  headerInner: { maxWidth:860, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, gap:8 },
  headerTitle: { fontSize:15, fontWeight:700, whiteSpace:"nowrap" },
  scoreBadge: { background:"rgba(255,255,255,.18)", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:600, whiteSpace:"nowrap" },
  backBtn: { background:"rgba(255,255,255,.18)", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", padding:"5px 12px", fontSize:12, fontWeight:600, whiteSpace:"nowrap" },
  progressBar: { height:3, background:"rgba(255,255,255,.2)" },
  progressFill: (pct) => ({ height:"100%", width:`${pct}%`, background:"#7dd3fc", transition:"width .4s ease" }),

  // 네비게이션 바
  navBar: { background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"8px 16px", position:"sticky", top:52, zIndex:190, overflowX:"auto", whiteSpace:"nowrap" },
  navBarInner: { maxWidth:860, margin:"0 auto", display:"flex", gap:4 },
  navDot: (state) => {
    const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:6, fontSize:11, fontWeight:700, border:"1.5px solid", cursor:"pointer", flexShrink:0 };
    if (state === "correct")   return { ...base, background:"#f0fdf4", borderColor:C.green,  color:C.green };
    if (state === "wrong")     return { ...base, background:"#fff1f2", borderColor:C.red,    color:C.red };
    if (state === "bookmarked")return { ...base, background:"#fffbeb", borderColor:C.yellow, color:C.yellow };
    if (state === "answered")  return { ...base, background:"#eef2ff", borderColor:C.purple, color:C.purple };
    return { ...base, background:"#f8fafc", borderColor:"#cbd5e1", color:C.gray };
  },

  // 시작 화면
  startWrap: { maxWidth:560, margin:"40px auto 0", padding:"0 16px" },
  startCard: { background:"#fff", borderRadius:18, padding:"36px 28px", boxShadow:"0 4px 30px rgba(0,0,0,.09)", marginBottom:16 },
  startIcon: { fontSize:48, marginBottom:12, textAlign:"center" },
  startTitle: { fontSize:21, fontWeight:800, color:"#1e293b", marginBottom:6, textAlign:"center" },
  startSub: { fontSize:13, color:C.gray, lineHeight:1.7, marginBottom:24, textAlign:"center" },
  sectionTitle: { fontSize:13, fontWeight:700, color:"#475569", marginBottom:8, marginTop:16 },
  optLabel: (active) => ({ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:"#f8fafc", borderRadius:10, marginBottom:7, cursor:"pointer", fontSize:13.5, color:"#334155", fontWeight:500, border:`2px solid ${active?"#2563eb":"transparent"}`, transition:"border-color .15s" }),
  catGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:4 },
  catBtn: (active) => ({ padding:"8px 10px", background:active?"#eef2ff":"#f8fafc", border:`1.5px solid ${active?C.purple:"#e2e8f0"}`, borderRadius:8, cursor:"pointer", fontSize:12.5, fontWeight:active?700:500, color:active?C.purple:"#475569", textAlign:"left", transition:"all .15s" }),
  bigBtn: (color="blue") => ({ width:"100%", padding:"14px", background:color==="blue"?`linear-gradient(135deg,${C.darkBlue},${C.blue})`:`linear-gradient(135deg,#dc2626,${C.red})`, color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontSize:15, fontWeight:800, boxShadow:`0 6px 18px rgba(37,99,235,.35)`, marginBottom:8 }),
  resumeBtn: { width:"100%", padding:"12px", background:"#fff", color:C.blue, border:`2px solid ${C.blue}`, borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:700, marginBottom:8 },

  // 통계 카드
  statsCard: { background:"#fff", borderRadius:14, padding:"20px 22px", boxShadow:"0 1px 8px rgba(0,0,0,.07)", marginBottom:16 },
  statsTitle: { fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:12 },
  historyRow: { display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 },

  // 퀴즈
  listWrap: { maxWidth:860, margin:"0 auto", padding:"20px 16px 0" },
  topBar: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 },
  qCard: (answered) => ({ background:"#fff", borderRadius:14, padding:"20px 22px", marginBottom:14, boxShadow:answered?"0 1px 4px rgba(0,0,0,.06),0 0 0 2px #e0e7ff":"0 1px 4px rgba(0,0,0,.07)", transition:"box-shadow .2s" }),
  qMeta: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  qNum: { fontSize:11, fontWeight:700, color:C.purple, background:"#eef2ff", padding:"2px 9px", borderRadius:20 },
  qCat: { fontSize:11, color:C.gray, background:"#f1f5f9", padding:"2px 8px", borderRadius:20 },
  qText: { fontSize:15, lineHeight:1.75, color:"#1e293b", fontWeight:500, marginBottom:14, wordBreak:"keep-all" },
  optBtn: (state) => {
    const base = { display:"flex", alignItems:"flex-start", gap:10, width:"100%", textAlign:"left", padding:"11px 15px", marginBottom:7, border:"1.5px solid", borderRadius:9, cursor:"pointer", fontSize:14, lineHeight:1.6, fontFamily:"inherit", transition:"all .15s", wordBreak:"keep-all" };
    if (state==="correct")       return { ...base, background:"#f0fdf4", borderColor:C.green, color:"#15803d" };
    if (state==="wrong")         return { ...base, background:"#fff1f2", borderColor:C.red,   color:"#be123c" };
    if (state==="idle-answered") return { ...base, background:"#fafafa", borderColor:"#e2e8f0", color:"#94a3b8" };
    return { ...base, background:"#fff", borderColor:"#e2e8f0", color:"#334155" };
  },
  optNum: (state) => {
    const base = { minWidth:23, height:23, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0, marginTop:2 };
    if (state==="correct") return { ...base, background:C.green, color:"#fff" };
    if (state==="wrong")   return { ...base, background:C.red,   color:"#fff" };
    return { ...base, background:"#f1f5f9", color:C.gray };
  },
  bookmarkBtn: (active) => ({ background:"none", border:"none", cursor:"pointer", fontSize:18, padding:"2px 4px", color:active?C.yellow:"#cbd5e1", transition:"color .15s" }),
  descToggleBtn: (open) => ({ padding:"7px 14px", background:open?"#fef9c3":"#f8fafc", border:`1.5px solid ${open?C.yellow:"#e2e8f0"}`, borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:600, color:open?"#92400e":"#475569", transition:"all .15s" }),
  descBox: { background:"#fffbeb", border:"1px solid #fde68a", borderRadius:9, padding:"13px 15px", marginTop:9, fontSize:13, color:"#78350f", lineHeight:1.75 },
  finishBtn: { padding:"13px 44px", background:`linear-gradient(135deg,${C.darkBlue},${C.blue})`, color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:800, boxShadow:"0 6px 18px rgba(37,99,235,.4)" },

  // 결과
  resultWrap: { maxWidth:700, margin:"32px auto 0", padding:"0 16px" },
  resultCard: { background:"#fff", borderRadius:16, padding:"28px 24px", boxShadow:"0 2px 20px rgba(0,0,0,.08)", marginBottom:16 },
  statGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 },
  statItem: (c) => ({ background:c+"10", borderRadius:12, padding:"14px 10px", textAlign:"center" }),
  statNum: (c) => ({ fontSize:26, fontWeight:800, color:c, lineHeight:1.1 }),
  statLabel: { fontSize:11, color:C.gray, marginTop:3 },
  actionRow: { display:"flex", gap:8, flexWrap:"wrap" },
  actionBtn: (primary, danger) => ({ flex:1, minWidth:110, padding:"11px 14px", background:primary?(danger?`linear-gradient(135deg,#dc2626,${C.red})`:`linear-gradient(135deg,${C.darkBlue},${C.blue})`):"#f1f5f9", color:primary?"#fff":"#334155", border:"none", borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700 }),
  wrongList: { background:"#fff", borderRadius:14, padding:"18px 20px", boxShadow:"0 1px 8px rgba(0,0,0,.07)" },
};

/* ─── 문제 카드 ─── */
function QuestionCard({ q, qIndex, total, onAnswer, answered, bookmarks, onBookmark, cardRef }) {
  const [descOpen, setDescOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(answered?.myAnswer ?? null);
  const isBookmarked = bookmarks.has(q.id);

  const handleClick = (i) => {
    if (!answered) onAnswer(q.id, i);
    setHighlighted(i);
  };

  const optState = (i) => {
    if (highlighted === null) return "idle";
    if (i === q.a) return "correct";
    if (i === highlighted) return "wrong";
    return "idle-answered";
  };

  const firstCorrect = answered?.myAnswer === q.a;

  return (
    <div ref={cardRef} style={S.qCard(!!answered)}>
      <div style={S.qMeta}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={S.qNum}>문제 {qIndex + 1} / {total}</span>
          <span style={S.qCat}>{q.category}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {answered && (
            <span style={{ fontSize:11, color:firstCorrect?C.green:C.red, fontWeight:700 }}>
              {firstCorrect ? "✅ 정답" : "❌ 오답"}
            </span>
          )}
          <button style={S.bookmarkBtn(isBookmarked)} onClick={() => onBookmark(q.id)} title="북마크">
            {isBookmarked ? "★" : "☆"}
          </button>
        </div>
      </div>
      <p style={S.qText}>{q.q}</p>
      {q.options.map((opt, i) => {
        const state = optState(i);
        return (
          <button key={i} onClick={() => handleClick(i)} style={S.optBtn(state)}>
            <span style={S.optNum(state)}>{i + 1}</span>
            <span>{opt}</span>
            {answered && i === q.a && <span style={{ marginLeft:"auto", flexShrink:0 }}>✓</span>}
          </button>
        );
      })}
      {answered && (
        <div style={{ marginTop:6 }}>
          <button style={S.descToggleBtn(descOpen)} onClick={() => setDescOpen(v => !v)}>
            {descOpen ? "💡 해설 닫기" : "💡 해설 보기"}
          </button>
          {descOpen && <div style={S.descBox}>{q.desc || "해설이 없는 문제입니다."}</div>}
        </div>
      )}
    </div>
  );
}

/* ─── 메인 ─── */
export default function CBT() {
  const [phase, setPhase] = useState("start");
  const [doShuffle, setDoShuffle] = useState(true);
  const [selectedCat, setSelectedCat] = useState("전체");
  const [pool, setPool] = useState([]);
  const [answeredMap, setAnsweredMap] = useState({});
  const [bookmarks, setBookmarks] = useState(() => new Set(ls.get(LS.BOOKMARKS, [])));
  const [savedWrongs, setSavedWrongs] = useState(() => ls.get(LS.WRONGS, []));
  const [history, setHistory] = useState(() => ls.get(LS.HISTORY, []));
  const [hasSavedProgress, setHasSavedProgress] = useState(() => !!ls.get(LS.PROGRESS));
  const cardRefs = useRef([]);

  // 진행상황 자동 저장
  useEffect(() => {
    if (phase === "quiz" && pool.length > 0) {
      ls.set(LS.PROGRESS, { pool, answeredMap });
    }
  }, [answeredMap, phase, pool]);

  const startQuiz = useCallback((overridePool) => {
    ls.del(LS.PROGRESS);
    let base = overridePool;
    if (!base) {
      const catFiltered = selectedCat === "전체" ? questions : questions.filter(q => q.category === selectedCat);
      base = catFiltered.length > 0 ? catFiltered : questions;
    }
    const p = doShuffle ? shuffle(base) : [...base];
    cardRefs.current = [];
    setPool(p);
    setAnsweredMap({});
    setPhase("quiz");
    setTimeout(() => window.scrollTo({ top:0, behavior:"smooth" }), 50);
  }, [doShuffle, selectedCat]);

  const startBookmarkQuiz = () => {
    const bookmarkedQs = questions.filter(q => bookmarks.has(q.id));
    if (bookmarkedQs.length === 0) return;
    startQuiz(bookmarkedQs);
  };

  const resumeQuiz = () => {
    const saved = ls.get(LS.PROGRESS);
    if (!saved) return;
    cardRefs.current = [];
    setPool(saved.pool);
    setAnsweredMap(saved.answeredMap);
    setPhase("quiz");
    setTimeout(() => window.scrollTo({ top:0, behavior:"smooth" }), 50);
  };

  const goHome = () => {
    setSavedWrongs(ls.get(LS.WRONGS, []));
    setHasSavedProgress(!!ls.get(LS.PROGRESS));
    setPhase("start");
    setTimeout(() => window.scrollTo({ top:0, behavior:"smooth" }), 50);
  };

  const handleAnswer = useCallback((qId, optIndex) => {
    setAnsweredMap(prev => {
      if (prev[qId] !== undefined) return prev;
      const next = { ...prev, [qId]: { myAnswer: optIndex } };
      const q = pool.find(x => x.id === qId);
      if (!q) return next;
      const currentWrongs = ls.get(LS.WRONGS, []);
      if (optIndex !== q.a) {
        const exists = currentWrongs.find(w => w.id === qId);
        const newWrongs = exists
          ? currentWrongs.map(w => w.id === qId ? { ...q, myAnswer: optIndex } : w)
          : [...currentWrongs, { ...q, myAnswer: optIndex }];
        ls.set(LS.WRONGS, newWrongs);
        setSavedWrongs(newWrongs);
      } else {
        const newWrongs = currentWrongs.filter(w => w.id !== qId);
        ls.set(LS.WRONGS, newWrongs);
        setSavedWrongs(newWrongs);
      }
      return next;
    });
  }, [pool]);

  const handleBookmark = useCallback((qId) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      ls.set(LS.BOOKMARKS, Array.from(next));
      return next;
    });
  }, []);

  // 네비게이션 바 클릭 → 해당 카드로 스크롤
  const scrollToCard = (i) => {
    const el = cardRefs.current[i];
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  const answeredCount = Object.keys(answeredMap).length;
  const correctCount  = pool.filter(q => answeredMap[q.id]?.myAnswer === q.a).length;
  const wrongItems    = pool.filter(q => answeredMap[q.id] !== undefined && answeredMap[q.id].myAnswer !== q.a);
  const pct = pool.length ? Math.round((answeredCount / pool.length) * 100) : 0;
  const allDone = pool.length > 0 && answeredCount === pool.length;

  const finishQuiz = () => {
    // 히스토리 저장
    const rate = Math.round((correctCount / pool.length) * 100);
    const record = {
      date: new Date().toLocaleDateString("ko-KR"),
      total: pool.length,
      correct: correctCount,
      rate,
      category: selectedCat,
    };
    const newHistory = [record, ...history].slice(0, 20);
    ls.set(LS.HISTORY, newHistory);
    setHistory(newHistory);
    ls.del(LS.PROGRESS);
    setHasSavedProgress(false);
    setPhase("result");
    setTimeout(() => window.scrollTo({ top:0, behavior:"smooth" }), 50);
  };

  const navDotState = (q, i) => {
    if (bookmarks.has(q.id) && !answeredMap[q.id]) return "bookmarked";
    if (!answeredMap[q.id]) return "unanswered";
    return answeredMap[q.id].myAnswer === q.a ? "correct" : "wrong";
  };

  /* ══ 시작 화면 ══ */
  if (phase === "start") return (
    <div style={S.wrap}>
      <div style={S.startWrap}>
        {/* 메인 카드 */}
        <div style={S.startCard}>
          <div style={S.startIcon}>🐧</div>
          <h2 style={S.startTitle}>리눅스 마스터 2급 CBT</h2>
          <p style={S.startSub}>총 <strong>{questions.length}개</strong> 문제 · 해설 100%</p>

          <p style={S.sectionTitle}>📂 카테고리 선택</p>
          <div style={S.catGrid}>
            {CATEGORIES.map(cat => (
              <button key={cat} style={S.catBtn(selectedCat === cat)} onClick={() => setSelectedCat(cat)}>
                {cat}
                <span style={{ color:C.gray, fontWeight:400, marginLeft:4 }}>
                  ({cat === "전체" ? questions.length : questions.filter(q => q.category === cat).length})
                </span>
              </button>
            ))}
          </div>

          <p style={S.sectionTitle}>⚙️ 옵션</p>
          <label style={S.optLabel(doShuffle)}>
            <input type="checkbox" checked={doShuffle} onChange={e => setDoShuffle(e.target.checked)}
              style={{ width:16, height:16, accentColor:C.blue }} />
            🔀 문제 랜덤 셔플
          </label>

          <div style={{ height:20 }} />
          <button style={S.bigBtn("blue")} onClick={() => startQuiz()}>시험 시작 →</button>

          {savedWrongs.length > 0 && (
            <button style={{ ...S.bigBtn("red"), background:`linear-gradient(135deg,#dc2626,${C.red})` }}
              onClick={() => startQuiz(savedWrongs)}>
              ❌ 오답만 풀기 ({savedWrongs.length}개)
            </button>
          )}

          {bookmarks.size > 0 && (
            <button style={{ ...S.resumeBtn, borderColor:C.yellow, color:C.yellow }}
              onClick={startBookmarkQuiz}>
              ★ 북마크 풀기 ({bookmarks.size}개)
            </button>
          )}

          {hasSavedProgress && (
            <button style={S.resumeBtn} onClick={resumeQuiz}>📖 이어서 풀기</button>
          )}
        </div>

        {/* 풀이 히스토리 */}
        {history.length > 0 && (
          <div style={S.statsCard}>
            <p style={S.statsTitle}>📊 풀이 히스토리</p>
            {history.slice(0, 7).map((h, i) => (
              <div key={i} style={S.historyRow}>
                <span style={{ color:C.gray, minWidth:80 }}>{h.date}</span>
                <span style={{ color:"#334155", flex:1 }}>{h.category} · {h.total}문제</span>
                <span style={{ fontWeight:700, color: h.rate >= 60 ? C.green : C.red }}>
                  {h.rate}% ({h.correct}/{h.total})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ══ 결과 화면 ══ */
  if (phase === "result") {
    const total = pool.length;
    const rate  = Math.round((correctCount / total) * 100);
    const pass  = rate >= 60;
    return (
      <div style={S.wrap}>
        <div style={S.header}>
          <div style={S.headerInner}>
            <button style={S.backBtn} onClick={goHome}>← 홈으로</button>
            <span style={S.headerTitle}>🐧 리눅스 마스터 CBT</span>
            <span style={S.scoreBadge}>시험 완료</span>
          </div>
        </div>
        <div style={S.resultWrap}>
          <div style={S.resultCard}>
            <h2 style={{ textAlign:"center", fontSize:22, fontWeight:800, color:"#1e293b", marginBottom:4 }}>
              {pass ? "🎉 합격권!" : "📚 더 공부해봐요"}
            </h2>
            <p style={{ textAlign:"center", fontSize:13, color:C.gray, marginBottom:24 }}>총 {total}문제 응시 완료</p>
            <div style={S.statGrid}>
              <div style={S.statItem(C.blue)}><div style={S.statNum(C.blue)}>{rate}%</div><div style={S.statLabel}>정답률</div></div>
              <div style={S.statItem(C.green)}><div style={S.statNum(C.green)}>{correctCount}</div><div style={S.statLabel}>정답</div></div>
              <div style={S.statItem(C.red)}><div style={S.statNum(C.red)}>{wrongItems.length}</div><div style={S.statLabel}>오답</div></div>
            </div>
            <div style={{ background:"#f1f5f9", borderRadius:8, height:8, overflow:"hidden", marginBottom:20 }}>
              <div style={{ height:"100%", width:`${rate}%`, borderRadius:8, background:pass?"linear-gradient(90deg,#22c55e,#4ade80)":"linear-gradient(90deg,#f43f5e,#fb7185)" }} />
            </div>
            <div style={S.actionRow}>
              <button style={S.actionBtn(true,false)} onClick={() => startQuiz()}>🔄 다시 풀기</button>
              {wrongItems.length > 0 && (
                <button style={S.actionBtn(true,true)} onClick={() => startQuiz(wrongItems)}>
                  ❌ 오답만 ({wrongItems.length}개)
                </button>
              )}
              <button style={S.actionBtn(false)} onClick={goHome}>🏠 홈으로</button>
            </div>
          </div>
          {wrongItems.length > 0 && (
            <div style={S.wrongList}>
              <p style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:12 }}>❌ 오답 목록 ({wrongItems.length}개)</p>
              {wrongItems.map((w, i) => (
                <div key={i} style={{ borderBottom:i<wrongItems.length-1?"1px solid #f1f5f9":"none", paddingBottom:10, marginBottom:10 }}>
                  <p style={{ fontSize:13, color:"#334155", lineHeight:1.6, marginBottom:4 }}><strong>Q{i+1}.</strong> {w.q}</p>
                  <p style={{ fontSize:12, color:C.gray }}>
                    내 답: <span style={{ color:C.red, fontWeight:600 }}>{w.options[answeredMap[w.id]?.myAnswer]}</span>
                    {"  →  "}
                    정답: <span style={{ color:C.green, fontWeight:600 }}>{w.options[w.a]}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══ 퀴즈 화면 ══ */
  return (
    <div style={S.wrap}>
      {/* 헤더 */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <button style={S.backBtn} onClick={goHome}>← 홈으로</button>
          <span style={S.headerTitle}>🐧 리눅스 마스터 CBT</span>
          <span style={S.scoreBadge}>✅ {correctCount}/{answeredCount}</span>
        </div>
        <div style={S.progressBar}><div style={S.progressFill(pct)} /></div>
      </div>

      {/* 문제 번호 네비게이션 바 */}
      <div style={S.navBar}>
        <div style={S.navBarInner}>
          {pool.map((q, i) => (
            <button
              key={q.id}
              style={S.navDot(navDotState(q, i))}
              onClick={() => scrollToCard(i)}
              title={`문제 ${i+1}${bookmarks.has(q.id)?" ★":""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={S.listWrap}>
        <div style={S.topBar}>
          <span style={{ fontSize:12, color:C.gray, fontWeight:600 }}>
            {answeredCount} / {pool.length} 문제 풀었어요
          </span>
          {allDone && (
            <button onClick={finishQuiz} style={{ ...S.finishBtn, fontSize:13, padding:"9px 22px" }}>
              결과 보기 🏁
            </button>
          )}
        </div>

        {pool.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            qIndex={i}
            total={pool.length}
            onAnswer={handleAnswer}
            answered={answeredMap[q.id]}
            bookmarks={bookmarks}
            onBookmark={handleBookmark}
            cardRef={el => { cardRefs.current[i] = el; }}
          />
        ))}

        {allDone && (
          <div style={{ textAlign:"center", padding:"14px 0 20px" }}>
            <button onClick={finishQuiz} style={S.finishBtn}>결과 보기 🏁</button>
          </div>
        )}
      </div>
    </div>
  );
}
