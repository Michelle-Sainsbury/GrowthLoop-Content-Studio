# GrowthLoop AI | Content Studio

**Human-guided content creation, revision, and approval.**

A standalone Next.js Content Agent demo for the Pursuit presentation, with an animated SVG feedback loop, LinkedIn-style A/B previews, actual revision-history timeline, original loop branding, responsive layouts and reduced-motion support.

Preserved from `Shawn-Bi/GrowthLoop-AI`, branch `ui/content-studio-polish`, commit `d5d87b8e72ea52fdf4cd05ea1b1242ee2bf91321`. The dashboard, styles, Content Agent modules and six existing tests are unchanged. Unrelated multi-agent planning documents and unused starter graphics are excluded. This repository has independent Git history.

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

`npm test` compiles the existing Content Agent modules into an ignored directory and runs the six original Node tests: A/B framing and claim preservation, invalid brief rejection, actual revision changes, unsupported-feedback rejection, the three-cycle cap and explicit human approval.

## Connect your own Vercel account later

Repository preparation does not deploy the application.

When you choose to deploy, import **Michelle-Sainsbury/GrowthLoop-Content-Studio** into your own Vercel account. Select the Next.js preset, repository-root directory, Node.js 24, install command `npm ci` and build command `npm run build`. Keep the default Next.js output setting. No environment variables are required. Vercel's GitHub integration may need permission to access this new repository.

This is a browser-state presentation demo, not a production marketing automation system. Review its preview before connecting it to other systems or approving a production release.
