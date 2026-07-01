# First Reviewer Separate Approval Review Gate

This gate defines the second human review step after reviewer evidence intake.
It prevents complete notes from becoming approval, learner-facing release, production readiness, or commercial-ready lesson grades automatically.

## Summary

- Gate ready: true
- Real status overlay present: true
- Intake candidates: 12
- Approval-review candidates: 12
- Auto-approved lessons: 0
- Learner-facing release candidates: 0
- Commercial-ready promotions: 0
- Production-ready claims: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Candidate Rows

| Batch | Lesson | Intake decision | Approval gate decision |
| --- | --- | --- | --- |
| rewrite_batch_01 | lesson_knv2_0044 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_01 | lesson_knv2_0068 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_01 | lesson_knv2_0128 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_01 | lesson_knv2_0140 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_01 | lesson_knv2_0054 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_01 | lesson_knv2_0019 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_05 | lesson_knv2_0075 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_05 | lesson_knv2_0087 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_05 | lesson_knv2_0159 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_05 | lesson_knv2_0011 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_05 | lesson_knv2_0059 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |
| rewrite_batch_05 | lesson_knv2_0167 | candidate_for_separate_human_approval_review | candidate_only_requires_separate_manual_approval_review |

## Manual Approval Review Requirements

- A separate human approver must review completed notes after intake; the first reviewer cannot self-approve.
- The approver must re-check source fit, factual claims, safety boundaries, copying risk, and hand-authored quality.
- The approver must confirm yellow/red/research_only sources are not used as learner-facing evidence.
- The approver may only decide whether a lesson is ready for a later release review; this gate does not publish or promote lesson grades.
- Any unresolved direct candidate, note lint issue, diff audit issue, or completion audit issue keeps the lesson blocked.

## Forbidden Automatic Outcomes

- Do not set approvalStatus to approved_final.
- Do not set learnerFacingRelease:true.
- Do not set productionReady:true.
- Do not change currentGrade to commercial_ready.
- Do not treat complete notes as approval evidence by themselves.
- Do not create trading advice, signals, performance claims, broker/order workflow, automation, or real-money guidance.

## Boundary

This gate only defines the separate human approval review boundary after evidence intake. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
