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

`npm test` compiles the existing Content Agent modules into an ignored directory and runs the six original Node tests, four short-film contract tests, and twelve three-minute presentation contract tests. The original checks cover: A/B framing and claim preservation, invalid brief rejection, actual revision changes, unsupported-feedback rejection, the three-cycle cap and explicit human approval.

## Connect your own Vercel account later

Repository preparation does not deploy the application.

When you choose to deploy, import **Michelle-Sainsbury/GrowthLoop-Content-Studio** into your own Vercel account. Select the Next.js preset, repository-root directory, Node.js 24, install command `npm ci` and build command `npm run build`. Keep the default Next.js output setting. No environment variables are required. Vercel's GitHub integration may need permission to access this new repository.

This is a browser-state presentation demo, not a production marketing automation system. Review its preview before connecting it to other systems or approving a production release.

## Watch Demo — three-minute live presentation

**Watch Demo** opens the new emerald-and-mint presentation. The original **Watch 78-second film** remains a separate option, with its existing mobile-video profile and export scripts preserved.

The new presentation keeps a large animated three-cycle loop beside the working content throughout desktop narration. It uses the **same deterministic generation, revision and approval functions** as the manual application. Word-level comparisons highlight actual added/replaced text between revisions and count removed words without changing the generated copy. The hypothetical claim is retained in both drafts. History contains only the cycles actually generated for the displayed frame.

### Narration pacing

| Active playback time | Story |
| --- | --- |
| 0:00–0:30 | Opening, purpose and hypothetical GrantReady campaign brief |
| 0:30–0:56 | Cycle 1: actual LinkedIn-style A/B drafts |
| 0:56–1:10 | Simulated reviewer feedback: “Make it shorter” |
| 1:10–1:36 | Cycle 2: concise revisions with differences highlighted |
| 1:36–1:50 | Simulated reviewer feedback: “More detailed. Ask a question.” |
| 1:50–2:20 | Cycle 3: final revisions and closing questions |
| 2:20–2:36 | Actual three-entry revision history |
| 2:36–2:54 | Human approval gate; explicit simulated selection and review |
| 2:54–3:00 | Selected variation, loop stopped, nothing published |

Playback automatically pauses on reaching the human gate. Select A **or** B, check the review confirmation, then click **Confirm simulated approval**. Changing the selected variation resets review confirmation. The real approval function validates the simulation, the other variation remains unapproved, and the timeline resumes. There is no fourth cycle. This deliberately does not record approval of Michelle's actual campaign drafts.

**Play/Pause**, **Replay** and **Next Stage** remain visible during narration. Next Stage moves to the next chapter and pauses; it cannot bypass the unconfirmed approval gate. Replay starts a fresh isolated simulation. Escape or Exit restores the untouched manual campaign and keyboard focus. Backgrounding the tab pauses the presentation; returning does not silently advance it. The scheduled running time is 180 seconds; presenter pauses and review time extend wall-clock duration.

The layout fits the loop, drafts and controls together on tested desktop/laptop sizes. Tablet/mobile content scrolls within the presentation while controls remain visible; full draft text is retained rather than truncated. Keyboard focus is contained within the dialog. Reduced-motion preferences disable decorative motion without removing stages or controls.

This is simulated demonstration data and simulated reviewer activity, using real local Content functions. It is **not** live model generation, an independently authenticated claim registry, LinkedIn publishing, measured campaign performance, durable server memory, or integration with Shawn's Analytics Agent. State stays in the browser and is cleared on refresh. Nothing is sent to a paid service.

These changes remain on `feature/content-studio-watch-demo`, without a commit, push or deployment. The public deployed app does not include this local work yet. Local checks do not establish Safari verification: Chromium is available, but this environment's WebKit download returned HTTP 403 “Domain forbidden.” A Safari walkthrough remains necessary before claiming Safari compatibility is verified.

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

The ten browser scenarios cover the preserved short film and the new three-minute presentation: complete actual cycles, paused/stepped narration, exactly-one simulated approval, replay and manual-state restoration, original manual validation/revision/approval, desktop/laptop/tablet/mobile layouts, reduced motion, keyboard focus containment and background-tab pause. Browser tests advance a virtual clock for speed; the video capture uses real time. Run npm test, npm run typecheck, npm run lint and npm run build as the other checks.


### Current local verification

- `npm test`: 22 passed (6 original, 4 short-film and 12 presentation contracts).
- Browser checks use local production output and virtual time; capture scripts use actual wall-clock playback. No real drafts are approved by automated checks.
- The three-minute presentation is intended for live narration. No new three-minute MP4 has been generated; the existing 78-second MP4s and their capture path are preserved.
