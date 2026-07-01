# First Reviewer SourceFitNotes Card Negative Cases

This gate mutates a simulated copy of the blank SourceFitNotes card pack and proves unsafe card states are rejected.
It does not fill the real card pack, create reviewer notes, confirm source use, approve lessons, publish learner-facing content, or authorize write mode.

## Summary

- Negative cases ready: true
- Negative cases: 15
- Passed cases: 15
- Failed cases: 0
- Real card pack blank fields: 35
- Real card pack filled fields: 0
- Green refs checked: 8
- Real status overlay present: false
- Write allowed now: false
- Confirmed decisions: 0
- Approval review candidates: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Negative Cases

| Case | Expected issue | Passed | Detected issues |
| --- | --- | --- | --- |
| prefilled_decision_field_rejected | prefilled_field:decision | true | prefilled_field:decision |
| prefilled_source_role_field_rejected | prefilled_field:sourceRole | true | prefilled_field:sourceRole |
| prefilled_claim_supported_field_rejected | prefilled_field:claimSupported | true | prefilled_field:claimSupported |
| prefilled_rewrite_action_field_rejected | prefilled_field:rewriteAction | true | prefilled_field:rewriteAction |
| prefilled_source_identity_basis_field_rejected | prefilled_field:sourceIdentityBasis | true | prefilled_field:sourceIdentityBasis |
| prefilled_no_copy_originality_check_field_rejected | prefilled_field:noCopyOriginalityCheck | true | prefilled_field:noCopyOriginalityCheck |
| prefilled_reviewer_initials_field_rejected | prefilled_field:reviewerInitials | true | prefilled_field:reviewerInitials |
| approval_readiness_wording_rejected | approval_readiness_wording | true | prefilled_field:decision, approval_readiness_wording |
| trading_signal_wording_rejected | trading_or_real_money_wording | true | prefilled_field:claimSupported, trading_or_real_money_wording, macro_or_regulatory_as_chart_proof |
| copied_source_body_instruction_rejected | copied_source_body_instruction | true | prefilled_field:rewriteAction, copied_source_body_instruction |
| macro_or_regulatory_as_chart_proof_rejected | macro_or_regulatory_as_chart_proof | true | prefilled_field:sourceRole, macro_or_regulatory_as_chart_proof |
| yellow_red_research_only_source_rejected | non_green_source_ref:src_real_11201 | true | non_green_source_ref:src_real_11201 |
| commercial_ready_promotion_rejected | commercial_ready_promotion_drift | true | commercial_ready_promotion_drift |
| real_money_or_broker_workflow_rejected | trading_or_real_money_wording | true | prefilled_field:rewriteAction, trading_or_real_money_wording |
| approval_state_drift_rejected | learner_facing_release_drift | true | learner_facing_release_drift, approval_status_drift |

## Boundary

This negative-case gate mutates only simulated copies of the SourceFitNotes card pack. It does not alter the real blank card pack, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or allow yellow/red/research_only sources into learner-facing evidence.
