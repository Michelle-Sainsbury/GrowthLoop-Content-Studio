# GrowthLoop AI | Content Studio

**Human-guided content creation, revision, and approval.**

A standalone Next.js Content Agent demo for the Pursuit presentation, with an animated SVG feedback loop, LinkedIn-style A/B previews, actual revision-history timeline, original loop branding, responsive layouts and reduced-motion support.

Preserved from `Shawn-Bi/GrowthLoop-AI`, branch `ui/content-studio-polish`, commit `d5d87b8e72ea52fdf4cd05ea1b1242ee2bf91321`. The original manual Content Agent functions and six original tests are preserved. Presentation views and styling are developed independently around that working workflow. Unrelated multi-agent planning documents and unused starter graphics are excluded. This repository has independent Git history.

## The human-guided loop

**Campaign Brief → Generate A/B Drafts → Human Review → Revision → Approval**

1. Enter the audience, campaign goal, key message and a reviewer-supplied approved claim.
2. Generate **A — Human-Centered** and **B — Action-Oriented** drafts. Both preserve the provided claim content.
3. Review the actual text. Supported feedback includes “shorter,” “more detailed,” “ask a question,” and “add a sharing call to action.” Unsupported feedback raises a human-review error rather than being silently accepted.
4. Each successful revision creates the next cycle. **Three total cycles are allowed: initial generation plus up to two revisions.** The timeline shows only actual history.
5. Explicitly approve one variation. Approval ends the revision loop and disables the other approval action. It does not generate another cycle or publish content. “Start New Campaign” resets the loop.

Generation uses the existing deterministic TypeScript templates, not LLM/API calls. Validation rejects incomplete briefs and empty claim entries. Claims are supplied by the reviewer: the “approved claim” input is not an independent fact-check, external registry lookup or authenticated approval system. No additional claim-verification guarantees are implied.

Social icons are decorative. No engagement statistics or measured campaign performance are fabricated. Sample copy is demonstration content, not evidence of actual campaign results.

## Run locally

Use **Node.js 24** and npm. No API keys, database, environment file or credentials are required.

```sh
npm ci
npm run dev
```

Open the local address printed by Next.js in your browser, usually `http://localhost:3000` on your own computer.

For the production build:

```sh
npm run build
npm start
```

State lives in browser memory. Refreshing the page clears the brief, drafts, history and approval. This standalone demo has no database, Analytics Agent, automatic publishing or authentication.

## Validation

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` compiles the existing Content Agent modules into an ignored directory and runs the six original Node tests, four short-film contract tests, and fifteen three-minute presentation contract tests. The original checks cover: A/B framing and claim preservation, invalid brief rejection, actual revision changes, unsupported-feedback rejection, the three-cycle cap and explicit human approval.

## Connect your own Vercel account later

Repository preparation does not deploy the application.

When you choose to deploy, import **Michelle-Sainsbury/GrowthLoop-Content-Studio** into your own Vercel account. Select the Next.js preset, repository-root directory, Node.js 24, install command `npm ci` and build command `npm run build`. Keep the default Next.js output setting. No environment variables are required. Vercel's GitHub integration may need permission to access this new repository.

This is a browser-state presentation demo, not a production marketing automation system. Review its preview before connecting it to other systems or approving a production release.

## Watch Demo — one click, three minutes, complete GrantReady story

**Watch Demo** runs from the hypothetical GrantReady brief through the final approval outcome with **one click and no further interaction**. The original **Watch 78-second film** remains a separate option, with its existing mobile profile and export scripts preserved.

The presentation has a prominent animated feedback loop, stage reveals, actual generated A/B copy, highlighted changes across both revisions, and a visibly scripted review/selection/approval sequence. It ends with **Variation B approved in the simulation, Variation A unapproved, and nothing published**.

| Active playback | What appears automatically |
| --- | --- |
| 0:00–0:10 | GrantReady: a hypothetical nonprofit campaign, not an operating product |
| 0:10–0:24 | Audience, campaign goal, key message and reviewer-supplied hypothetical claim |
| 0:24–0:56 | Cycle 1: original A/B drafts from the actual generator |
| 0:56–1:08 | Scripted reviewer feedback: “Make it shorter” |
| 1:08–1:36 | Cycle 2: actual concise revisions, with changes highlighted |
| 1:36–1:48 | Scripted reviewer feedback: “More detailed. Ask a question.” |
| 1:48–2:20 | Cycle 3: actual final revisions and closing questions |
| 2:20–2:30 | Actual three-entry browser-state history |
| 2:30–2:35 | Scripted reviewer considers the final A/B pair |
| 2:35–2:41 | Variation B is visibly selected; A remains unselected |
| 2:41–2:47 | Scripted review confirmation appears; approval has not yet occurred |
| 2:47–2:54 | The unchanged approval function returns B's simulated approval |
| 2:54–3:00 | Success finale: B approved, A unapproved, loop stopped, nothing published |

**There is no interactive gate or approval button in Watch Demo.** The presentation is explicitly labeled a **scripted simulation of a human reviewer**. The script supplies its simulated review flag only after the visible confirmation phase. It does not bypass or change `approvePost`, approve Michelle's real campaign content, or alter the original manual approval controls.

Wide screens show both complete posts together. Narrow/short screens automatically spotlight A and then B, with two reading panels per post. Every paragraph is shown unchanged and in order; joining the panels reconstructs the exact original post. This is automatic pagination, not truncated replacement copy, an ellipsis, a scroll container or a smaller font. Draft text remains at least 15 px in tested layouts. The loop, current stage and playback controls stay visible.

Play/Pause and Replay are optional safety controls. Next is also available on larger screens for practice. No control needs to be touched after Watch Demo. Backgrounding the tab pauses playback safely; keep the presentation tab visible while narrating. Escape or Exit restores the untouched manual campaign and keyboard focus. Reduced-motion preferences remove decorative motion without stopping the story or scripted finale.

This is deterministic TypeScript using the same original Content functions, not live model generation, independently authenticated claims, real performance metrics, Analytics integration, database persistence or LinkedIn publishing. Browser state clears on refresh. No paid service or API is used.

The prior deployed version is recoverable at commit `e0affb7cb15758f67e6b326e1afebe792c3cb6d6`. The corrections remain local until Michelle authorizes commit/push/deployment. No direct Safari verification is implied by Chromium tests. A real Safari review of a new preview is still required before final presentation sign-off.

### Automatic MP4 capture

Playwright is a pinned development-only dependency. With FFmpeg on PATH and Playwright's browser/video binaries installed:

```sh
npx playwright install chromium ffmpeg
npm run build
npm run demo:record
```

The capture command starts the local production app, clicks Watch 78-second film, records actual wall-clock playback, checks all ten chapters, and encodes a **1080 × 1080, 30 fps, H.264 MP4** with on-screen captions. It is silent and designed to work without narration. No screen-recording controls, account credentials, external recording service, or deployment are needed. Output defaults to the ignored test-results/content-studio-demo directory, including MP4, poster, final frame and chapter evidence.

Optional environment settings: DEMO_ARTIFACT_DIR (output location), CHROMIUM_PATH (existing browser), FFMPEG_PATH (encoder), DEMO_PORT (local port), DEMO_BASE_URL (an already running local app). Capture needs Playwright's FFmpeg helper as well as the MP4 encoder.

### Browser regression checks

```sh
# Start a local app, then run the browser checks in another terminal.
npm run dev -- --port 3100
npm run test:browser
```

The browser suite preserves all five original film/manual scenarios and tests one-click autoplay at desktop, laptop, tablet, mobile and split-screen viewport sizes. It verifies every reading panel against actual generated text, all approval-script phases, no additional clicks or scrolling, unclipped essential text, optional controls, reduced motion, keyboard focus, background pause and separation from the real manual campaign. Browser tests advance a virtual clock for speed; the video capture uses real time. Run npm test, npm run typecheck, npm run lint and npm run build as the other checks.


### Current local verification

- `npm test`: 25 passed (6 original, 4 short-film and 15 presentation contracts).
- `npm run test:browser`: 16 passed, including seven one-click viewport runs with zero scrolling and every A/B reading panel verified.
- A separate real-time production-browser run completed with one click in 181.76 seconds including launch, ending with simulated B approval, A unapproved and nothing published.
- Browser regression checks use virtual time; the separate real-time run and capture scripts use actual wall-clock playback. No real drafts are approved by automated checks.
- The three-minute presentation is intended for live narration. No new three-minute MP4 has been generated; the existing 78-second MP4s and their capture path are preserved.
