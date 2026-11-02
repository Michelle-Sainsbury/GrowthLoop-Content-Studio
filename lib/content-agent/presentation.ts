import { approvePost, type ApprovedPost } from "./approve-posts";
import { createDemoFrame } from "./demo";

// This presentation shares the established 78-second film's actual Content logic.
// Its separate timeline does not change the existing film or manual campaigns.
export const PRESENTATION_DURATION = 180;
export const PRESENTATION_STAGES = [
  { at: 0, title: "A better draft starts with a conversation.", label: "Welcome to Content Studio", scene: "opening", frame: 0, note: "Michelle narrates. The Content Agent demonstrates. Human judgment leads every refinement." },
  { at: 12, title: "Give the content a clear purpose.", label: "The campaign brief", scene: "brief", frame: 1, note: "A hypothetical GrantReady example: a defined audience, a message, and a reviewer-supplied demonstration claim." },
  { at: 30, title: "Cycle 1. One message, two perspectives.", label: "Cycle 1 · Generate A/B", scene: "drafts", frame: 2, note: "Both posts below come from the actual TypeScript generator. Two perspectives, with the same hypothetical claim." },
  { at: 56, title: "Human feedback enters the loop.", label: "Review · First direction", scene: "feedback-one", frame: 3, note: "Simulated reviewer: “Make it shorter.” This direction will be applied to both drafts in Cycle 2." },
  { at: 70, title: "Cycle 2. Say more with less.", label: "Cycle 2 · First revision", scene: "cycle-two", frame: 4, note: "Mint highlights show text added or replaced from Cycle 1. Removed text is counted; the full current drafts remain visible." },
  { at: 96, title: "A second direction. A clearer invitation.", label: "Review · Second direction", scene: "feedback-two", frame: 5, note: "Simulated reviewer: “More detailed. Ask a question.” The final revision must still preserve the supplied claim." },
  { at: 110, title: "Cycle 3. Add context. Invite a response.", label: "Cycle 3 · Final revision", scene: "cycle-three", frame: 6, note: "Both posts are revised by the existing function. The claim stays; added detail and closing questions are highlighted." },
  { at: 140, title: "Every refinement leaves a trace.", label: "The revision history", scene: "history", frame: 7, note: "Three actual browser-state cycles: initial generation, one concise revision, and one detailed revision. No fourth cycle." },
  { at: 156, title: "The agent stops. A person decides.", label: "Human approval gate", scene: "approval", frame: 7, note: "Playback pauses here. Select exactly one variation, confirm review, then explicitly simulate approval. Nothing is published." },
  { at: 174, title: "Created with intention. Guided by people.", label: "Approval ends the loop", scene: "ending", frame: 7, note: "One simulated approval. Three actual Content cycles. No automatic publishing, invented results, or Analytics integration." },
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
export function nextPresentationTime(elapsed: number, delta: number, approved: boolean) {
  if (!Number.isFinite(elapsed) || !Number.isFinite(delta) || elapsed < 0 || delta < 0) throw new Error("Invalid playback time.");
  const next = Math.min(PRESENTATION_DURATION, elapsed + delta);
  if (!approved && elapsed < 156 && next >= 156) return 156;
  return !approved ? Math.min(next, 156) : next;
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
