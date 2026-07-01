# Knowledge Browser UI Plan

This document describes how the education knowledge base can connect to a future knowledge-browser UI.
It is not a production-readiness claim.

## Read-Only API Skeleton (implemented)

`server.js` now exposes session-free, read-only knowledge-browser endpoints. Every response carries `educationOnly:true`, `productionReady:false`, and a boundary statement.

- `GET /api/knowledge-browser/overview`: meta, source summary, quality summary, topic-coverage status, module list.
- `GET /api/knowledge-browser/modules`: module cards with learner-facing node counts and entry node ids.
- `GET /api/knowledge-browser/nodes?module=<id>&offset=<n>&limit=<n>`: paged learner-facing node summaries; unknown module returns 404.
- `GET /api/knowledge-browser/nodes/<nodeId>`: full node (definition, principle, multi-timeframe view, mistakes, anti-examples, rubric, source boundary, license boundary, reviewed source refs, authority context refs) plus its lesson draft; unknown node returns 404.
- `GET /api/knowledge-browser/curriculum`: curriculum path summaries with boundaries.
- `GET /api/knowledge-browser/curriculum/<pathId>`: full path with units, checkpoints, and review loop.
- `GET /api/knowledge-browser/nodes/<nodeId>/evidence`: top-5 corpus evidence chunks retrieved by concept-term relevance; public-domain chunks include a 400-char reviewer excerpt, open-access chunks are pointer-only (cite + paraphrase).

`scripts/verify-api.mjs` covers all six endpoints, including 404 paths and boundary-field assertions. These endpoints serve draft curriculum data for a local prototype UI; they do not make the product production-ready.

## Data Entry Point

Use `education-knowledge-browser-index.js`.

It exports:

- `knowledgeBrowserIndex.meta`
- `knowledgeBrowserIndex.sourceSummary`
- `knowledgeBrowserIndex.sourceTopicCoverage`
- `knowledgeBrowserIndex.qualitySummary`
- `knowledgeBrowserIndex.modules`
- `knowledgeBrowserIndex.learnerFacingNodes`

For lesson-style rendering, use `education-knowledge-lessons.js`.

It exports:

- `knowledgeLessons`
- `knowledgeLessonReport`

For ordered learning routes, use `education-curriculum-paths.js`.

It exports:

- `curriculumPaths`
- `curriculumPathReport`

## UI Structure

1. Left navigation: modules.
2. Main area: selected learner-facing node.
3. Right rail: boundaries and review status.
4. Bottom area: practice prompt and rubric draft.
5. Source coverage panel: topic-domain coverage and source-readiness status.

## Module List

Each module has:

- `id`
- `title`
- `totalNodes`
- `learnerFacingNodes`
- `draftNodes`
- `topics`
- `entryNodeIds`

The UI should show learner-facing entry nodes first and keep draft-only nodes hidden until reviewed.

## Source Coverage Panel

Use `knowledgeBrowserIndex.sourceTopicCoverage.domainCards`.

Each source-domain card has:

- source domain label
- total sources
- learner-facing allowed sources
- taxonomy allowed sources
- Tier S/A source count
- research-only source count
- unique host count
- source gap and learner-facing gap
- UI status
- source-use boundary

The UI should show `coverage_ready_for_review` as a review state, not as final course approval.
The current index allows duplicate normalized URL variants as source-review details, but has 0 duplicate learner-facing collision groups.

## Node View

Each node has:

- definition
- principle
- multi-timeframe view
- common mistakes
- anti-examples
- practice prompt
- rubric draft
- source boundary
- license boundary
- source grounding status
- source topic domains
- reviewed source refs when available
- matched concepts for each reviewed source ref
- relevance signal for source-to-node audit
- Tier S/A authority context refs
- education-only boundary note

The UI must not render buy/sell actions, live signals, broker actions, auto-trading controls, or real-money guidance.

`sourceTopicDomains` connects each learner-facing node back to the source coverage matrix. The node view should show these as evidence-domain chips, not as strategy labels.

## Lesson View

Each lesson draft has:

- learning goal
- plain-language intro
- teacher script
- concept explanation
- principle explanation
- observation checklist
- multi-timeframe walkthrough
- common mistakes
- anti-examples
- practice prompt
- case discussion prompt
- AI review prompts
- rubric draft
- closing review prompt
- source evidence summary
- learner boundary

## Suggested User Flow

1. Pick a module.
2. Follow the module curriculum path.
3. Complete each unit checkpoint.
4. Read the concept definition.
5. Compare D1, H4, H1, and M15 observation guidance.
6. Review common mistakes and anti-examples.
7. Complete the practice prompt.
8. Read the AI grading rubric.
9. Move to the next lesson.

## Current Readiness

- Modules: 12.
- Learner-facing candidates: 360.
- Learner-facing candidates with reviewed source refs: 360.
- Original-expression-only candidates: 0.
- Reviewed source refs include matched concepts and relevance signals.
- Learner-facing candidates with Tier S/A authority context refs: 360.
- Lesson drafts: 360.
- Unique lesson intros: 360.
- Lesson drafts with reviewed source evidence: 360.
- Lesson drafts with Tier S/A authority context: 360.
- Curriculum paths: 12.
- Curriculum units: 39.
- Curriculum path lesson coverage: 360.
- Curriculum estimated minutes: 2,880.
- Path prerequisite edges: 11.
- Unit prerequisite edges: 27.

`reviewedSourceRefs` are concept-linked evidence. `authorityContextRefs` are module-level high-authority context and boundary references. The UI should label them separately.
- Review-needed nodes: 1,500.
- Real source URLs: 10,549.
- Official/public document URLs: 325.
- Source relevance review: 99 off-topic and 4,283 weak-relevance sources are kept review-only.
- Source topic coverage: 10 domains meet the current source and learner-facing minimums; duplicate normalized URL variants have 0 learner-facing collision groups.

## Remaining Product Risk

The UI can use the index as a learning browser scaffold, but the content is still not expert-final.
Before broad release, reviewed sources must be linked more tightly to learner-visible nodes, public-document URL health must improve, and human education review should approve final wording.
