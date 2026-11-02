"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createDemoFrame, DEMO_BEATS, DEMO_BRIEF, DEMO_DURATION, DEMO_FEEDBACK, demoBeatAt } from "../lib/content-agent/demo";

export default function StudioDemo({ onClose }: { onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const dialog = useRef<HTMLDivElement>(null);
  const beatIndex = demoBeatAt(elapsed);
  const beat = DEMO_BEATS[beatIndex];
  const { loop, approval } = useMemo(() => createDemoFrame(beatIndex), [beatIndex]);
  const posts = loop?.history.at(-1)?.posts ?? [];
  const finished = elapsed >= DEMO_DURATION;
  const cycle = loop?.currentCycle ?? 0;
  const feedbackStep = beat.scene === "feedback-one" || beat.scene === "feedback-two";

  useEffect(() => {
    if (!playing || finished) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - last) / 1000;
      last = now;
      setElapsed(value => Math.min(DEMO_DURATION, value + delta));
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, finished]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => previousFocus?.focus());
    };
  }, []);

  function keyboard(event: React.KeyboardEvent) {
    if (event.key === "Escape") onClose();
    if (event.key === "Tab") {
      const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
      const first = buttons[0];
      const last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }

  return <div className="studio demo-theater" role="dialog" aria-modal="true" aria-labelledby="demo-title" ref={dialog} onKeyDown={keyboard} data-demo-step={beat.scene}>
    <div className="demo-grain" aria-hidden="true" />
    <div className="demo-stage">
      <header className="demo-masthead"><span className="demo-wordmark"><DemoLoop />GrowthLoop <b>AI</b><span>/ CONTENT STUDIO</span></span><button onClick={onClose} className="demo-close" aria-label="Close demo and return to your campaign">Exit demo <span aria-hidden="true">×</span></button></header>
      <div className="demo-disclosure"><span />GUIDED DEMO · SIMULATED HUMAN ACTIONS · DETERMINISTIC TYPESCRIPT</div>
      <div className="demo-heading" key={`heading-${beatIndex}`}><p className="studio-eyebrow">{beat.tag}</p><h1 id="demo-title">{beat.title}</h1></div>
      <ol className="demo-route" aria-label="Demonstration progress">{["Brief", "A/B drafts", "Review & revise", "Approval"].map((name, i) => {
        const active = i === (beatIndex < 2 ? 0 : beatIndex < 3 ? 1 : beatIndex < 8 ? 2 : 3);
        return <li key={name} className={active ? "is-active" : ""} aria-current={active ? "step" : undefined}><span>{String(i + 1).padStart(2, "0")}</span>{name}</li>;
      })}</ol>
      <div className={`demo-scene demo-scene-${beat.scene}`} key={beat.scene}>
        {beat.scene === "opening" ? <div className="demo-opening"><DemoLoop /><p className="demo-opening-line">A brief becomes a draft.<br />Feedback makes it better.</p><div className="demo-pill-row"><span>2 perspectives</span><span>3 actual cycles</span><span>Human approval</span></div><p className="demo-fineprint">A standalone Content demonstration by Michelle Sainsbury.<br />No Analytics Agent, database, or publishing integration is shown.</p></div>
        : beat.scene === "brief" ? <div className="demo-brief-card"><span className="demo-card-kicker">THE CAMPAIGN / HYPOTHETICAL GRANTREADY</span><dl>{[["Audience", DEMO_BRIEF.audience], ["Purpose", DEMO_BRIEF.campaignGoal], ["Message", DEMO_BRIEF.keyMessage], ["Reviewer-supplied claim", DEMO_BRIEF.approvedClaims[0]]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><span className="demo-safety">Claim text is preserved. This is not independent fact verification.</span></div>
        : feedbackStep ? <div className="demo-review-scene"><div className="demo-review-orbit"><DemoLoop /><span>Improve with Feedback</span></div><div className="demo-feedback-card"><span className="demo-card-kicker">SIMULATED REVIEWER / CYCLE {cycle}</span><blockquote>“{beat.scene === "feedback-one" ? DEMO_FEEDBACK[0] : DEMO_FEEDBACK[1]}”</blockquote><p>Direction changes. The hypothetical claim stays.</p><span className="demo-safety">The next scene runs the real revision function.</span></div></div>
        : beat.scene === "history" ? <div className="demo-history-card"><span className="demo-card-kicker">ACTUAL REVISION HISTORY / BROWSER MEMORY</span><ol>{loop?.history.map(entry => <li key={entry.cycle}><span className="demo-history-number">0{entry.cycle}</span><div><strong>{entry.cycle === 1 ? "The starting point" : entry.cycle === 2 ? "A sharper message" : "An invitation to respond"}</strong><p>{entry.feedback}</p><small>{entry.posts.length} actual drafts · {entry.cycle === 1 ? "Generated" : "Revised"}</small></div><span className="demo-history-check">✓</span></li>)}</ol><p className="demo-safety">Three total cycles reached. Further revisions are blocked by the existing logic.</p></div>
        : beat.scene === "ending" ? <div className="demo-ending"><div className="demo-approval-seal">✓</div><h2>Variation B approved.</h2><p>Three cycles. Two feedback requests.<br />One simulated human decision.</p><div className="demo-pill-row"><span>Loop stopped</span><span>No auto-publishing</span></div><p className="demo-fineprint">Michelle Sainsbury · GrowthLoop AI Content Studio<br />Deterministic generation. Real application logic.</p></div>
        : <div className="demo-drafts"><div className="demo-drafts-meta"><span>ACTUAL GENERATED CONTENT</span><span>Cycle {cycle} / 3</span></div><div className="demo-draft-grid">{posts.map(post => <article className={`demo-post ${approval?.id === post.id ? "demo-post-approved" : ""}`} key={post.id}><div className="demo-post-variation"><span>{post.id}</span><h2>{post.id === "A" ? "Human-Centered" : "Action-Oriented"}</h2>{approval?.id === post.id && <b>✓ Selected</b>}</div><div className="demo-post-paper"><div className="demo-post-author"><span className="demo-avatar"><DemoLoop /></span><div><strong>GrowthLoop AI</strong><small>Hypothetical campaign · Draft only</small></div><b aria-hidden="true">in</b></div><p>{post.content}</p><div className="demo-post-decoration" aria-hidden="true">♡ Like <span>◇ Comment</span><span>↗ Share</span></div></div><div className="demo-post-status">{approval?.id === post.id ? "✓ Approved by simulated reviewer" : "Awaiting human approval"}</div></article>)}</div></div>}
      </div>
      <footer className="demo-bottom"><div className="demo-caption" key={`caption-${beatIndex}`} aria-live="polite" aria-atomic="true"><span className="demo-caption-label">{approval ? "APPROVAL ENDS THE LOOP" : feedbackStep ? "HUMAN DIRECTION, SIMULATED" : "WHAT YOU’RE SEEING"}</span><p>{beat.caption}</p></div><div className="demo-controls"><button onClick={() => { if (finished) setElapsed(0); setPlaying(finished ? true : !playing); }} aria-label={finished ? "Replay demo" : playing ? "Pause demo" : "Resume demo"}>{finished ? "↻ Replay demo" : playing ? "Ⅱ Pause" : "▶ Resume"}</button><div className="demo-progress" role="progressbar" aria-label="Demo playback" aria-valuenow={Math.floor(elapsed)} aria-valuemin={0} aria-valuemax={DEMO_DURATION}><span style={{ width: `${elapsed / DEMO_DURATION * 100}%` }} /></div><span className="demo-time">{Math.floor(elapsed)} / {DEMO_DURATION}s</span></div></footer>
    </div>
  </div>;
}

function DemoLoop() {
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 26C20-5-9 53 24 60c19 5 29-23 46-18 34 10 15 64-15 37" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><path d="M50 74C20 105-9 47 24 40c19-5 29 23 46 18 34-10 15-64-15-37" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".4" /><circle cx="50" cy="50" r="5" fill="currentColor" /></svg>;
}
