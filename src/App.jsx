import { useState, useEffect, useRef } from "react";

const DEFAULT_PLAYERS = [
  "Agnès", "Aline", "Anne", "Anne-France", "Camille L.",
  "Camille N.", "Camille P.", "Caroline", "Denise", "Elisabeth",
  "Emilie", "Florence", "Hélène", "Justine", "Laurence",
  "Manon", "Marie", "Ornella", "Pénélope", "Sophie D.",
  "Sophie J.", "Stéphanie", "Virginie", "Xavier"
];

const VOTES_KEY = "ascalon-votes-v2";
const HISTORY_KEY = "ascalon-history-v2";
const PLAYERS_KEY = "ascalon-players-v2";
const VOTED_KEY = "ascalon-has-voted";
const ADMIN_CODE = "1234";

const colors = {
  bg: "#0d1117", card: "#161b22", border: "#21262d",
  gold: "#f0c040", funny: "#e05a8a", text: "#e6edf3", muted: "#7d8590",
};

function sget(key, fallback = null) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function sset(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function tally(votes, category) {
  const counts = {};
  votes.forEach(v => { if (v[category]) counts[v[category]] = (counts[v[category]] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}
function topPlayer(votes, category) {
  const t = tally(votes, category); return t.length > 0 ? t[0][0] : null;
}
function getMessages(votes, category) {
  return votes.filter(v => v[`${category}Msg`]).map(v => ({ player: v[category], msg: v[`${category}Msg`] }));
}

const S = {
  app: { minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "'Georgia', serif", maxWidth: 480, margin: "0 auto", paddingBottom: 40 },
  header: { background: "linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)", borderBottom: `1px solid ${colors.border}`, padding: "24px 20px 20px", textAlign: "center" },
  badge: { display: "inline-block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.muted, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "bold", color: colors.text, margin: 0, lineHeight: 1.3 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 6 },
  body: { padding: "24px 20px" },
  section: { marginBottom: 28 },
  label: (c) => ({ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: c || colors.muted, marginBottom: 12, display: "block" }),
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  playerBtn: (sel, type) => ({
    padding: "10px 8px", borderRadius: 8,
    border: `1.5px solid ${sel ? (type === "sylver" ? colors.gold : colors.funny) : colors.border}`,
    background: sel ? (type === "sylver" ? "rgba(240,192,64,0.12)" : "rgba(224,90,138,0.12)") : colors.card,
    color: sel ? (type === "sylver" ? colors.gold : colors.funny) : colors.text,
    fontSize: 13, cursor: "pointer", textAlign: "center", transition: "all 0.15s",
    fontFamily: "inherit", fontWeight: sel ? "bold" : "normal",
  }),
  textarea: { width: "100%", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "none", marginTop: 8, boxSizing: "border-box", outline: "none" },
  btnPrimary: (disabled) => ({ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: disabled ? colors.border : `linear-gradient(135deg, ${colors.gold}, #d4a017)`, color: disabled ? colors.muted : "#0d1117", fontSize: 15, fontWeight: "bold", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: 0.5 }),
  btnSecondary: { width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 10 },
  divider: { height: 1, background: colors.border, margin: "20px 0" },
  warningBox: { background: "rgba(240,192,64,0.08)", border: `1px solid rgba(240,192,64,0.3)`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: colors.muted, marginBottom: 20 },
  resultRow: (i, type) => ({ display: "flex", alignItems: "center", padding: "10px 14px", background: i === 0 ? (type === "sylver" ? "rgba(240,192,64,0.08)" : "rgba(224,90,138,0.08)") : colors.card, border: `1px solid ${i === 0 ? (type === "sylver" ? "rgba(240,192,64,0.3)" : "rgba(224,90,138,0.3)") : colors.border}`, borderRadius: 8, marginBottom: 6 }),
  msgCard: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6, fontSize: 13 },
  input: { width: "100%", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
};

function Confetti({ active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 100,
      r: 4 + Math.random() * 6, d: 2 + Math.random() * 3,
      color: ["#f0c040", "#e05a8a", "#fff", "#388bfd", "#50fa7b"][Math.floor(Math.random() * 5)],
      tiltSpeed: 0.1 + Math.random() * 0.2, angle: 0,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.angle += p.tiltSpeed; p.y += p.d; p.x += Math.sin(p.angle) * 1.5;
        const tilt = Math.sin(p.angle) * 12;
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + tilt, p.y + tilt + p.r / 2);
        ctx.stroke();
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [votes, setVotes] = useState(() => sget(VOTES_KEY, []));
  const [players, setPlayers] = useState(() => sget(PLAYERS_KEY, DEFAULT_PLAYERS));
  const [history, setHistory] = useState(() => sget(HISTORY_KEY, []));
  const [hasVoted, setHasVoted] = useState(() => sget(VOTED_KEY, false));
  const [sylver, setSylver] = useState(null);
  const [funny, setFunny] = useState(null);
  const [sylverMsg, setSylverMsg] = useState("");
  const [funnyMsg, setFunnyMsg] = useState("");
  const [revealStep, setRevealStep] = useState(0);
  const [revealFunny, setRevealFunny] = useState(false);
  const [revealSylver, setRevealSylver] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [adminCodeError, setAdminCodeError] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [matchLabel, setMatchLabel] = useState("");

  const submitVote = () => {
    const updated = [...votes, { sylver, funny, sylverMsg: sylverMsg.trim(), funnyMsg: funnyMsg.trim(), ts: Date.now() }];
    sset(VOTES_KEY, updated); setVotes(updated);
    sset(VOTED_KEY, true); setHasVoted(true);
    setScreen("confirm");
  };

  const savePlayers = (list) => {
    const sorted = [...list].sort((a, b) => a.localeCompare(b, "fr"));
    setPlayers(sorted); sset(PLAYERS_KEY, sorted);
  };

  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (!name || players.includes(name)) return;
    savePlayers([...players, name]); setNewPlayerName("");
  };

  const removePlayer = (name) => savePlayers(players.filter(p => p !== name));

  const archiveMatch = () => {
    const label = matchLabel.trim() || `Match du ${new Date().toLocaleDateString("fr-BE")}`;
    const entry = {
      label, date: new Date().toISOString(),
      sylver: topPlayer(votes, "sylver"), funny: topPlayer(votes, "funny"),
      sylverMsgs: getMessages(votes, "sylver"), funnyMsgs: getMessages(votes, "funny"),
      totalVotes: votes.length,
    };
    const updated = [entry, ...history];
    sset(HISTORY_KEY, updated); setHistory(updated);
    sset(VOTES_KEY, []); setVotes([]);
    sset(VOTED_KEY, false); setHasVoted(false);
    setMatchLabel(""); setAdminUnlocked(false); setScreen("home");
  };

  const resetVotes = () => {
    sset(VOTES_KEY, []); setVotes([]);
    sset(VOTED_KEY, false); setHasVoted(false);
  };

  const tryAdminCode = () => {
    if (adminCodeInput === ADMIN_CODE) {
      setAdminUnlocked(true); setAdminCodeInput(""); setAdminCodeError(false); setScreen("results");
    } else { setAdminCodeError(true); }
  };

  const canSubmit = sylver && funny;

  // HOME
  if (screen === "home") return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.badge}>🏑 Ascalon D-2</span>
        <h1 style={S.title}>Vote du match</h1>
        <p style={S.subtitle}>{votes.length} vote{votes.length !== 1 ? "s" : ""} enregistré{votes.length !== 1 ? "s" : ""}</p>
      </div>
      <div style={S.body}>
        <div style={{ textAlign: "center", padding: "20px 0 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🏆😂</div>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: colors.text, margin: "0 0 6px" }}>Élisez les lauréates du match</p>
          <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Vote anonyme · Un vote par téléphone</p>
        </div>
        <div style={{ background: colors.card, borderRadius: 12, padding: "16px", marginBottom: 20, border: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 26 }}>🏆</span>
            <div><div style={{ fontWeight: "bold", color: colors.gold }}>Sylver</div><div style={{ fontSize: 12, color: colors.muted }}>La meilleure joueuse du match</div></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 26 }}>😂</span>
            <div><div style={{ fontWeight: "bold", color: colors.funny }}>Funny</div><div style={{ fontSize: 12, color: colors.muted }}>La plus drôle du match</div></div>
          </div>
        </div>
        {hasVoted
          ? <div style={{ ...S.warningBox, textAlign: "center", fontSize: 14 }}>✅ Vous avez déjà voté pour ce match !</div>
          : <button style={S.btnPrimary(false)} onClick={() => setScreen("vote")}>Voter maintenant →</button>
        }
        <button style={S.btnSecondary} onClick={() => setScreen("results")}>Voir les résultats</button>
        <button style={{ ...S.btnSecondary, marginTop: 6 }} onClick={() => setScreen("history")}>📋 Historique des matchs</button>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={() => setScreen("adminLogin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, opacity: 0.25 }}>🔐</button>
        </div>
      </div>
    </div>
  );

  // VOTE
  if (screen === "vote") return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.badge}>🏑 Vote du match</span>
        <h1 style={S.title}>Choisissez vos lauréates</h1>
      </div>
      <div style={S.body}>
        <div style={S.warningBox}>🔒 Vote anonyme — personne ne saura qui vous avez choisi.</div>
        <div style={S.section}>
          <span style={S.label(colors.gold)}>🏆 Sylver — Meilleure joueuse</span>
          <div style={S.grid}>
            {players.map(p => <button key={p} style={S.playerBtn(sylver === p, "sylver")} onClick={() => setSylver(sylver === p ? null : p)}>{p}</button>)}
          </div>
          {sylver && <textarea style={S.textarea} rows={2} placeholder={`Un mot pour ${sylver} ? (optionnel)`} value={sylverMsg} onChange={e => setSylverMsg(e.target.value)} maxLength={140} />}
        </div>
        <div style={S.divider} />
        <div style={S.section}>
          <span style={S.label(colors.funny)}>😂 Funny — La plus drôle</span>
          <div style={S.grid}>
            {players.map(p => <button key={p} style={S.playerBtn(funny === p, "funny")} onClick={() => setFunny(funny === p ? null : p)}>{p}</button>)}
          </div>
          {funny && <textarea style={S.textarea} rows={2} placeholder={`Un mot pour ${funny} ? (optionnel)`} value={funnyMsg} onChange={e => setFunnyMsg(e.target.value)} maxLength={140} />}
        </div>
        <button style={S.btnPrimary(!canSubmit)} onClick={canSubmit ? submitVote : undefined}>
          Confirmer mon vote ✓
        </button>
        <button style={S.btnSecondary} onClick={() => setScreen("home")}>← Retour</button>
      </div>
    </div>
  );

  // CONFIRM
  if (screen === "confirm") return (
    <div style={S.app}>
      <div style={{ ...S.header, paddingBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
        <h1 style={S.title}>Vote enregistré !</h1>
        <p style={S.subtitle}>Merci pour votre participation</p>
      </div>
      <div style={S.body}>
        <div style={{ background: colors.card, borderRadius: 12, padding: "16px", border: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 1 }}>Sylver</div>
              <div style={{ color: colors.gold, fontWeight: "bold" }}>{sylver}</div>
              {sylverMsg && <div style={{ fontSize: 12, color: colors.muted, marginTop: 3, fontStyle: "italic" }}>"{sylverMsg}"</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 20 }}>😂</span>
            <div>
              <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 1 }}>Funny</div>
              <div style={{ color: colors.funny, fontWeight: "bold" }}>{funny}</div>
              {funnyMsg && <div style={{ fontSize: 12, color: colors.muted, marginTop: 3, fontStyle: "italic" }}>"{funnyMsg}"</div>}
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: colors.muted, marginBottom: 20 }}>Les résultats seront révélés en fin de match.</p>
        <button style={S.btnPrimary(false)} onClick={() => { setSylver(null); setFunny(null); setSylverMsg(""); setFunnyMsg(""); setScreen("home"); }}>← Accueil</button>
      </div>
    </div>
  );

  // ADMIN LOGIN
  if (screen === "adminLogin") return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.badge}>🔐 Accès coach</span>
        <h1 style={S.title}>Code admin</h1>
      </div>
      <div style={S.body}>
        <p style={{ color: colors.muted, fontSize: 14, marginBottom: 20, textAlign: "center" }}>Entrez le code pour accéder aux options d'administration.</p>
        <input type="password" inputMode="numeric" maxLength={6}
          style={{ ...S.input, textAlign: "center", fontSize: 22, letterSpacing: 8, marginBottom: 12 }}
          value={adminCodeInput} onChange={e => { setAdminCodeInput(e.target.value); setAdminCodeError(false); }}
          placeholder="••••" />
        {adminCodeError && <p style={{ color: "#f85149", fontSize: 13, textAlign: "center", margin: "0 0 12px" }}>Code incorrect.</p>}
        <button style={S.btnPrimary(!adminCodeInput)} onClick={tryAdminCode}>Valider</button>
        <button style={S.btnSecondary} onClick={() => { setAdminCodeInput(""); setAdminCodeError(false); setScreen("home"); }}>← Retour</button>
      </div>
    </div>
  );

  // RESULTS
  if (screen === "results") {
    const sylverTally = tally(votes, "sylver");
    const funnyTally = tally(votes, "funny");
    const sylverMsgs = getMessages(votes, "sylver");
    const funnyMsgs = getMessages(votes, "funny");
    const winner = { sylver: topPlayer(votes, "sylver"), funny: topPlayer(votes, "funny") };
    return (
      <div style={S.app}>
        <div style={S.header}>
          <span style={S.badge}>🏑 Résultats</span>
          <h1 style={S.title}>Palmarès du match</h1>
          <p style={S.subtitle}>{votes.length} vote{votes.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={S.body}>
          {votes.length > 0 && winner.sylver && winner.funny && (
            <button style={{ ...S.btnPrimary(false), background: "linear-gradient(135deg, #e05a8a, #f0c040)", marginBottom: 20 }}
              onClick={() => { setRevealStep(0); setRevealFunny(false); setRevealSylver(false); setScreen("reveal"); }}>
              🎉 Révéler les lauréates !
            </button>
          )}
          <div style={S.section}>
            <span style={S.label(colors.gold)}>🏆 Sylver — Meilleure joueuse</span>
            {sylverTally.length === 0 ? <p style={{ color: colors.muted, fontSize: 13 }}>Aucun vote pour l'instant.</p>
              : sylverTally.map(([name, count], i) => (
                <div key={name} style={S.resultRow(i, "sylver")}>
                  <span style={{ flex: 1, fontWeight: i === 0 ? "bold" : "normal", color: i === 0 ? colors.gold : colors.text }}>{name}</span>
                  <span style={{ color: colors.gold, fontWeight: "bold" }}>{count} ★</span>
                </div>
              ))}
            {sylverMsgs.length > 0 && <><span style={{ ...S.label(), marginTop: 16 }}>💬 Messages</span>
              {sylverMsgs.map((m, i) => <div key={i} style={S.msgCard}><span style={{ color: colors.gold, fontSize: 11, fontWeight: "bold" }}>{m.player}</span><p style={{ margin: "4px 0 0", color: colors.muted, fontStyle: "italic" }}>"{m.msg}"</p></div>)}</>}
          </div>
          <div style={S.divider} />
          <div style={S.section}>
            <span style={S.label(colors.funny)}>😂 Funny — La plus drôle</span>
            {funnyTally.length === 0 ? <p style={{ color: colors.muted, fontSize: 13 }}>Aucun vote pour l'instant.</p>
              : funnyTally.map(([name, count], i) => (
                <div key={name} style={S.resultRow(i, "funny")}>
                  <span style={{ flex: 1, fontWeight: i === 0 ? "bold" : "normal", color: i === 0 ? colors.funny : colors.text }}>{name}</span>
                  <span style={{ color: colors.funny, fontWeight: "bold" }}>{count} ★</span>
                </div>
              ))}
            {funnyMsgs.length > 0 && <><span style={{ ...S.label(), marginTop: 16 }}>💬 Messages</span>
              {funnyMsgs.map((m, i) => <div key={i} style={S.msgCard}><span style={{ color: colors.funny, fontSize: 11, fontWeight: "bold" }}>{m.player}</span><p style={{ margin: "4px 0 0", color: colors.muted, fontStyle: "italic" }}>"{m.msg}"</p></div>)}</>}
          </div>
          {adminUnlocked && <>
            <div style={S.divider} />
            <p style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginBottom: 12 }}>⚙️ Zone admin</p>
            <input style={{ ...S.input, marginBottom: 10 }} placeholder="Nom du match (ex: Ascalon vs Liège)" value={matchLabel} onChange={e => setMatchLabel(e.target.value)} />
            <button style={{ ...S.btnPrimary(false), background: "linear-gradient(135deg, #388bfd, #1a6fd4)" }} onClick={archiveMatch}>📦 Archiver ce match et reset les votes</button>
            <button style={{ ...S.btnSecondary, borderColor: "#f85149", color: "#f85149", marginTop: 8 }} onClick={resetVotes}>🗑 Reset les votes uniquement</button>
            <button style={{ ...S.btnSecondary, marginTop: 8 }} onClick={() => setScreen("managePlayers")}>👥 Gérer la liste des joueuses</button>
          </>}
          <button style={{ ...S.btnSecondary, marginTop: 20 }} onClick={() => setScreen("home")}>← Accueil</button>
        </div>
      </div>
    );
  }

  // REVEAL
  if (screen === "reveal") {
    const winFunny = topPlayer(votes, "funny");
    const winSylver = topPlayer(votes, "sylver");
    const funnyMsgsWinner = getMessages(votes, "funny").filter(m => m.player === winFunny);
    const sylverMsgsWinner = getMessages(votes, "sylver").filter(m => m.player === winSylver);
    return (
      <div style={{ ...S.app, position: "relative", overflow: "hidden" }}>
        <Confetti active={revealFunny || revealSylver} />
        {revealStep === 0 && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎭</div>
            <h1 style={{ fontSize: 28, color: colors.text, margin: "0 0 12px" }}>C'est l'heure de la révélation !</h1>
            <p style={{ color: colors.muted, marginBottom: 40 }}>Préparez-vous, les lauréates vont être dévoilées…</p>
            <button style={{ ...S.btnPrimary(false), background: `linear-gradient(135deg, ${colors.funny}, #c0416e)` }}
              onClick={() => { setRevealStep(1); setTimeout(() => setRevealFunny(true), 300); }}>
              😂 Révéler la Funny →
            </button>
          </div>
        )}
        {revealStep === 1 && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.funny, marginBottom: 16 }}>😂 Funny — La plus drôle</p>
            <div style={{ fontSize: 52, fontWeight: "bold", color: colors.funny, opacity: revealFunny ? 1 : 0, transform: revealFunny ? "scale(1)" : "scale(0.5)", transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)", marginBottom: 20 }}>{winFunny}</div>
            {revealFunny && funnyMsgsWinner.length > 0 && <div style={{ marginBottom: 24, maxWidth: 320 }}>{funnyMsgsWinner.map((m, i) => <div key={i} style={{ ...S.msgCard, textAlign: "left", marginBottom: 8 }}><p style={{ margin: 0, color: colors.muted, fontStyle: "italic" }}>"{m.msg}"</p></div>)}</div>}
            {revealFunny && <button style={{ ...S.btnPrimary(false), background: `linear-gradient(135deg, ${colors.gold}, #d4a017)`, marginTop: 8 }}
              onClick={() => { setRevealStep(2); setTimeout(() => setRevealSylver(true), 300); }}>🏆 Révéler la Sylver →</button>}
          </div>
        )}
        {revealStep === 2 && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.gold, marginBottom: 16 }}>🏆 Sylver — Meilleure joueuse</p>
            <div style={{ fontSize: 52, fontWeight: "bold", color: colors.gold, opacity: revealSylver ? 1 : 0, transform: revealSylver ? "scale(1)" : "scale(0.5)", transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)", marginBottom: 20 }}>{winSylver}</div>
            {revealSylver && sylverMsgsWinner.length > 0 && <div style={{ marginBottom: 24, maxWidth: 320 }}>{sylverMsgsWinner.map((m, i) => <div key={i} style={{ ...S.msgCard, textAlign: "left", marginBottom: 8 }}><p style={{ margin: 0, color: colors.muted, fontStyle: "italic" }}>"{m.msg}"</p></div>)}</div>}
            {revealSylver && <button style={S.btnSecondary} onClick={() => setScreen("results")}>Voir les résultats complets →</button>}
          </div>
        )}
      </div>
    );
  }

  // MANAGE PLAYERS
  if (screen === "managePlayers") return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.badge}>👥 Joueuses</span>
        <h1 style={S.title}>Gérer la liste</h1>
        <p style={S.subtitle}>{players.length} joueuses</p>
      </div>
      <div style={S.body}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input style={{ ...S.input, flex: 1 }} placeholder="Ajouter un prénom…" value={newPlayerName}
            onChange={e => setNewPlayerName(e.target.value)} onKeyDown={e => e.key === "Enter" && addPlayer()} />
          <button style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: colors.gold, color: "#0d1117", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" }} onClick={addPlayer}>+</button>
        </div>
        {players.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", padding: "10px 14px", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, marginBottom: 6 }}>
            <span style={{ flex: 1, fontSize: 14 }}>{p}</span>
            <button style={{ background: "none", border: "none", color: "#f85149", cursor: "pointer", fontSize: 18, padding: "0 4px" }} onClick={() => removePlayer(p)}>×</button>
          </div>
        ))}
        <button style={{ ...S.btnSecondary, marginTop: 16 }} onClick={() => setScreen("results")}>← Retour</button>
      </div>
    </div>
  );

  // HISTORY
  if (screen === "history") return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.badge}>📋 Historique</span>
        <h1 style={S.title}>Palmarès passés</h1>
        <p style={S.subtitle}>{history.length} match{history.length !== 1 ? "s" : ""} archivé{history.length !== 1 ? "s" : ""}</p>
      </div>
      <div style={S.body}>
        {history.length === 0 && <p style={{ color: colors.muted, textAlign: "center", fontSize: 14 }}>Aucun match archivé pour l'instant.</p>}
        {history.map((entry, i) => (
          <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "16px", marginBottom: 12 }}>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>{entry.label}</div>
            <div style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>{new Date(entry.date).toLocaleDateString("fr-BE")} · {entry.totalVotes} votes</div>
            <div style={{ display: "flex", gap: 24 }}>
              <div><div style={{ fontSize: 11, color: colors.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>🏆 Sylver</div><div style={{ fontWeight: "bold", color: colors.gold }}>{entry.sylver || "—"}</div></div>
              <div><div style={{ fontSize: 11, color: colors.funny, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>😂 Funny</div><div style={{ fontWeight: "bold", color: colors.funny }}>{entry.funny || "—"}</div></div>
            </div>
          </div>
        ))}
        <button style={S.btnSecondary} onClick={() => setScreen("home")}>← Accueil</button>
      </div>
    </div>
  );
}
