"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEMO_BRIEF, DEMO_FEEDBACK } from "../lib/content-agent/demo";
import { createPresentationFrame, diffDraft, draftPages, draftSpotlightAt, nextPresentationTime, PRESENTATION_DURATION, PRESENTATION_STAGES, presentationStageAt, scriptedReviewAt } from "../lib/content-agent/presentation";
import "./studio-presentation.css";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function StudioPresentation({ onClose }: { onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0), [playing, setPlaying] = useState(true);
  const elapsedRef = useRef(0), dialog = useRef<HTMLDivElement>(null);
  const stageIndex = presentationStageAt(elapsed), stage = PRESENTATION_STAGES[stageIndex];
  const loop = useMemo(() => createPresentationFrame(stageIndex), [stageIndex]);
  const scriptTime = elapsed >= 167 ? 167 : elapsed >= 161 ? 161 : elapsed >= 155 ? 155 : 0;
  const review = useMemo(() => scriptedReviewAt(scriptTime), [scriptTime]);
  const cycle = loop?.currentCycle ?? 0, done = elapsed >= PRESENTATION_DURATION;
  const feedback = stageIndex === 3 ? DEMO_FEEDBACK[0] : stageIndex === 5 ? DEMO_FEEDBACK[1] : null;
  const applied = stageIndex === 4 ? DEMO_FEEDBACK[0] : stageIndex === 6 ? DEMO_FEEDBACK[1] : null;
  const draftStage = [2, 4, 6].includes(stageIndex);
  const posts = loop?.history.at(-1)?.posts ?? [], previous = loop?.history.at(-2)?.posts;
  const spotlight = draftStage ? draftSpotlightAt(elapsed, stageIndex) : null;

  function seek(seconds: number) { elapsedRef.current = seconds; setElapsed(seconds); }
  function replay() { seek(0); setPlaying(true); }
  function next() { if (!done) seek(PRESENTATION_STAGES[Math.min(stageIndex + 1, 9)].at); }
  useEffect(() => {
    if (!playing || done) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(), value = nextPresentationTime(elapsedRef.current, (now - last) / 1000);
      last = now; elapsedRef.current = value; setElapsed(value);
      if (value === PRESENTATION_DURATION) setPlaying(false);
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, done]);
  useEffect(() => {
    const focus = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { document.body.style.overflow = overflow; requestAnimationFrame(() => focus?.focus()); };
  }, []);
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.visibilityState === "hidden") setPlaying(false); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);
  function keyboard(event: React.KeyboardEvent) {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key !== "Tab") return;
    const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []).filter(button => button.getClientRects().length > 0);
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
  }

  return <div className="studio present-theater" role="dialog" aria-modal="true" aria-labelledby="presentation-title" onKeyDown={keyboard} ref={dialog} data-presentation-stage={stage.scene} data-playing={playing && !done} data-review-phase={review.phase} data-approved-variation={review.approval?.id ?? "none"} data-published="false">
    <div className="present-ambient" aria-hidden="true"><span /><span /><span /></div>
    <div className="present-shell">
      <header className="present-header"><div className="present-brand"><Mark /><span>GrowthLoop <b>AI</b><small>CONTENT STUDIO / MICHELLE SAINSBURY</small></span></div><span className="present-disclosure">SCRIPTED REVIEWER SIMULATION · ACTUAL CONTENT FUNCTIONS</span><button className="present-exit" onClick={onClose} aria-label="Exit presentation and return to campaign">Exit <Icon name="exit" /></button></header>
      <div className="present-title" key={stageIndex}><div><p>{stage.label}</p><h1 id="presentation-title">{stage.title}</h1></div><span className="present-chapter">{String(stageIndex + 1).padStart(2, "0")}<small>/ 10</small></span></div>
      <div className="present-workspace">
        <aside className={`present-loop-panel ${review.approval ? "is-approved" : ""}`} aria-label="Three-cycle feedback loop">
          <div className="present-panel-kicker"><span /> THE HUMAN-GUIDED CONTENT LOOP</div>
          <Orbit cycle={cycle} feedback={Boolean(feedback)} approved={Boolean(review.approval)} />
          <div className={`present-feedback-signal ${feedback ? "is-entering" : ""}`} key={stageIndex}><span>{review.approval ? "SCRIPTED APPROVAL · LOOP STOPPED" : feedback ? "SCRIPTED REVIEWER → CONTENT AGENT" : applied ? "FEEDBACK APPLIED TO BOTH DRAFTS" : cycle === 3 ? "THREE CYCLES REACHED" : "HYPOTHETICAL GRANTREADY CAMPAIGN"}</span><p>{review.approval ? "B approved. A remains unapproved." : feedback || applied ? `“${feedback || applied}”` : cycle === 3 ? "Review → Select B → Confirm" : "A clear brief. Two distinct perspectives."}</p></div>
          <div className="present-loop-boundary">3 cycles maximum · Nothing automatically published</div>
        </aside>
        <section className={`present-content present-content-${stage.scene}`} key={stage.scene} aria-label="Presentation content">
          <span className="present-scene-watermark" aria-hidden="true">{cycle ? `0${cycle}` : "GR"}</span>
          {stageIndex === 0 ? <div className="present-welcome" data-essential="opening"><span className="present-overline">HYPOTHETICAL NONPROFIT CAMPAIGN</span><h2>GrantReady<span>.</span><br /><em>From a brief<br />to better drafts.</em></h2><p>A conversation about grant readiness.<br />Created with code. Refined by human direction.</p><div className="present-story-pills"><span>2 perspectives</span><span>3 actual cycles</span><span>1 scripted decision</span></div><p className="present-small">A demonstration concept, not a functioning grant-finding product.</p></div>
          : stageIndex === 1 ? <div className="present-brief" data-essential="brief"><span className="present-overline">THE GRANTREADY BRIEF</span><h2>Purpose before prose.</h2><dl>{[["Audience", DEMO_BRIEF.audience], ["Campaign goal", DEMO_BRIEF.campaignGoal], ["Key message", DEMO_BRIEF.keyMessage], ["Reviewer-supplied demo claim", DEMO_BRIEF.approvedClaims[0]]].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><p className="present-small">Hypothetical inputs. No independent product-evidence or fact-verification claim.</p></div>
          : feedback ? <div className="present-review" data-essential="feedback"><span className="present-overline">SCRIPTED SIMULATION OF A HUMAN REVIEWER</span><div className="present-review-orb" aria-hidden="true"><Icon name="replay" /></div><h2>“{feedback}”</h2><p>Change the expression.<br /><strong>Keep the supplied claim.</strong></p><div className="present-feedback-flow"><span>Review</span><i aria-hidden="true">→</i><span>Direction</span><i aria-hidden="true">→</i><span>Revision</span></div></div>
          : stageIndex === 7 ? <div className="present-history" data-essential="history"><span className="present-overline">ACTUAL BROWSER-STATE REVISION HISTORY</span><h2>A visible trail of refinement.</h2><ol>{loop?.history.map(entry => <li key={entry.cycle}><span>0{entry.cycle}</span><div><h3>{entry.cycle === 1 ? "Generate" : entry.cycle === 2 ? "Make it shorter" : "Add detail. Ask a question."}</h3><p>{entry.feedback}</p></div><b>2 drafts</b></li>)}</ol><div className="present-history-stop">3 / 3 cycles. No fourth revision.<br /><strong>Approval is a separate, explicit step.</strong></div></div>
          : stageIndex === 8 ? <div className="present-gate" data-essential="approval"><span className="present-overline">SCRIPTED SIMULATION · NOT A LIVE HUMAN APPROVAL</span><h2>{review.phase === "review" ? "Review the final A/B pair." : review.phase === "select" ? "The scripted reviewer selects B." : review.phase === "confirm" ? "Simulated review confirmed." : "Variation B alone is approved."}</h2><div className="present-gate-options">{posts.map(post => <div key={post.id} className={`present-choice ${review.selectedId === post.id ? "is-selected" : ""} ${review.approval?.id === post.id ? "is-approved" : ""}`} data-variation={post.id} data-status={review.approval?.id === post.id ? "approved" : "unapproved"}><span className="present-choice-letter">{post.id}</span><div><h3>Variation {post.id}</h3><p>{post.id === "A" ? "Human-centered" : "Action-oriented"}</p></div><span className="present-choice-radio" aria-label={review.selectedId === post.id ? `Variation ${post.id} selected by scripted reviewer` : `Variation ${post.id} not selected`}>{review.selectedId === post.id ? "✓" : ""}</span><blockquote>{post.content.split("\n\n").at(-1)}</blockquote><strong>{review.approval?.id === post.id ? "APPROVED · SIMULATION" : post.id === "B" && review.selectedId === "B" ? "SELECTED · NOT YET APPROVED" : "NOT APPROVED"}</strong></div>)}</div><div className={`present-script-confirm ${review.reviewed ? "is-confirmed" : ""}`}><span aria-hidden="true">{review.reviewed ? "✓" : "□"}</span><div><strong>{review.reviewed ? "Scripted reviewer confirmed review of B" : "Scripted reviewer confirmation pending"}</strong><small>The real manual workflow still requires an explicit human approval.</small></div></div><p className="present-gate-result" role="status">{review.approval ? "B APPROVED · A UNAPPROVED · NOTHING PUBLISHED" : "The presentation advances automatically. No input needed."}</p></div>
          : stageIndex === 9 ? <div className="present-ending" data-essential="ending"><div className="present-success-seal" aria-hidden="true"><span>B</span><b>✓</b></div><span className="present-overline">GRANTREADY · SCRIPTED DEMONSTRATION COMPLETE</span><h2>Variation B approved.<br /><em>Nothing was published.</em></h2><div className="present-final-decisions"><span data-final-variation="A">A · Not approved</span><strong data-final-variation="B">B · Approved in simulation</strong></div><p>Three cycles. Two feedback directions.<br />One clearly simulated reviewer decision.</p><p className="present-small">Loop stopped · No Analytics Agent · No LinkedIn publishing</p></div>
          : <div className="present-drafts"><div className="present-drafts-heading"><span>ACTUAL COPY · CYCLE {cycle} OF 3</span><span>{previous ? "Mint = added / replaced language" : "Both drafts keep the supplied claim"}</span></div><div className="present-post-grid present-dual">{posts.map((post, i) => <Draft key={post.id} id={post.id} content={post.content} previous={previous?.[i].content} />)}</div><div className="present-spotlight">{spotlight && (() => {
            const post = posts.find(p => p.id === spotlight.id)!;
            return <><div className="present-reading-strip" data-essential="reading-progress"><span className={spotlight.id === "A" ? "is-active" : ""}>A · Human-centered</span><span className={spotlight.id === "B" ? "is-active" : ""}>B · Action-oriented</span><b>Panel {spotlight.page + 1} / 2</b></div><Draft key={`${cycle}-${spotlight.id}-${spotlight.page}`} id={post.id} content={post.content} previous={previous?.find(p => p.id === post.id)?.content} page={spotlight.page} /><p className="present-auto-reading">Full copy appears in automatic reading panels · No scrolling or clicks needed</p></>;
          })()}</div></div>}
        </section>
      </div>
      <footer className="present-footer"><div className="present-narration" aria-live="polite" aria-atomic="true"><span>{review.approval ? "SCRIPTED APPROVAL COMPLETE" : "THE STORY, AS IT HAPPENS"}</span><p>{stage.note}</p></div><div className="present-controls"><button onClick={() => { if (done) replay(); else setPlaying(!playing); }} aria-label={done ? "Play presentation again" : playing ? "Pause presentation" : "Play presentation"}><Icon name={playing && !done ? "pause" : "play"} />{playing && !done ? "Pause" : "Play"}</button><button onClick={replay} aria-label="Replay presentation"><Icon name="replay" />Replay</button><button className="present-next" onClick={next} disabled={done} aria-label="Next presentation stage">Next<Icon name="next" /></button><div className="present-progress" role="progressbar" aria-label="Presentation progress" aria-valuemin={0} aria-valuemax={PRESENTATION_DURATION} aria-valuenow={Math.floor(elapsed)}><span style={{ width: `${elapsed / PRESENTATION_DURATION * 100}%` }} /></div><time>{clock(elapsed)} / 3:00</time></div></footer>
    </div>
  </div>;
}

function Draft({ id, content, previous, page }: { id: "A" | "B"; content: string; previous?: string; page?: number }) {
  const difference = previous ? diffDraft(previous, content) : null;
  const tokens = difference?.tokens ?? [{ text: content, added: false }];
  const pages = draftPages(content), start = page === 1 ? pages[0].length + 2 : 0, end = page === undefined ? content.length : start + pages[page].length;
  let offset = 0;
  const visible: React.ReactNode[] = [];
  for (const [index, token] of tokens.entries()) {
    const begin = offset; offset += token.text.length;
    const text = token.text.slice(Math.max(0, start - begin), Math.min(token.text.length, end - begin));
    if (offset <= start || begin >= end || !text) continue;
    visible.push(token.added ? <mark key={index}>{text}</mark> : text);
  }
  return <article className="present-post" data-essential="draft" data-draft-id={id} data-draft-page={page ?? "full"}><header><span>{id}</span><div><h2>{id === "A" ? "Human-centered" : "Action-oriented"}</h2><small>GrantReady · LinkedIn-style draft</small></div><b>Not published</b></header><div className="present-paper"><p className="present-post-copy" data-essential="draft-text">{visible}</p></div><footer>{difference ? `${difference.added} words added · ${difference.removed} removed · Claim retained` : "Original generated text · Human review required"}</footer></article>;
}

function Orbit({ cycle, feedback, approved }: { cycle: number; feedback: boolean; approved: boolean }) {
  const label = approved ? "B APPROVED" : feedback ? "HUMAN DIRECTION" : cycle ? `CYCLE 0${cycle}` : "GRANTREADY";
  return <div className={`present-loop ${feedback ? "is-receiving" : ""} ${approved ? "is-approved" : ""}`} role="img" aria-label={`Three-cycle loop: ${cycle ? `cycle ${cycle} of 3` : "campaign brief"}. ${approved ? "B approved; loop stopped." : "Improve with Feedback."}`}>
    <svg className="present-orbit-wide" viewBox="0 0 440 430" aria-hidden="true"><defs><linearGradient id="present-orbit-grad"><stop stopColor="#dcffe8" /><stop offset="1" stopColor="#52c9a3" /></linearGradient><marker id="present-orbit-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="m0 0 5 3-5 3" fill="none" stroke="#c6ffe0" strokeWidth="1.5" /></marker></defs><circle cx="220" cy="215" r="151" className="present-orbit-aura" /><circle cx="220" cy="215" r="126" className="present-orbit-guide" /><path d="M140 94 Q220 47 300 94 M354 189 Q364 297 273 337 M167 337 Q75 301 86 189" className="present-orbit-track" markerEnd="url(#present-orbit-arrow)" /><path d="M140 94 Q220 47 300 94 M354 189 Q364 297 273 337 M167 337 Q75 301 86 189" className="present-orbit-motion" /><text x="220" y="184" textAnchor="middle" className="present-orbit-eyebrow">{label}</text><text x="220" y="236" textAnchor="middle" className="present-orbit-number">{approved ? "✓" : cycle ? `0${cycle} / 03` : "01 → 03"}</text><text x="220" y="266" textAnchor="middle" className="present-orbit-caption">{approved ? "The loop is complete" : "Improve with Feedback"}</text>{[{x:104,y:131,n:1,name:"GENERATE"},{x:336,y:131,n:2,name:"REVISE"},{x:220,y:354,n:3,name:"REFINE"}].map(({x,y,n,name}) => <g key={n} className={`present-orbit-node ${cycle === n ? "is-active" : n < cycle ? "is-complete" : ""}`}><circle cx={x} cy={y} r="41" /><text x={x} y={y+4} textAnchor="middle">{n < cycle ? "✓" : `0${n}`}</text><text className="present-node-name" x={x} y={y+20} textAnchor="middle">{name}</text></g>)}</svg>
    <svg className="present-orbit-compact" viewBox="0 0 620 128" aria-hidden="true"><path d="M112 38H279M337 38H505M534 60Q534 104 480 104H142Q87 104 87 60" className="present-orbit-track" /><path d="M534 60Q534 104 480 104H142Q87 104 87 60" className="present-orbit-motion" /><text x="310" y="108" textAnchor="middle" className="present-compact-label">{approved ? "B APPROVED · LOOP STOPPED" : "↺ IMPROVE WITH FEEDBACK"}</text>{[1,2,3].map((n,i) => <g key={n} className={`present-orbit-node ${cycle === n ? "is-active" : n < cycle ? "is-complete" : ""}`}><circle cx={88+i*222} cy="38" r="26" /><text x={88+i*222} y="44" textAnchor="middle">{n < cycle ? "✓" : `0${n}`}</text><text className="present-compact-name" x={88+i*222} y="82" textAnchor="middle">{["GENERATE","REVISE","REFINE"][i]}</text></g>)}</svg>
  </div>;
}
function Mark() { return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 10C9-1-1 22 13 28c8 4 14-9 22-7 15 3 8 28-7 18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /><path d="M24 38C9 49-1 26 13 20c8-4 14 9 22 7 15-3 8-28-7-18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity=".45" /></svg>; }
function Icon({ name }: { name: "play" | "pause" | "replay" | "next" | "exit" }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === "play" ? <path d="m8 5 11 7-11 7Z" /> : name === "pause" ? <path d="M8 5v14M16 5v14" /> : name === "replay" ? <path d="M4 9a8 8 0 1 1 0 6M4 3v6h6" /> : name === "next" ? <path d="M4 12h16m-6-6 6 6-6 6" /> : <path d="M7 17 17 7M7 7h10v10" />}</svg>; }
