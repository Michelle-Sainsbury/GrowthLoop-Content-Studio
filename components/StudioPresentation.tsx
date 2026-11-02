"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEMO_BRIEF, DEMO_FEEDBACK } from "../lib/content-agent/demo";
import { approvePresentation, createPresentationFrame, diffDraft, nextPresentationTime, PRESENTATION_DURATION, PRESENTATION_STAGES, presentationStageAt } from "../lib/content-agent/presentation";
import type { ApprovedPost } from "../lib/content-agent/approve-posts";
import "./studio-presentation.css";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function StudioPresentation({ onClose }: { onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [selection, setSelection] = useState<"A" | "B" | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [approval, setApproval] = useState<ApprovedPost | null>(null);
  const [error, setError] = useState("");
  const elapsedRef = useRef(0), approvalLock = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const stageIndex = presentationStageAt(elapsed), stage = PRESENTATION_STAGES[stageIndex];
  const loop = useMemo(() => createPresentationFrame(stageIndex), [stageIndex]);
  const posts = loop?.history.at(-1)?.posts ?? [];
  const previous = loop?.history.at(-2)?.posts;
  const gate = stageIndex === 8 && !approval;
  const done = elapsed >= PRESENTATION_DURATION;
  const feedback = stageIndex === 3 ? DEMO_FEEDBACK[0] : stageIndex === 5 ? DEMO_FEEDBACK[1] : null;
  const cycle = loop?.currentCycle ?? 0;
  const appliedFeedback = stageIndex === 4 ? DEMO_FEEDBACK[0] : stageIndex === 6 ? DEMO_FEEDBACK[1] : null;

  useEffect(() => { if (workspace.current) workspace.current.scrollTop = 0; }, [stageIndex]);

  function seek(seconds: number) { elapsedRef.current = seconds; setElapsed(seconds); }
  function replay() {
    approvalLock.current = false; setApproval(null); setSelection(null); setReviewed(false); setError(""); seek(0); setPlaying(true);
  }
  function next() {
    if (gate || done) return;
    seek(PRESENTATION_STAGES[Math.min(stageIndex + 1, 9)].at); setPlaying(false);
  }
  useEffect(() => {
    if (!playing || done || gate) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const value = nextPresentationTime(elapsedRef.current, (now - last) / 1000, Boolean(approval));
      last = now; elapsedRef.current = value; setElapsed(value);
      if (value === 156 && !approval || value === PRESENTATION_DURATION) setPlaying(false);
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, done, gate, approval]);
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
  function confirm() {
    if (!selection || !reviewed || approvalLock.current) return;
    approvalLock.current = true;
    try { setApproval(approvePresentation(selection, reviewed, approval)); setError(""); setPlaying(true); }
    catch (e) { approvalLock.current = false; setError(e instanceof Error ? e.message : "Simulated approval failed."); }
  }
  function keyboard(event: React.KeyboardEvent) {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key !== "Tab") return;
    const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <div className="studio present-theater" role="dialog" aria-modal="true" aria-labelledby="presentation-title" onKeyDown={keyboard} ref={dialog} data-presentation-stage={stage.scene} data-playing={playing && !gate && !done}>
    <div className="present-shell">
      <header className="present-header"><div className="present-brand"><span aria-hidden="true"><PresentationMark /></span><div>GrowthLoop <b>AI</b><small>CONTENT STUDIO / MICHELLE SAINSBURY</small></div></div><span className="present-disclosure">SIMULATED CAMPAIGN & REVIEWER · ACTUAL CONTENT LOGIC</span><button className="present-exit" onClick={onClose} aria-label="Exit presentation and return to campaign">Exit <PresenterIcon name="exit" /></button></header>
      <div className="present-title" key={`title-${stageIndex}`}><p>{stage.label}</p><h1 id="presentation-title">{stage.title}</h1></div>
      <div className="present-workspace" ref={workspace}>
        <aside className="present-loop-panel" aria-label="Three-cycle feedback loop">
          <div className="present-panel-kicker"><span className="present-live-dot" /> HUMAN-GUIDED REFINEMENT <span>{String(stageIndex + 1).padStart(2, "0")} / 10</span></div>
          <LoopGraphic cycle={cycle} feedback={Boolean(feedback)} approved={Boolean(approval)} />
          <div className={`present-feedback-signal ${feedback ? "is-entering" : ""}`} key={`signal-${stageIndex}`}><span>{feedback ? "SIMULATED REVIEWER → NEXT CYCLE" : approval ? "APPROVAL ENDS THE LOOP" : appliedFeedback ? "FEEDBACK APPLIED TO BOTH DRAFTS" : "THE HUMAN STAYS IN CONTROL"}</span><p>{feedback || appliedFeedback ? `“${feedback || appliedFeedback}”` : approval ? `Variation ${approval.id} selected. Other variation not approved.` : cycle === 3 ? "Three cycles reached. A human must now decide." : "Review → Give direction → Revise"}</p></div>
          <ol className="present-cycle-ledger" aria-label="Completed revision cycles">{[1, 2, 3].map(n => <li key={n} className={n === cycle ? "is-current" : n < cycle ? "is-complete" : ""}><span>{n < cycle ? "✓" : `0${n}`}</span><div><strong>Cycle {n}</strong><small>{n === 1 ? "Generate two perspectives" : n === 2 ? "Make both posts shorter" : "Add detail and a question"}</small></div><b>{n <= cycle ? n === cycle ? "Current" : "Complete" : "Not started"}</b></li>)}</ol>
          <p className="present-boundary">No Analytics Agent. No performance metrics.<br />No LinkedIn publishing. Your judgment leads.</p>
        </aside>
        <section className={`present-content present-content-${stage.scene}`} aria-label="Presentation content" key={stage.scene}>
          {stageIndex === 0 ? <div className="present-welcome"><span className="present-overline">THE CONTENT AGENT, IN MOTION</span><h2>Clarity.<br /><em>Refinement.</em><br />Human judgment.</h2><p>One campaign brief. Two real draft variations.<br />Three cycles you can see.</p><div className="present-feature-pills"><span>3-minute guided story</span><span>Pause at any moment</span></div><p className="present-small">Hypothetical GrantReady content · Deterministic TypeScript templates · No model API</p></div>
          : stageIndex === 1 ? <div className="present-brief"><span className="present-overline">THE BRIEF / HYPOTHETICAL GRANTREADY</span><h2>Start with intention.</h2><dl>{[["Who we’re speaking to", DEMO_BRIEF.audience], ["What we want to encourage", DEMO_BRIEF.campaignGoal], ["The message", DEMO_BRIEF.keyMessage], ["Reviewer-supplied demo claim", DEMO_BRIEF.approvedClaims[0]]].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><p className="present-small">A hypothetical concept, not a functioning grant-finding product. This claim input is not independent fact verification.</p></div>
          : feedback ? <div className="present-review"><span className="present-overline">HUMAN DIRECTION, CLEARLY LABELED AS SIMULATED</span><div className="present-review-symbol" aria-hidden="true">↺</div><h2>“{feedback}”</h2><p>Both variations will change.<br />The supplied claim will stay intact.</p><div className="present-feedback-flow" aria-hidden="true"><span>Reviewer</span><i>→</i><span>Content Agent</span><i>→</i><span>Next cycle</span></div><small>The next stage applies this feedback through the actual revision function.</small></div>
          : stageIndex === 7 ? <div className="present-history"><span className="present-overline">ACTUAL HISTORY / THIS DEMONSTRATION’S BROWSER STATE</span><h2>See the thinking evolve.</h2><ol>{loop?.history.map(entry => <li key={entry.cycle}><span>0{entry.cycle}</span><div><h3>{entry.cycle === 1 ? "A starting perspective" : entry.cycle === 2 ? "A more concise message" : "Context and a question"}</h3><p>{entry.feedback}</p><small>{entry.posts.length} actual drafts · Cycle {entry.cycle} of 3</small></div><b aria-hidden="true">✓</b></li>)}</ol><div className="present-history-stop">3 / 3 cycles reached. Revision stops here. Approval is a separate decision.</div></div>
          : stageIndex === 8 ? <div className="present-gate"><span className="present-overline">HUMAN APPROVAL GATE / SIMULATED REVIEW</span><h2>{approval ? `Variation ${approval.id} approved.` : "One selection. One explicit decision."}</h2><p>{approval ? `Variation ${approval.id === "A" ? "B" : "A"} is not approved. The loop is closed. Nothing has been published.` : "Review the final drafts, select one variation, and confirm review before simulating approval."}</p><fieldset disabled={Boolean(approval)}><legend>Select exactly one final variation</legend><div className="present-gate-options">{posts.map(post => <label key={post.id} className={selection === post.id ? "is-selected" : ""}><input type="radio" name="present-variation" value={post.id} checked={selection === post.id} onChange={() => { setSelection(post.id); setReviewed(false); }} /><strong>Variation {post.id} · {post.id === "A" ? "Human-centered" : "Action-oriented"}</strong><span>{post.content}</span></label>)}</div></fieldset><label className="present-review-confirm"><input type="checkbox" disabled={Boolean(approval)} checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I have reviewed these simulated drafts and confirm my selected variation.</label><button className="present-confirm" disabled={!selection || !reviewed || Boolean(approval)} onClick={confirm}>{approval ? `✓ Variation ${approval.id} approved in this simulation` : "Confirm simulated approval"}</button>{error && <p role="alert">{error}</p>}<p className="present-small" role="status">{approval ? "Exactly one simulated approval recorded. No fourth cycle. No automatic publishing." : "Playback is paused at the human gate. This action affects this demonstration only."}</p></div>
          : stageIndex === 9 ? <div className="present-ending"><span className="present-ending-seal" aria-hidden="true">✓</span><span className="present-overline">THE HUMAN HAS THE FINAL WORD</span><h2>Variation {approval?.id} approved.<br /><em>The loop is complete.</em></h2><p>Three cycles. Two directions.<br />One explicitly simulated human decision.</p><div className="present-feature-pills"><span>Loop stopped</span><span>Other variation not approved</span><span>Nothing published</span></div><p className="present-small">Michelle Sainsbury · GrowthLoop AI Content Studio<br />Standalone demonstration. Not proof of shared two-agent integration.</p></div>
          : <div className="present-drafts"><div className="present-drafts-heading"><span>ACTUAL GENERATED DRAFTS · CYCLE {cycle} / 3</span>{previous && <span className="present-change-key">▰ Added / replaced text</span>}</div><div className="present-post-grid">{posts.map((post, i) => {
            const changes = previous ? diffDraft(previous[i].content, post.content) : null;
            return <article className="present-post" key={post.id}><div className="present-post-label"><span>{post.id}</span><h2>{post.id === "A" ? "Human-centered" : "Action-oriented"}</h2><small>Draft</small></div><div className="present-paper"><div className="present-author"><span aria-hidden="true"><PresentationMark /></span><div><strong>GrowthLoop AI</strong><small>Hypothetical campaign · Not published</small></div><b aria-hidden="true">in</b></div><p className="present-post-copy">{changes ? changes.tokens.map((token, index) => token.added ? <mark key={index}>{token.text}</mark> : token.text) : post.content}</p><div className="present-social" aria-hidden="true">♡ Like <span>◇ Comment</span><span>↗ Share</span></div></div><footer>{changes ? `${changes.added} words added · ${changes.removed} words removed · Claim preserved` : "Two framings · Same supplied claim · Human review required"}</footer></article>;
          })}</div></div>}
        </section>
      </div>
      <footer className="present-footer"><div className="present-narration" aria-live="polite" aria-atomic="true"><span>{gate ? "YOUR DECISION · PLAYBACK PAUSED" : "NARRATION CUE"}</span><p>{stage.note}</p></div><div className="present-controls"><button onClick={() => { if (done) replay(); else setPlaying(!playing); }} disabled={gate} aria-label={done ? "Play presentation again" : playing ? "Pause presentation" : "Play presentation"}><PresenterIcon name={playing && !gate && !done ? "pause" : "play"} />{playing && !gate && !done ? "Pause" : "Play"}</button><button onClick={replay} aria-label="Replay presentation"><PresenterIcon name="replay" />Replay</button><button onClick={next} disabled={gate || done} aria-label="Next presentation stage">Next Stage<PresenterIcon name="next" /></button><span className="present-stage-count">Stage {stageIndex + 1} of 10</span><div className="present-progress" role="progressbar" aria-label="Presentation progress" aria-valuemin={0} aria-valuemax={PRESENTATION_DURATION} aria-valuenow={Math.floor(elapsed)}><span style={{ width: `${elapsed / PRESENTATION_DURATION * 100}%` }} /></div><time>{clock(elapsed)} / 3:00</time></div></footer>
    </div>
  </div>;
}

function LoopGraphic({ cycle, feedback, approved }: { cycle: number; feedback: boolean; approved: boolean }) {
  return <div className={`present-loop ${feedback ? "is-receiving" : ""} ${approved ? "is-approved" : ""}`} role="img" aria-label={`Three-cycle loop: ${cycle ? `cycle ${cycle} of 3` : "awaiting campaign brief"}. ${approved ? "Approval ends the loop." : feedback ? "Human feedback entering the next revision." : "Human-guided revision."}`}>
    <svg viewBox="60 15 300 280" aria-hidden="true"><defs><linearGradient id="present-loop-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d1ffe2" /><stop offset="1" stopColor="#4eaa88" /></linearGradient><marker id="present-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="m1 1 5 3-5 3" fill="none" stroke="#a2dfbc" strokeWidth="1.6" /></marker></defs><circle cx="210" cy="148" r="113" className="present-orbit-halo" /><path d="M140 72 Q210 26 280 72 M326 137 Q330 221 255 244 M164 244 Q82 220 94 137" className="present-orbit-track" markerEnd="url(#present-arrow)" /><path d="M140 72 Q210 26 280 72 M326 137 Q330 221 255 244 M164 244 Q82 220 94 137" className="present-orbit-motion" /><text x="210" y="134" textAnchor="middle" className="present-loop-center">{approved ? "APPROVED" : feedback ? "HUMAN INPUT" : "CONTENT LOOP"}</text><text x="210" y="167" textAnchor="middle" className="present-loop-cycle">{approved ? "✓" : cycle ? `0${cycle} / 03` : "01 → 03"}</text><text x="210" y="190" textAnchor="middle" className="present-loop-sub">{approved ? "No further revisions" : "Improve with Feedback"}</text>{[{x:106,y:98,n:1},{x:314,y:98,n:2},{x:210,y:251,n:3}].map(({x,y,n}) => <g key={n} className={`present-orbit-node ${cycle === n ? "is-active" : n < cycle ? "is-complete" : ""}`}><circle cx={x} cy={y} r="32" /><text x={x} y={y+7} textAnchor="middle">{n < cycle ? "✓" : `0${n}`}</text></g>)}</svg>
    <span className="present-loop-caption">{approved ? "ONE DECISION. LOOP CLOSED." : "GENERATE → REVIEW → REFINE"}</span>
  </div>;
}

function PresentationMark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 10C9-1-1 22 13 28c8 4 14-9 22-7 15 3 8 28-7 18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /><path d="M24 38C9 49-1 26 13 20c8-4 14 9 22 7 15-3 8-28-7-18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity=".45" /><circle cx="24" cy="24" r="3" fill="currentColor" /></svg>;
}
function PresenterIcon({ name }: { name: "play" | "pause" | "replay" | "next" | "exit" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === "play" ? <path d="m8 5 11 7-11 7Z" /> : name === "pause" ? <path d="M8 5v14M16 5v14" /> : name === "replay" ? <path d="M4 9a8 8 0 1 1 0 6M4 3v6h6" /> : name === "next" ? <path d="M4 12h16m-6-6 6 6-6 6" /> : <path d="M7 17 17 7M7 7h10v10" />}</svg>;
}
