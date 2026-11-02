import { approvePost, type ApprovedPost } from "./approve-posts";
import { createDemoFrame } from "./demo";

// This presentation shares the established 78-second film's actual Content logic.
// Its separate timeline does not change the existing film or manual campaigns.
export const PRESENTATION_DURATION = 180;
export const PRESENTATION_STAGES = [
  { at: 0, title: "GrantReady. A clearer path to better content.", label: "A hypothetical nonprofit campaign", scene: "opening", frame: 0, note: "GrantReady is a hypothetical concept. Watch one brief become two drafts, then improve through three Content cycles." },
  { at: 10, title: "A clear audience. A grounded message.", label: "The GrantReady campaign brief", scene: "brief", frame: 1, note: "The brief defines the audience, purpose, message and reviewer-supplied hypothetical claim. No grant-finding product is implied." },
  { at: 24, title: "Cycle 1. Two ways to start a conversation.", label: "Generate · Original A/B drafts", scene: "drafts", frame: 2, note: "Actual generated copy. A leads with people; B leads with action. Both retain the same hypothetical claim." },
  { at: 56, title: "A human direction changes the conversation.", label: "Scripted reviewer · First feedback", scene: "feedback-one", frame: 3, note: "Scripted feedback: “Make it shorter.” The next cycle applies this direction to both posts without removing the claim." },
  { at: 68, title: "Cycle 2. A sharper, more concise message.", label: "Revise · First feedback applied", scene: "cycle-two", frame: 4, note: "Mint highlights show added or replaced language compared with Cycle 1. These are textual changes, not measured campaign results." },
  { at: 96, title: "More context. A reason to respond.", label: "Scripted reviewer · Second feedback", scene: "feedback-two", frame: 5, note: "Scripted feedback: “More detailed. Ask a question.” A second real revision will add context and invite a response." },
  { at: 108, title: "Cycle 3. The final controlled refinement.", label: "Refine · Detail and a closing question", scene: "cycle-three", frame: 6, note: "Both final drafts come from the actual revision function. The hypothetical claim stays intact. Three total cycles; no fourth revision." },
  { at: 140, title: "Three cycles. Every direction accounted for.", label: "Actual revision history", scene: "history", frame: 7, note: "Initial generation, a concise revision, and a detailed revision. This history belongs to the demonstration's browser state." },
  { at: 150, title: "One reviewer. One selected variation.", label: "Scripted simulation of human approval", scene: "approval", frame: 7, note: "This automated reviewer is explicitly scripted: select B, confirm simulated review, then call the unchanged approval function." },
  { at: 174, title: "Variation B approved. Nothing published.", label: "GrantReady · Demonstration complete", scene: "ending", frame: 7, note: "B alone is approved in this simulation. A remains unapproved. The loop is stopped. No content has been published." },
] as const;
export function presentationStageAt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error("Invalid presentation time.");
  let index = 0;
  for (let i = 1; i < PRESENTATION_STAGES.length; i++) if (seconds >= PRESENTATION_STAGES[i].at) index = i;
  return index;
}
export function createPresentationFrame(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= PRESENTATION_STAGES.length) throw new Error("Invalid presentation stage.");
  return createDemoFrame(PRESENTATION_STAGES[index].frame).loop;
}
export function approvePresentation(id: "A" | "B", reviewed: boolean, previous: ApprovedPost | null) {
  if (previous) throw new Error("One variation is already approved. Replay to start a separate simulation.");
  const loop = createPresentationFrame(8)!;
  return approvePost(loop.history.at(-1)!.posts, id, reviewed);
}
export function nextPresentationTime(elapsed: number, delta: number, approved?: boolean) {
  if (!Number.isFinite(elapsed) || !Number.isFinite(delta) || elapsed < 0 || delta < 0) throw new Error("Invalid playback time.");
  void approved; // Compatibility with earlier callers; simulated review never blocks playback.
  return Math.min(PRESENTATION_DURATION, Math.round((elapsed + delta) * 1000) / 1000);
}

// Explicit presentation-only script. Real manual approval still requires its human flag.
export function scriptedReviewAt(seconds: number) {
  presentationStageAt(seconds); // Validate before constructing any simulated decision.
  const selected = seconds >= 155;
  const reviewed = seconds >= 161;
  const approval = seconds >= 167 ? approvePresentation("B", reviewed, null) : null;
  return { selectedId: selected ? "B" as const : null, reviewed, approval,
    phase: approval ? "approved" : reviewed ? "confirm" : selected ? "select" : "review" };
}

// Small viewports automatically show every paragraph, not a shortened replacement.
// Each A/B draft has two reading panels; joining them reconstructs the exact post.
export function draftPages(content: string) {
  const paragraphs = content.split("\n\n");
  const pivot = Math.ceil(paragraphs.length / 2);
  return [paragraphs.slice(0, pivot).join("\n\n"), paragraphs.slice(pivot).join("\n\n")];
}
export function draftSpotlightAt(seconds: number, stageIndex: number) {
  if (![2, 4, 6].includes(stageIndex)) throw new Error("Not a draft stage.");
  presentationStageAt(seconds);
  const start = PRESENTATION_STAGES[stageIndex].at, end = PRESENTATION_STAGES[stageIndex + 1].at;
  const quarter = Math.max(0, Math.min(3, Math.floor((seconds - start) / ((end - start) / 4))));
  return { id: quarter < 2 ? "A" as const : "B" as const, page: quarter % 2 };
}

// Word-level LCS preserves the exact current draft, including whitespace.
// Highlights indicate textual differences, never invented performance improvements.
export function diffDraft(previous: string, current: string) {
  const a = previous.match(/\s+|\S+/g) ?? [], b = current.match(/\s+|\S+/g) ?? [];
  const grid = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    grid[i][j] = a[i] === b[j] ? grid[i + 1][j + 1] + 1 : Math.max(grid[i + 1][j], grid[i][j + 1]);
  const tokens: { text: string; added: boolean }[] = [];
  let i = 0, j = 0, removed = 0;
  while (j < b.length) {
    if (i < a.length && a[i] === b[j]) { tokens.push({ text: b[j++], added: false }); i++; }
    else if (i < a.length && grid[i + 1][j] >= grid[i][j + 1]) { if (a[i].trim()) removed++; i++; }
    else tokens.push({ text: b[j++], added: true });
  }
  for (; i < a.length; i++) if (a[i].trim()) removed++;
  return { tokens, removed, added: tokens.filter(t => t.added && t.text.trim()).length };
}
