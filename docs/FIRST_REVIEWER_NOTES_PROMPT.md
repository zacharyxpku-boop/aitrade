# First Reviewer Notes Prompt

This prompt helps a human reviewer fill real notes for the first two review batches.
It is not completed review, approval, learner-facing release, production readiness, or trading guidance.

## Summary

- Target batches: rewrite_batch_01, rewrite_batch_05
- Lesson prompts: 12
- High-risk lessons: 2
- Required note fields: 6
- Real status overlay present: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Batch Use

- Use this prompt before creating or filling the real status overlay.
- Start with the high-risk lesson in each batch.
- Write real reviewer notes only after source-fit, fact-check, boundary, copying-risk, and original-rewrite checks are actually performed.
- Keep approvalStatus:not_approved, learnerFacingRelease:false, productionReady:false, and currentGrade:structural_draft.
- Do not paste source body text into notes or lesson prose.

## Source Family Roles

| Family | Reviewer role |
| --- | --- |
| BEA | macro data definition and release-reading boundary |
| BLS | macro data definition and release-reading boundary |
| CFTC | commodity/fraud/system-risk boundary, not chart-pattern authority |
| Federal Reserve | macro/rates context and data-boundary reference |
| Investor.gov | investor-protection, glossary, or fraud-warning boundary |
| Project Gutenberg | public-domain historical language only |
| SEC | filing/data-access boundary or disclosure-literacy context |
| Treasury | macro/rates context and data-boundary reference |
| federalregister.gov | metadata or source-boundary reference only until reviewer confirms direct fit |
| nist.gov | technical/data-integrity boundary reference |

## Lesson Prompts

### rewrite_batch_01 / lesson_knv2_0044

- Risk: medium
- Current grade: structural_draft
- Source families: CFTC, SEC
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_01 / lesson_knv2_0068

- Risk: high
- Current grade: structural_draft
- Source families: CFTC, Investor.gov
- First decision: Classify each attached source before any prose rewrite.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | High-risk source-fit first: decide direct evidence vs boundary-only before any prose rewrite. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_01 / lesson_knv2_0128

- Risk: medium
- Current grade: structural_draft
- Source families: CFTC, Federal Reserve, Investor.gov
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_01 / lesson_knv2_0140

- Risk: medium
- Current grade: structural_draft
- Source families: BEA, CFTC, Investor.gov, Treasury
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_01 / lesson_knv2_0054

- Risk: medium
- Current grade: structural_draft
- Source families: BEA, CFTC, Federal Reserve, Project Gutenberg, Treasury
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_01 / lesson_knv2_0019

- Risk: medium
- Current grade: structural_draft
- Source families: BLS, Federal Reserve, Project Gutenberg, Treasury, federalregister.gov
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_05 / lesson_knv2_0075

- Risk: medium
- Current grade: structural_draft
- Source families: BEA, Investor.gov, Project Gutenberg, SEC, Treasury
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_05 / lesson_knv2_0087

- Risk: high
- Current grade: structural_draft
- Source families: BEA, BLS, CFTC, SEC, Treasury
- First decision: Classify each attached source before any prose rewrite.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | High-risk source-fit first: decide direct evidence vs boundary-only before any prose rewrite. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_05 / lesson_knv2_0159

- Risk: medium
- Current grade: structural_draft
- Source families: BEA, Investor.gov, SEC, Treasury
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_05 / lesson_knv2_0011

- Risk: low
- Current grade: structural_draft
- Source families: CFTC, Federal Reserve, SEC, nist.gov
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_05 / lesson_knv2_0059

- Risk: low
- Current grade: structural_draft
- Source families: CFTC, Investor.gov, SEC
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

### rewrite_batch_05 / lesson_knv2_0167

- Risk: low
- Current grade: structural_draft
- Source families: CFTC, Investor.gov, SEC
- First decision: Use the batch high-risk decision as context, then write targeted source-fit notes.

| Note field | Prompt | Pass criteria |
| --- | --- | --- |
| originalRewriteNotes | Resolve this after the batch high-risk lesson is reviewed. State how the lesson should be rewritten as original education prose or observation practice, without copying source body text. | Names the intended rewrite angle and keeps the lesson structural_draft. |
| sourceFitNotes | Classify each source family as direct evidence, boundary-only context, historical-language context, macro/data context, or unsuitable for explanatory prose. | Separates direct source fit from boundary-only metadata and names any sources to keep out of lesson prose. |
| factCheckNotes | List which claims can be fact-checked from the source metadata and which claims must be removed or left unresolved. | Does not invent facts and does not rely on yellow/red/research-only evidence. |
| boundaryCheckNotes | Confirm the rewrite contains no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance. | Explicitly states that the lesson remains education-only and non-production. |
| copyingRiskNotes | Confirm no external source body text will be copied; sources may guide boundaries, citations, and original rewrite decisions only. | Mentions no-copy and no source-body reuse. |
| humanReviewerInitials | Add the human reviewer's initials only after real review work is performed. | Not filled by generated examples or automation. |

## Boundary

This prompt is reviewer-facing scaffolding only. It does not create real reviewer notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
