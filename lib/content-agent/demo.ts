import { approvePost } from "./approve-posts";
import { revisePosts, startRevisionLoop } from "./revision-loop";
import type { CampaignBrief } from "./validate-brief";

// Presentation-only inputs. These are not independently verified product claims.
export const DEMO_BRIEF: CampaignBrief = {
  audience: "Nonprofit teams",
  campaignGoal: "Start a conversation about grant readiness",
  keyMessage: "Stronger applications begin with a clearer plan.",
  approvedClaims: ["GrantReady is a hypothetical product for this demonstration."]
};
export const DEMO_FEEDBACK = ["Make it shorter", "More detailed. Ask a question."] as const;
export const DEMO_BEATS = [
  { at: 0, tag: "THE CONTENT STUDIO", title: "Good content is a conversation.", caption: "A working, human-guided content loop. Three cycles. One clear purpose.", scene: "opening" },
  { at: 6, tag: "01 / CAMPAIGN BRIEF", title: "Start with a human point of view.", caption: "A defined audience, a clear message, and a reviewer-supplied hypothetical claim.", scene: "brief" },
  { at: 14, tag: "02 / GENERATE A + B", title: "One message. Two perspectives.", caption: "The real TypeScript generator creates both drafts. No model call. No invented results.", scene: "drafts" },
  { at: 24, tag: "03 / SIMULATED HUMAN REVIEW", title: "A little direction goes a long way.", caption: "Simulated reviewer feedback: “Make it shorter.” The claim must remain intact.", scene: "feedback-one" },
  { at: 31, tag: "04 / CYCLE TWO", title: "Less copy. The same purpose.", caption: "The actual revision function makes both drafts concise and preserves the claim.", scene: "cycle-two" },
  { at: 41, tag: "05 / SIMULATED HUMAN REVIEW", title: "Now, invite a conversation.", caption: "Simulated reviewer feedback: “More detailed. Ask a question.”", scene: "feedback-two" },
  { at: 48, tag: "06 / CYCLE THREE", title: "More context. A clearer invitation.", caption: "A second real revision adds detail and a question. Three total cycles: the limit is reached.", scene: "cycle-three" },
  { at: 58, tag: "07 / REVISION MEMORY", title: "Every refinement has a story.", caption: "Actual browser-state history shows the initial generation and both feedback-led revisions.", scene: "history" },
  { at: 66, tag: "08 / SIMULATED HUMAN APPROVAL", title: "People make the final call.", caption: "A simulated reviewer explicitly approves Variation B using the real approval function.", scene: "approval" },
  { at: 72, tag: "GROWTHLOOP AI / CONTENT STUDIO", title: "Created with intention. Guided by people.", caption: "Approval ends this loop. No fourth cycle. Nothing is automatically published.", scene: "ending" }
] as const;
export const DEMO_DURATION = 78;

// All copy and history come from the same functions as the manual workflow.
// Reconstructing a frame also makes pause, seeking tests and replay deterministic.
export function createDemoFrame(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= DEMO_BEATS.length) {
    throw new Error("Invalid demonstration step.");
  }
  let loop = index >= 2 ? startRevisionLoop(DEMO_BRIEF) : null;
  if (loop && index >= 4) loop = revisePosts(loop, DEMO_BRIEF, DEMO_FEEDBACK[0]);
  if (loop && index >= 6) loop = revisePosts(loop, DEMO_BRIEF, DEMO_FEEDBACK[1]);
  const approval = loop && index >= 8 ? approvePost(loop.history.at(-1)!.posts, "B", true) : null;
  return { loop, approval };
}

export function demoBeatAt(seconds: number) {
  let index = 0;
  for (let i = 1; i < DEMO_BEATS.length; i++) if (seconds >= DEMO_BEATS[i].at) index = i;
  return index;
}
