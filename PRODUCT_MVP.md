# TradeGym AI 商用 SaaS 产品规格

## 1. 产品定位

TradeGym AI 是交易教育 SaaS，不是荐股、投顾、信号、跟单或自动交易工具。

目标用户：

- 交易新手：看过很多课，但真实行情里容易追涨、扛单、重仓、乱交易。
- 进阶小白：懂一些术语，但没有稳定交易计划和复盘纪律。
- 教练/机构：需要把课程、题库、陪练、复盘报告产品化。

一句话：

> 当前原型用内部演示K线、演示新闻/情绪和 AI 复盘，训练用户形成交易判断、风控纪律和自我复盘能力；接入已授权真实历史行情、历史新闻和情绪数据是后续生产化前置条件。

## 2. 商用产品边界

必须坚持：

- 不荐股。
- 不承诺收益、胜率或回本。
- 不输出实盘买卖信号。
- 不接真实资金交易。
- 不做自动下单、跟单、喊单。
- 不把回测结果包装成未来收益证明。

允许做：

- 教学用演示场景训练；未接入已授权真实历史行情、历史新闻和情绪数据。
- 模拟盘和历史回放。
- 用户交易计划点评。
- 风控和纪律训练。
- 错误画像和学习路径推荐。
- 真人老师基于训练记录做教育辅导。

## 3. 当前已落地的前端产品面

目录：

```text
C:\Users\86136\Desktop\ai-trading-learning-gym
```

已实现：

- 总览工作台：今日任务、学习进度、纪律分。
- 课程路径：价格行为、风控、消息情绪、复盘系统四类模块。
- 每日训练：K线图、市场背景、选择题、交易计划输入。
- AI复盘：结构/环境/风控三项评分、错误标签、下一课建议。
- 历史回放：逐根播放教学K线，保存回放笔记。
- 用户画像：本地沉淀错误标签和训练记录。
- 陪练社群：一对多课和一对一诊断课入口。
- 订阅计划：Starter / Pro / Coach 三档商业化包装。
- 运营后台预览：内容生产管线、数据接入参考、上线清单。
- 本地持久化：使用 `localStorage` 保存训练记录和用户画像。

## 4. 商用 SaaS 完整架构

### 4.1 前端应用

- Web App：学习、训练、回放、复盘、订阅、个人画像。
- Coach Console：老师查看用户画像、训练记录、点评任务。
- Admin Console：课程、题库、标签、数据源、合规审核。

### 4.2 后端服务

- Auth：手机号/邮箱/微信登录。
- User Profile：学习进度、画像、订阅权益。
- Lesson Service：课程模块、知识点、练习路径。
- Question Bank：题库、难度、标签、答案、讲解。
- Replay Service：内部演示K线片段、逐根回放、用户决策记录。
- AI Coach Service：复盘生成、风险词拦截、调用审计。
- Billing：订阅、订单、权益、退款。
- Ops CMS：内容审核、发布、版本管理。

### 4.3 数据层

MVP 可用 mock 数据；商用必须接授权数据源。

- OHLCV 行情：用于训练题和历史回放。
- 新闻/事件：财报、宏观、政策、行业事件。
- 情绪数据：热度、恐慌、社媒摘要。
- 用户行为：答题、计划、回放笔记、错误标签。

原则：

> 截图/视频只用于教学识别；严肃回测和历史回放必须使用标准行情数据。

### 4.4 AI 层

AI 负责：

- 课程内容结构化。
- 题目生成草稿。
- 用户答案复盘。
- 错误标签归因。
- 下一课推荐。

AI 不负责：

- 输出买卖建议。
- 预测未来涨跌。
- 推荐具体标的。
- 生成实盘信号。

必须做：

- Prompt 审计。
- 敏感词/荐股词拦截。
- AI 输出留痕。
- 人工审核题库。

## 5. 内容生产管线

输入：

- 授权课程。
- 公开资料。
- 内部教研讲义。
- 自研交易案例。
- 内部演示K线片段和演示新闻/情绪背景；真实历史行情、新闻和情绪接入需要授权数据源。

处理：

1. 提取知识点。
2. 生成术语解释。
3. 识别典型误区。
4. 生成训练题。
5. 绑定图表/行情片段。
6. 生成 AI 讲解。
7. 教研审核。
8. 发布到学习路径。

注意：

- Al Brooks 等第三方课程可以作为学习参考，但不能直接搬运视频、讲义、图表或付费课程内容。
- 商用内容要形成自己的中文体系和授权素材库。

## 6. 开源参考

- OpenBB：https://github.com/OpenBB-finance/OpenBB
  - 金融数据平台，可参考数据接入和分析工具层。
- backtrader：https://github.com/mementum/backtrader
  - 可参考回测和历史场景验证。
- backtesting.py：https://github.com/kernc/backtesting.py
  - 可参考轻量策略验证和教学型回测。
- vectorbt：https://github.com/polakowo/vectorbt
  - 可参考批量参数测试和绩效分析。
- Microsoft Qlib：https://github.com/microsoft/qlib
  - 可参考 AI 量化研究链路，但不适合作为第一版起点。
- FinGPT：https://github.com/AI4Finance-Foundation/FinGPT
  - 可参考金融新闻、情绪和金融文本结构化。
- QuantConnect Lean：https://github.com/QuantConnect/Lean
  - 可参考成熟算法交易引擎，适合后期高阶实验。

### 6.1 Open-source reference map

- Vibe-Trading: https://github.com/HKUDS/Vibe-Trading
  - Reference only: agent orchestration, research/simulation workflow, market/news connector boundaries, backtest diagnostics, and trading journal review patterns.
  - Do not import: live trading execution, broker connectors, autonomous order placement, buy/sell signal logic, return prediction, or asset recommendation.
  - Product translation: use the research-agent idea as an education-only context explainer and learner-diagnosis layer.
- OpenBB can inform licensed market-data connector design, provider health checks, source labels, and audit trails. MVP remains demo/historical education data.
- backtesting.py, backtrader, and vectorbt can inform historical replay and classroom backtest explanations. They must not be used to promise win rate, returns, or real-money readiness.
- FinGPT can inform financial-news and event-text structuring. The output should become learning context and quiz material, not trading advice.
- `GET /api/admin/open-source-reference-map` exposes the internal reference map for backtest libraries, LEAN/Qlib-style research architecture, FinRL/FinGPT-style context structuring, and paper-trading simulators. It records useful education patterns, product mappings, and forbidden uses such as broker routing, auto-trading, buy/sell signals, return prediction, or real-money readiness proof.
- `/api/admin/open-source-reference-map/export?format=json|csv|md` turns that map into customer/compliance-review evidence and writes `open_source_reference_map_exported` audit records while keeping `educationOnly: true` and `productionReady: false`.
- `GET /api/admin/open-source-reference-reviews` turns the GitHub/open-source inspiration layer into a governance queue with `needs_review`, `approved_for_design_reference`, and `rejected_for_forbidden_use` states.
- `POST /api/admin/open-source-reference-reviews/update` records an education-only design-reference decision, writes `open_source_reference_review_updated` audit evidence, and keeps approval separate from dependency installation, execution workflows, broker connection, automation, or real-money readiness proof.
- `GET /api/admin/historical-training-dataset-manifest` creates a scenario-level training data manifest with dataset id, candle count, provider/license state, time-window disclosure, review state, allowed education uses, forbidden uses, and release blockers.
- `/api/admin/historical-training-dataset-manifest/export?format=json|csv|md` exports the manifest as institution/procurement evidence and writes `historical_training_dataset_manifest_exported` audit records while keeping `educationOnly: true` and `productionReady: false`.

### Backtest Classroom Slice

- `GET /api/backtest/classroom` returns education-only paper-trade classroom metrics for the current learner.
- Metrics include sample size, wins/losses, win rate, average win/loss R, payoff ratio, expectancy R, max drawdown R, average journal discipline, and a simple equity curve.
- The feature is inspired by open-source backtesting metric conventions, but it does not run live strategies, broker orders, buy/sell signals, or return forecasts.
- Every response labels the data as demo/historical teaching practice and includes sample-size, overfitting, no-signal, no-return-promise, and no-real-money constraints.
- Coach reports include a backtest classroom summary so human educators can discuss process quality before simulated outcomes.
- The classroom response also includes a metric-misconception drill. Learners must practice rejecting unsafe interpretations such as "small-sample win rate proves strategy quality" or "positive expectancy proves future profitability."
- `POST /api/backtest/misconception-attempts` stores the drill result as an education-only attempt, updates the learner mistake profile, and never creates a trade signal, recommendation, broker action, or return forecast.
- Published course packages now include a required `backtest_metric_misconception` item by default. A package is not complete after only knowledge review and chart drills; the learner must also finish the metric-misconception drill before completion reports and teacher-assignment completion are issued.
- Qlib and Lean can inform a future research sandbox for advanced learners. They are outside the MVP and must stay disconnected from broker execution.

### Teaching Evolution Lab Slice

- `GET /api/admin/teaching-evolution-lab?intent=...` converts Madevolve/QuantaAlpha-style generate/evaluate/retain thinking into an education-only curriculum-quality report.
- The semantic guardrail rewrites natural-language intent such as "突破后追涨" into market hypothesis, visible evidence, counter-evidence, risk plan, and debrief conclusion. It explicitly blocks converting that phrase into a buy recommendation, live signal, asset ranking, return forecast, broker workflow, or real-money instruction.
- Strategy-like outputs are treated as teaching samples. The lab scores scenario candidates by learner mistakes, context attempts, and paper-practice evidence so teachers can keep cases that expose misconceptions instead of claiming a strategy works.
- The backtest anti-hallucination section asks why metrics may be small-sample illusions, what assumptions are missing, and how overfitting could happen. It keeps win rate, expectancy, and drawdown as classroom prompts, not performance claims.
- The course-quality queue identifies packages that need more reviewed scenarios, required safety drills, or learner evidence before generating more variants. Evolution is used to improve question quality, not to optimize simulated returns.

### Market Context Classroom Slice

- `GET /api/context/classroom` returns an education-only review of whether learners separate price action from news, sentiment, macro, and event context.
- `POST /api/context/misconception-attempts` stores a context-boundary drill result and updates the learner profile with tags such as `headline-chasing-risk` or `context-boundary-literacy`.
- This slice addresses the product gap that pure chart/backtest training is incomplete without context discipline.
- Published course packages now include a required `market_context_misconception` item by default. Completion reports are withheld until learners finish knowledge review, chart scenarios, the market-context misconception drill, and the backtest-metric misconception drill.
- News and sentiment are treated as reasoning inputs for uncertainty, bias, and invalidation planning. They are not buy/sell signals, market predictions, return forecasts, or asset recommendations.
- The UI now exposes a Market Context Classroom next to Backtest Classroom so learners can practice both metric literacy and context literacy in the same replay workflow.

### Coach Service SLA Slice

- `GET /api/admin/service-sla-queue` combines learner report delivery follow-up, support-ticket SLA, and open coach workload into one education-service queue.
- `POST /api/admin/service-sla-actions/create` converts service/SLA blockers into reusable customer-success actions with owner, priority, source key, audit evidence, and `productionReady:false`.
- Cohort procurement and renewal packets now include cohort-scoped service SLA action rollups, so open/in-progress/done education service blockers can be reviewed before institution meetings without implying trading readiness.
- Bulk service follow-up creation now supports `maxCreate`, so operators can cap new coach tasks and defer the rest instead of overloading teachers.
- Coach review tasks now expose `priority`, `dueAt`, `overdue`, and `ageHours`; admins can set priority/due time when creating or updating a task.
- Coach review tasks now support `assignedCoachEmail` plus admin filtering by coach, so workload can be distributed across human educators instead of being inferred only from task creator.
- Product readiness now shows SLA queue size and open coach task count under `coach_service`.
- `GET /api/admin/launch-ops-board` provides a top-level education launch operations board across product readiness, institution CS, service SLA, audit evidence, and launch coordination. It is a SaaS operations view only and keeps `productionReady:false`.
- `GET /api/admin/commercial-prototype-scorecard` and `/export?format=json|csv|md` provide a customer-trial readiness scorecard across learning product core, customer trial handoff, customer-success operations, evidence/audit, and education-only boundary. The score measures education SaaS operating completeness for a bounded customer trial only; it is not trading skill, signal quality, profitability, broker readiness, auto-trading approval, or production launch certification.
- `GET /api/admin/customer-trial-kickoff-plan`, `/export?format=json|csv|md`, and `/create-actions` turn the scorecard and trial packet state into a bounded education trial kickoff plan with agenda, roles, success criteria, steps, owners, and reusable customer-success actions. It writes `customer_trial_kickoff_plan_exported` and `customer_trial_kickoff_action_created` audit evidence while keeping `educationOnly: true` and `productionReady: false`.
- `GET /api/admin/customer-trial-room` and `/export?format=json|csv|md` consolidate the trial packet, commercial prototype scorecard, kickoff plan, delivery/feedback state, review artifacts, participant checklist, and customer-success actions into one customer-facing education trial evidence hub. It writes `customer_trial_room_exported` audit evidence and remains explicitly non-production, non-advice, non-signal, non-broker, and non-auto-trading.
- `POST /api/admin/customer-trial-room-shares`, `GET /api/admin/customer-trial-room-shares`, `/feedback`, and `/create-action` make the trial room operational: teams can record a local simulated room share, capture buyer feedback, convert non-pending feedback into reusable customer-success actions, and audit `customer_trial_room_shared`, `customer_trial_room_feedback_recorded`, and `customer_trial_room_feedback_action_created` without claiming real email delivery or production readiness.
- `GET /api/admin/customer-trial-room-buyer-review?shareId=...` generates a buyer-facing education evidence review package from a trial room share, including checklist items, buyer-question prompts, feedback state, owner/date context, and prior objection history.
- `POST /api/admin/customer-trial-room-buyer-review/objection` records structured buyer objections or evidence requests, updates the share feedback state, appends buyer review history, writes `customer_trial_room_buyer_review_recorded` audit evidence, and keeps the record education-only.
- When a customer trial room buyer review exists, `POST /api/admin/customer-trial-room-shares/create-action` carries the buyer review id, reviewer email, requested evidence, and buyer review status so customer-success teams close the exact education evidence request instead of a generic follow-up.
- Buyer review rollups now appear in the commercial prototype scorecard and Customer Trial Room summary, including evidence-request counts, objection counts, accepted-review counts, and a high-priority blocker when buyer-requested education evidence is still open.
- When a linked customer trial room feedback action is marked done or deferred through `POST /api/admin/pilot-success-actions/update`, the trial room share records `nextActionStatus`, timestamps, and resolution notes; the share queue, commercial scorecard, and Customer Trial Room summary expose action done/open counts.
- `/api/admin/customer-trial-room-shares/export?format=json|csv|md` exports room share progress, buyer evidence requests, and action closure state for customer-success or buyer follow-through meetings. Each export writes `customer_trial_room_shares_exported` audit evidence and remains education-only.
- `npm.cmd run smoke:trial-room` runs an end-to-end customer trial room smoke across scorecard, kickoff actions, room exports, local simulated room share, buyer review package, buyer evidence request, feedback action reuse, action closure propagation, share progress exports, and audit evidence while asserting `productionReady:false`.
- `COMMERCIAL_TRIAL_RELEASE_PACKET.md` closes the code-side commercial-trial handoff with release verdict, operator path, required verification evidence, open-source design references, residual non-code blockers, and a stop rule against further low-value prototype feature expansion before a real customer trial.
- `npm.cmd run check:completion` runs a static code-side completion audit check for required docs, scripts, customer trial room endpoints, guardrail content, storage keys, and forbidden production-ready wording.
- `CUSTOMER_TRIAL_OPERATOR_RUNBOOK.md` gives sales, customer-success, curriculum, and ops teams a step-by-step bounded education trial workflow, buyer review script, smoke proof, and stop conditions for requests that would cross into advice, signal, broker, auto-trading, real-money, or production-readiness territory.
- `CODE_SIDE_COMPLETION_AUDIT.md` records the code-side completion audit for the bounded education customer-trial prototype, including requirement evidence, verification commands, core trial path, residual non-code risks, and the boundary between customer-demo readiness and production readiness.
- `README.md` is the repo entrypoint for quick start, trial workflow, verification commands, key documents, education-only boundaries, and production blockers.
- `AGENTS.md` captures repo-specific guardrails for future automation agents, including education-only constraints, forbidden trading/broker/auto-trading scope, verification commands, key files, and persistence rules.
- `/api/admin/launch-ops-board/export?format=json|csv|md` turns the board into meeting-ready evidence and writes `launch_ops_board_exported` audit records without certifying production launch or real-money trading readiness.
- `POST /api/admin/launch-ops-board/create-actions` converts top launch ops blockers into reusable customer-success tasks and writes `launch_ops_action_created` audit evidence.
- `GET /api/admin/customer-trial-packet` and `/export?format=json|csv|md` produce a customer-forwardable education trial packet with trial scope, entry points, provider modes, launch ops summary, next actions, allowed uses, prohibited uses, and `customer_trial_packet_exported` audit evidence.
- `POST /api/admin/customer-trial-packet-deliveries`, `GET /api/admin/customer-trial-packet-deliveries`, `/feedback`, and `/create-action` add a local simulated customer-success delivery loop for the trial packet: operators can record a handoff, capture buyer feedback, convert non-pending feedback into reusable pilot-success actions, and audit `customer_trial_packet_delivered`, `customer_trial_packet_feedback_recorded`, and `customer_trial_feedback_action_created` while keeping `educationOnly: true` and `productionReady: false`.
- The queue is for education service delivery only. It must not become a trading alert, stock recommendation, live signal, return promise, broker workflow, or real-money instruction.

### Learning Records Export Slice

- `GET /api/admin/learning-records/export?format=json|csv|md` exports education-only learning evidence for active learners or a selected cohort.
- The export uses an xAPI-like shape with actor, verb, object, result, context, timestamp, and stored fields so schools, coaches, or internal training teams can review progress evidence without needing a production LRS in the prototype.
- Statements are generated from course enrollments, course progress, completion reports, training attempts, replay reflections, and paper-practice records.
- Cohort cards expose a learning-record export action; the cohort section also supports all-learner JSON, CSV, and Markdown exports.
- Every export writes `learning_records_exported` audit evidence and keeps `educationOnly: true` and `productionReady: false`.
- This is not a production LRS, trading-skill certification, win-rate report, return claim, signal report, broker-readiness check, auto-trading approval, or real-money trading readiness evidence.

### Roster Import Slice

- `POST /api/admin/roster-imports` lets an admin import a learner roster into a new or existing education cohort.
- Rows can be provided as `email,name,plan` lines or structured objects. Existing active accounts are reused; missing learners are created as local prototype student accounts with hashed temporary passwords.
- Imported learners are added to the target cohort and can later be assigned reviewed practice, course packages, learning-record exports, and cohort education reports.
- Each import writes `roster_import_created` audit evidence, returns a local handoff summary, and keeps `educationOnly: true` and `productionReady: false`.
- Imported learners must still complete compliance acknowledgement before training. Local temporary passwords and verification tokens are prototype artifacts, not production email delivery or school identity management.
- This is education cohort onboarding only. It does not provide stock recommendations, live signals, return promises, broker connectivity, auto-trading, or real-money trading instructions.

### Roster Import Handoff Slice

- `GET /api/admin/roster-import-handoffs` lets admins review saved local onboarding handoffs after roster import.
- `GET /api/admin/roster-import-handoffs/export?handoffId=...&format=json|csv|md` exports the learner handoff packet for internal customer-success or teaching-operations use.
- Handoffs include cohort, imported learners, local temporary passwords for newly created prototype accounts, verification payloads when local email mode exposes them, compliance acknowledgement status, and next onboarding steps.
- Every export writes `roster_import_handoff_exported` audit evidence and keeps `educationOnly: true` and `productionReady: false`.
- Handoffs are not production identity delivery, email delivery proof, school SSO, investment advice, live signals, return claims, broker readiness, auto-trading approval, or real-money trading readiness.

### Roster Onboarding Report Slice

- `GET /api/admin/roster-onboarding-report?handoffId=...` lets admins review whether imported learners activated after a roster handoff.
- `GET /api/admin/roster-onboarding-report/export?handoffId=...&format=json|csv|md` exports education customer-success follow-up evidence for login, email verification, compliance acknowledgement, first training start, course enrollments, and completion reports.
- Each learner row includes `needsAttention`, `nextOpsAction`, and activation status so an institution can follow up after import without treating training data as trading-performance proof.
- `GET /api/admin/roster-onboarding-progress?cohortId=...` and `/export?format=json|csv|md` aggregate roster onboarding exceptions across handoffs into a meeting-ready progress view with blocker categories, owner placeholder, target review date, and next education-only customer-success action.
- Report exports write `roster_onboarding_report_exported`; progress exports write `roster_onboarding_progress_exported`; both keep `educationOnly: true` and `productionReady: false`.
- This report is not a win-rate report, investment advice, a signal report, guaranteed-return evidence, broker readiness, auto-trading approval, or real-money trading instruction.

### Roster Onboarding Follow-Up Slice

- `POST /api/admin/roster-onboarding-followups` turns learners who need attention in a roster onboarding report into open education activation tasks.
- The workflow reuses existing open tasks for the same handoff and learner step, so customer-success teams do not create duplicate follow-up work.
- Follow-up tasks keep the roster handoff id, cohort id, learner step, priority, due date, and next operations action so admins can manage them from the existing Activation Interventions console.
- Every run writes `roster_onboarding_followups_created` audit evidence and keeps `educationOnly: true` and `productionReady: false`.
- These follow-ups are institution onboarding operations only, not investment advice, live signals, win-rate evidence, broker readiness, auto-trading approval, or real-money trading instruction.

### Cohort Success Brief Slice

- `GET /api/admin/cohort-success-brief?cohortId=...` combines cohort education progress, xAPI-like learning records, roster onboarding status, activation follow-ups, and support tickets into one institution-facing customer-success brief.
- `GET /api/admin/cohort-success-brief/export?cohortId=...&format=json|csv|md` exports the brief for customer-success reviews, QBR-style education check-ins, and renewal preparation.
- The brief includes a health score, operating status, customer-success next actions, roster attention count, open activation tasks, open support tickets, and coach-review needs.
- Every export writes `cohort_success_brief_exported` audit evidence and keeps `educationOnly: true` and `productionReady: false`.
- The health score measures education operations only. It is not trading performance, investment advice, signal quality evidence, win-rate evidence, broker readiness, auto-trading approval, or real-money trading readiness.

### Cohort Compliance Pack Slice

- `GET /api/admin/cohort-compliance-pack?cohortId=...` summarizes legal acceptance, privacy/risk disclosure versions, education-risk acknowledgement, email verification, open deletion requests, and support-ticket gaps for a cohort.
- `GET /api/admin/cohort-compliance-pack/export?cohortId=...&format=json|csv|md` exports institution-facing education-boundary evidence for procurement, school review, and customer-success compliance checks.
- Each learner row includes current legal-version status, education-risk acknowledgement status, email verification, open support tickets, open data deletion requests, gaps, and the next compliance action.
- Every export writes `cohort_compliance_pack_exported` audit evidence and keeps `educationOnly: true` and `productionReady: false`.
- This pack proves education-boundary operations only. It is not trading performance, investment advice, signal quality evidence, win-rate evidence, broker readiness, auto-trading approval, or real-money trading readiness.

### Cohort Procurement Packet Slice

- `GET /api/admin/cohort-procurement-packet?cohortId=...` combines the cohort success brief and compliance pack into one institution-facing procurement or renewal review packet.
- `GET /api/admin/cohort-procurement-packet/export?cohortId=...&format=json|csv|md` exports executive summary, evidence metrics, blockers, and customer-success next actions for school, training firm, or enterprise buyer review.
- The packet summarizes education adoption, learning-record evidence, onboarding status, support tickets, legal acceptance, education-risk acknowledgement, data-rights gaps, and coach-review needs.
- The packet now includes `curriculumSourceEvidence`, summarizing assigned course package source-rights, OCR/transcript alignment, human review, release blockers, and source attachment gaps for institution review.
- Packet and progress views now expose structured blocker categories across compliance evidence, learning evidence, curriculum source evidence, support follow-through, activation follow-up, coach follow-through, roster onboarding, and provider readiness.
- Every export writes `cohort_procurement_packet_exported` audit evidence and keeps `educationOnly: true` and `productionReady: false`.
- The readiness label is a procurement evidence status only. It is not trading performance, investment advice, signal quality evidence, win-rate evidence, return evidence, broker readiness, auto-trading approval, or real-money trading readiness.
- `POST /api/admin/cohort-procurement-followups` turns the packet blockers and customer-success actions into one reusable open follow-up task in the activation/customer-success queue.
- Follow-up creation writes `cohort_procurement_followup_created` audit evidence, reuses an existing open cohort procurement task when present, and keeps `educationOnly: true` and `productionReady: false`.
- `POST /api/admin/cohort-procurement-deliveries` records a local simulated institution handoff of the cohort procurement packet to a customer-success or buyer contact.
- `GET /api/admin/cohort-procurement-deliveries` lists procurement handoff records with provider mode, feedback status, readiness, recipient, and cohort summary.
- `POST /api/admin/cohort-procurement-deliveries/feedback` records institution feedback such as objections, more-evidence requests, procurement-ready status, or no-fit status.
- Procurement feedback can also carry institution owner email, target review date, and decision context notes so customer-success teams can manage buyer follow-through without implying production, broker, trading, or real-money readiness.
- `GET /api/admin/cohort-procurement-buyer-review?deliveryId=...` generates a buyer-facing review package from the delivered procurement packet with checklist items, redacted learner sample, feedback state, owner/date, and buyer-question prompts.
- `POST /api/admin/cohort-procurement-buyer-review/objection` records buyer objections or evidence requests, updates the delivery feedback state, appends buyer review history, and writes `cohort_procurement_buyer_review_recorded` audit evidence.
- `POST /api/admin/cohort-procurement-deliveries/create-action` turns non-pending procurement feedback into a reusable customer-success action in the existing pilot success action queue.
- When a buyer objection exists, the created customer-success action carries the buyer review id, reviewer email, requested evidence, and buyer review status so the team can close the exact education evidence request instead of a generic follow-up.
- `GET /api/admin/cohort-procurement-progress?cohortId=...` and `/export?cohortId=...&format=json|csv|md` summarize packet handoff, institution feedback, provider mode, and linked customer-success action follow-through for procurement or renewal operations.
- The Cohorts admin console also exposes global Procurement Progress, Progress CSV, Progress Brief, Meeting Brief, and Meeting Actions controls so customer-success leaders can review all institution handoffs without opening each cohort card. The Meeting Brief is a one-page procurement meeting artifact covering decision, asks, blockers, owner/date, CS action rollup, and the education-only boundary; Meeting Actions converts those blockers into reusable education customer-success tasks without changing production readiness.
- Procurement progress includes an institution CS action rollup by cohort, owner, priority, and blocker category; it is a customer-success task summary, not a success rate, trading-performance score, or production-readiness proof.
- Delivery and feedback records write `cohort_procurement_packet_delivered` and `cohort_procurement_feedback_recorded` audit evidence, keep local provider mode clearly labeled, and keep `educationOnly: true` and `productionReady: false`.
- Progress exports write `cohort_procurement_progress_exported` audit evidence, support exact `cohortId` filtering to avoid cross-cohort mixing, and keep `educationOnly: true` and `productionReady: false`.
- Feedback actions write `cohort_procurement_feedback_action_created` or reuse an existing open action for the same delivery and feedback status. They remain education customer-success follow-ups only, not trading-performance evidence or production readiness.
- When a linked feedback action is marked done or deferred through `POST /api/admin/pilot-success-actions/update`, the procurement delivery records `nextActionStatus`, timestamps, and resolution notes so the institution handoff shows follow-through progress.
- `GET /api/admin/cohort-renewal-review?cohortId=...` creates an education-only renewal/QBR review packet that combines cohort success, compliance, procurement packet, procurement progress, buyer evidence requests, and learning evidence loop follow-through.
- `/api/admin/cohort-renewal-review/export?format=json|csv|md` exports the renewal review for institution customer-success meetings and writes `cohort_renewal_review_exported` audit evidence while keeping `educationOnly: true` and `productionReady: false`.
- `POST /api/admin/cohort-renewal-review/create-actions` converts renewal blockers into reusable customer-success actions with owner, priority, blocker category, renewal status, and education-only constraints.
- The renewal review is customer-success evidence only. It is not investment advice, trading-performance evidence, win-rate evidence, return evidence, signal quality evidence, broker readiness, auto-trading approval, or real-money trading readiness.

### Audit Integrity Slice

- `GET /api/admin/audit-integrity` computes a local SHA-256 hash chain over audit logs and reports the current root hash, latest seal, and verification status.
- `POST /api/admin/audit-integrity/seal` creates a local tamper-evidence seal for the current audit log set.
- This is intentionally not marked as immutable production ledger infrastructure. It helps operators detect missing or modified local audit records, while `/api/system/readiness` still keeps `auditImmutableLedger:false` unless real append-only storage is configured.
- Production still requires append-only storage, retention policy, access logging, key management, and legal review.

### 6.2 Implemented learning-product recommendation

After a learner finishes a course package, `/api/learner/progress-report` returns `nextLearningProduct`. It uses completion reports, repeated mistake tags, risk-discipline scores, and published education packages to suggest the next study product or coach follow-up.

Guardrails:
- `educationOnly: true` is mandatory.
- Constraints explicitly block stock recommendations, live signals, guaranteed returns, real-money trading instruction, market prediction, and asset selection.
- The recommendation is a commercial education/renewal next step, not a trading decision engine.

## 7. 合规参考

- CFTC AI Trading Bots Advisory：https://www.cftc.gov/PressRoom/PressReleases/8854-24
- FINRA AI and Investment Fraud：https://www.finra.org/investors/insights/artificial-intelligence-and-investment-fraud
- 中国证监会荐股软件监管说明：https://www.csrc.gov.cn/csrc/c100028/c1002385/content.shtml

## 8. 当前运行方式

```powershell
Set-Location -LiteralPath C:\Users\86136\Desktop\ai-trading-learning-gym
npm start
```

打开：

```text
http://localhost:4273
```

验证：

```powershell
npm run verify
```

当前版本已经不是纯静态页：`server.js` 提供本地 SaaS API，`storage.js` 使用 SQLite 持久化数据，训练提交、回放笔记、用户画像和 AI 复盘审计日志都会落库。

数据文件：

```text
data/tradegym.sqlite      当前实际数据库
data/tradegym.sqlite-wal  SQLite WAL 日志
data/db.json              历史 seed / 迁移来源
```

演示账号：

```text
学生：student@tradegym.local / demo123
管理员：admin@tradegym.local / admin123
```

当前 API：

```text
GET  /api/bootstrap          用户、会话、课程、题库、画像、订阅和运营数据
GET  /api/system/readiness  系统配置、provider 模式和生产化缺口检查
GET  /api/learning-path     基于画像、训练记录、知识点、题库和权益生成教育用途学习路径
GET  /api/coach/report      基于训练、回放、paper trade 和画像生成教育用途学习报告
GET  /api/coach/reviews     学员查看老师教育点评任务和已完成点评
GET  /api/assignments       学员查看老师分配的教育训练作业
GET  /api/course-packages   学员按订阅权益查看已发布课程包
POST /api/course-packages/progress 学员标记课程包知识点已学
POST /api/auth/login         演示登录
POST /api/auth/logout        退出登录
POST /api/auth/register      注册学员账号
POST /api/auth/verify-email  本地模拟邮箱验证
POST /api/auth/password-reset/request  请求本地模拟密码重置
POST /api/auth/password-reset/confirm  确认密码重置并清理旧 session
POST /api/compliance/acknowledge 确认教育训练边界和风险提示
GET  /api/account/export     导出当前用户账号、训练、回放、账单和审计数据
POST /api/account/delete-request 提交账号删除/匿名化请求进入后台复核
POST /api/admin/deletion-requests/process 管理员处理删除请求：处理中、匿名化、拒绝
POST /api/attempts           提交训练题并生成复盘
POST /api/replay-notes       保存历史回放笔记
POST /api/paper-trades       保存教育用途纸面模拟交易，不接真实资金或券商
GET  /api/admin/metrics      运营后台指标
GET  /api/admin/revenue-ledger 管理员查看本地收入、退款和净收入台账
GET  /api/admin/data-sources 管理员查看 provider 状态和训练题数据来源治理
GET  /api/admin/users        管理员查询用户、角色、状态、合规和订阅概况
POST /api/admin/users/update 管理员调整用户角色、禁用账号、恢复账号
GET  /api/admin/coach-reports 管理员查看学员教育报告和老师点评队列
POST /api/admin/assignments 管理员给学员分配已审核训练题
GET  /api/admin/cohorts     管理员查看班级/cohort 和完成率摘要
POST /api/admin/cohorts     管理员创建班级/cohort
POST /api/admin/cohorts/assign 管理员给整个班级分配已审核训练题
GET  /api/admin/coach-review-tasks 管理员查看老师点评任务
POST /api/admin/coach-review-tasks 管理员创建老师点评任务
POST /api/admin/coach-review-tasks/update 管理员完成或取消老师点评任务
GET  /api/admin/content-sources 管理员查看课程/视频转写/OCR 文本内容源台账
POST /api/admin/content-sources 管理员创建内容源并进行轻量结构化
GET  /api/admin/course-packages 管理员查看课程包/学习路径产品
POST /api/admin/course-packages 管理员把知识点和已审核题组成课程包
POST /api/admin/course-packages/publish 管理员发布课程包版本
POST /api/admin/knowledge/distill 管理员把课程笔记蒸馏成知识点草稿
POST /api/admin/scenarios    管理员提交训练题进入审核
GET  /api/admin/scenario-reviews 管理员查看训练题审核队列
POST /api/admin/scenarios/review 管理员批准或退回训练题
POST /api/admin/scenarios/generate-draft 使用 provider 管线生成教学演示题草稿
GET  /api/admin/review-queue AI 复盘人工复核队列
GET  /api/admin/audit-logs   管理员查询支付、AI、合规、账号处理审计日志
GET  /api/admin/audit-logs/export 管理员按当前筛选导出审计 JSON 或 CSV
GET  /api/billing/entitlements 当前用户权益和用量
POST /api/billing/checkout-session 创建本地模拟支付订单
POST /api/billing/addon-checkout-session 创建本地模拟人工点评加购订单
POST /api/billing/webhook          处理本地模拟支付/取消/退款事件
GET  /api/billing/orders           当前用户订单流水
GET  /api/billing/receipts         当前用户本地演示收据
GET  /api/billing/subscription     当前用户订阅状态
```

当前认证机制：

- 登录后服务端下发 `tg_session` HttpOnly cookie。
- 请求按 cookie 识别当前用户或管理员。
- 训练提交和回放笔记要求已登录。
- 题库发布要求管理员会话。
- 演示账号密码在首次启动/迁移时会转成 `scrypt` 哈希，不再依赖明文密码校验。
- 退出登录会清除服务端 session 和浏览器 cookie。
- 当前支持学员自助注册、邮箱验证模拟 token、密码重置模拟 token。
- 注册和重置 token 会直接返回给前端，便于本地演示；生产环境必须改为真实邮件发送，且不能在 API 响应里暴露 token。
- 当前注册要求同时同意 `terms-v1`、`privacy-v1`、`risk-disclosure-v1`，账号会记录版本和同意时间。
- `/terms.html`、`/privacy.html`、`/risk-disclosure.html` 提供产品级草案页面；它们还不是律师审核后的正式法律文件。
- 当前合规确认版本：`tradegym-education-risk-v1`。
- 用户未确认当前合规版本前，训练提交、历史回放笔记和订阅 checkout 会返回 `451 Compliance acknowledgement required`。
- 合规确认会写入账号字段和审计日志；生产环境还需要正式用户协议、隐私政策、风险提示页和法律审核。
- 当前隐私数据权利流程支持用户导出本账号数据，并提交账号删除/匿名化请求进入运营复核队列。
- 管理员可以将删除请求标记为处理中、完成匿名化或拒绝并记录原因。
- 生产环境还需要身份复核、安全下载链接、撤回授权记录、客服 SLA 和法律审核后的数据保留规则。
- 当前运营后台提供 Audit Trail，可按类型查看支付 webhook、AI 复盘、合规确认、账号删除请求和处理动作。
- 当前运营后台提供 User Governance，可按用户邮箱/姓名/账号 id、角色和状态筛选用户，查看邮箱验证、合规确认、法律接受、订阅、训练次数和回放次数。
- 管理员可以把用户在 student/admin 之间切换，也可以禁用或恢复账号；禁用会清理该用户现有 session，恢复后才允许重新登录。
- 当前运营后台提供 Production Readiness，可查看 AI、邮件、支付、数据库和审计日志的 provider 模式，并提示哪些仍是 local/mock 模式。
- 审计台支持类型、用户、复核状态、日期范围筛选，支持展开查看单条 JSON 详情，并支持 JSON/CSV 导出。
- 审计台用于客服排查、合规留痕和运营复盘；当前不是不可篡改账本。生产环境还需要 append-only 存储、篡改证据、管理员权限分级、日志保留策略和导出访问记录。

当前数据层：

- 使用 Node 24 的 `node:sqlite` 和 `DatabaseSync`。
- 启动时如果 SQLite 没有题库，会从 `data/db.json` 自动迁移。
- 表结构覆盖账号、会话、课程模块、训练题、训练记录、回放笔记、用户画像、全局画像、审计日志。
- 写入操作通过 SQLite 事务提交，不再依赖单个 JSON 文件承载运行数据。

当前 AI 复盘治理：

- `ai-coach.js` 提供 AI provider 抽象。
- 默认 `AI_COACH_PROVIDER=mock`，作为无外部 API key 时的稳定 fallback。
- 当前 prompt 版本：`tradegym-coach-v1`。
- 训练提交会记录 provider、promptVersion、moderationStatus、输入/输出合规审核结果。
- 运营后台显示 AI provider 状态、fallback 模式和待人工复核数量。
- 管理员可通过 `/api/admin/review-queue` 查看待复核 AI 输出。
- 已支持可选 `AI_COACH_PROVIDER=openai|anthropic` adapter；没有 `AI_COACH_API_KEY`、请求失败、JSON 不可用或输出触发合规拦截时，会自动回退到本地教育反馈。
- 外部 LLM 只能输出学习过程反馈，不能输出荐股、实盘买卖建议、收益承诺、券商接入、自动交易或真实资金指导；业务 API 保持不变，`productionReady` 仍为 false。

当前生产化配置：

- `.env.example` 列出本地运行和生产替换所需的关键配置。
- `config.js` 集中管理 `APP_ENV`、`APP_BASE_URL`、SQLite 路径、AI provider、邮件 provider、支付 provider 和审计账本配置。
- `email-provider.js` 默认 `EMAIL_PROVIDER=local`，本地演示时会返回验证/重置 token；生产环境必须切换为真实邮件 provider，且不能在 API 响应里暴露 token。
- `payment-provider.js` 默认 `PAYMENT_PROVIDER=local`，只跑本地模拟支付状态机；生产环境必须切换为真实支付 provider，并验证 webhook 签名。
- `market-data-provider.js` 默认 `MARKET_DATA_PROVIDER=demo`，生成合成教学 K 线；生产环境必须接授权行情数据，并明确延迟/实时属性。
- `news-provider.js` 默认 `NEWS_PROVIDER=demo`，生成教学演示新闻/情绪背景；生产环境必须接授权新闻/事件数据、保留来源和时间戳。
- 公开数据预览支持 Stooq 日线 CSV 和 GDELT 新闻检索，用于验证 ingestion 管线、来源标签和授权复核流程；公开可访问不等于商业授权，默认仍保持 `productionReady:false`。
- `/api/admin/public-data-candidates` 输出 Stooq、GDELT、SEC EDGAR、Alpha Vantage 等候选源的用途、Key 要求、授权状态和复核清单。
- `/api/admin/public-data-preview` 拉取 Stooq 日线和 GDELT 新闻样本，只做数据管线验证，不证明生产授权、交易效果或实盘可用。
- `knowledge-distiller.js` 默认 `KNOWLEDGE_DISTILLER_PROVIDER=rule-based`，把课程笔记、讲义或转写稿拆成知识点草稿；生产环境仍需版权、教研、合规和幻觉检查。
- 内容源台账支持 `course_note`、`video_transcript`、`ocr_text`，会记录授权状态、fallback 文本分段、OCR/对齐状态和人工审核要求。
- `question-generator.js` 默认 `QUESTION_GENERATOR_PROVIDER=rule-based`，用确定性模板生成训练题草稿；生产环境仍需教研和合规审核后才能发布。
- `/api/system/readiness` 会返回当前 provider 模式和生产缺口。当前默认返回 local/mock/demo/rule-based 状态，不应被解释为 production-ready。
- Content Source Release Packet turns transcript/OCR/chart-source readiness into JSON/Markdown curriculum evidence for source rights, fallback alignment, human review, draft assets, next actions, and education-only boundaries; it does not approve production use or real-money trading readiness.

当前订阅权益控制：

- Starter：每日 3 次训练、1 次回放、基础 AI。
- Pro Trial：每日 30 次训练、10 次回放、完整 AI。
- Pro：每日 60 次训练、30 次回放、完整 AI。
- Coach：每日 200 次训练、100 次回放、完整 AI + 每月 1 次人工点评权益。
- 训练提交和回放笔记都会先检查权益额度。
- 老师人工点评任务只允许分配给包含 `coachReview` 权益的 Coach 计划用户；非 Coach 计划返回 `402 Coach plan required`。
- Coach 人工点评按自然月计数，已创建且未取消的点评任务会占用当月额度；超额返回 `402 Coach review quota reached`。
- Coach 用户可以购买 `coach_review_1` 加购包，支付成功后增加 1 次人工点评额度；加购包不创建新订阅，只增加服务额度。
- 管理员可以把已审核训练题分配给具体学员；学员完成对应训练提交后，作业自动标记为 `completed`。
- 管理员可以创建 cohort，把多个学员组织成班级，并给整个班级批量分配已审核训练题；后台显示班级作业完成率、平均风控分、Top 错误标签和待老师关注名单。
- 管理员可以把知识点和已审核训练题组合成课程包，发布为版本化、可售卖的教育产品；发布前需要内容权利、题目审核、合规和教研检查。
- 学员端课程包按权益开放：Starter 只能预览，Pro Trial / Pro / Coach 可以完整访问 Pro 课程包。
- 学员可以标记课程包知识点已学；完成课程包内训练题时，场景进度会自动更新，并显示课程包完成百分比。
- 本地收据和收入台账只用于演示运营闭环；生产环境必须接入支付服务商对账、正式发票/收据、税务和会计流程。
- 超出额度返回 `402 Plan limit reached`。
- 订阅页现在是本地模拟支付状态机：先创建 pending order，再通过模拟 `payment.succeeded` 激活 subscription。
- 权益优先从 active subscription 推导；取消或退款事件会关闭订阅并回到 Starter。
- 这仍然不是生产支付：没有接 Stripe/Creem/支付宝/微信支付，没有 webhook 签名校验、发票、税务、真实退款和风控。

当前 CMS 能力：

- 管理员登录。
- 运营后台可输入课程笔记、视频转写或内部讲义，蒸馏成知识点草稿。
- 知识点会记录概念、学习目标、常见错误、训练意图、合规说明和 provider 来源。
- 内容源创建会写入 `content_source_ingested` 审计日志，状态为 `needs_review`。
- 知识点蒸馏会写入 `knowledge_point_distilled` 审计日志，状态为 `needs_review`；如果绑定内容源，会保留 `contentSourceId`。
- 作业创建和完成分别写入 `practice_assignment_created`、`practice_assignment_completed` 审计日志。
- 班级创建和班级批量分配分别写入 `cohort_created`、`cohort_assignment_created` 审计日志。
- 课程包创建和发布分别写入 `course_package_created`、`course_package_published` 审计日志。
- 课程包知识点和训练题进度写入 `course_progress_marked` 审计日志。
- 运营后台可从 demo 行情 provider、demo 新闻 provider、rule-based 题目生成器生成教学题草稿。
- 草稿会自动结合最新知识点，填充 K 线、技术背景、新闻/情绪背景、问题、选项、答案、讲解和错误标签。
- 生成草稿会写入 `scenario_draft_generated` 审计日志，状态为 `needs_review`。
- 在运营后台新增训练题。
- 新题写入 `data/tradegym.sqlite`。
- 新题默认 `reviewStatus=needs_review`，不会进入学员训练、回放或模拟盘训练。
- 管理员完成数据源、合规、教研三项审核后，`reviewStatus=approved` 的题才进入学习端题库。
- 提交审核和审核动作都会写入审计日志。

验证脚本覆盖：

- 未登录提交训练会被 401 拦截。
- 管理员登录会拿到 session cookie。
- 管理员可以发布训练题。
- 管理员可以把课程笔记蒸馏成知识点。
- 管理员可以生成教学演示题草稿，并把草稿发布成训练题。
- 登录后可以提交训练题并生成 AI 复盘。
- 训练提交和 `GET /api/learning-path` 会返回教育用途学习路径，并验证不含荐股、实时信号、收益承诺或实盘指令。
- `GET /api/coach/report` 会聚合训练、回放、paper trade、画像和下一步动作，作为教育诊断报告。
- 登录后可以保存历史回放笔记。
- 登录后可以保存 paper trade 教育模拟记录，并验证 demo/education-only 约束、模拟结果和画像标签。
- Paper-trade submissions include a `replayDebrief` card that records reveal step, hidden candles, next-candle preview, process score, plan quality, review prompts, and next practice.
- `POST /api/admin/replay-debrief-followups` turns a saved replay debrief card into a `learning_evidence_followup` coach task with paper trade id, process score, decision quality, next practice, and review prompts.
- Replay debrief follow-ups reuse the existing learner response and next-education-action loop, so simulation feedback can move into coach review without creating investment advice, signal output, or trading-readiness claims.
- When the learner responds to a replay debrief follow-up, the next action can become `repeat_replay_debrief` and be applied as an education practice assignment.
- Learning evidence packets now summarize the replay debrief loop, including open/responded/completed tasks, assigned replay-debrief practice, completed assignment count, latest process score, and completed attempt id.
- Recent evidence follow-up rows include replay debrief context and next-action assignment status so coaches and institution operators can see whether a reflection issue became a completed education drill.
- The coach review queue and learning-evidence-loop export now classify replay debrief follow-ups separately from chart-screenshot evidence, exposing replay assignment completion, paper-trade id, process score, and replay-only filters for education operations.
- 运营后台能读取训练、回放、审计和 session 指标。
- 管理员能读取 Coach Console 学员教育报告队列，并验证不含荐股或实盘信号。
- 管理员能为 Coach 权益用户创建、查看、完成老师点评任务；学员能读取自己的教育点评记录。
- 用户能查看本地演示收据；管理员能查看订阅、加购、退款构成的收入台账。
- 管理员能查看数据源治理面板，识别 demo 行情、demo 新闻、缺失 source 和生产化授权缺口。
- 运营后台能读取 AI provider 状态。
- 管理员能读取 AI 复盘人工复核队列。
- 登录用户能读取当前权益。
- 本地订阅升级接口可用。
- 训练/回放接口会返回更新后的剩余额度。
- 退出登录会清除 cookie。

## 9. 从当前原型到可收费 SaaS 的最小工程路线

### Phase 1：产品可售化

- 接入用户登录。
- 把 localStorage 替换成数据库。
- 题库从 JS 抽到 CMS/JSON/API。
- 增加付费墙和订阅权益。
- 增加基础免责声明和用户协议。

### Phase 2：内容规模化

- 建题库 CMS。
- 做知识点结构化工具。
- 做 AI 生成题目草稿。
- 加教研审核状态。
- 批量导入行情片段和训练题。

### Phase 3：服务商业化

- Coach Console。
- 老师点评任务队列。
- 一对多直播课报名。
- 用户月度训练报告。
- 社群运营看板。

### Phase 4：数据和 AI 增强

- 接授权行情数据。
- 接新闻/事件数据。
- 接 AI 动态复盘。
- 增加风控话术拦截。
- 增加 AI 输出审计日志。

## 10. 上线前不可跳过的检查

- 内容版权授权。
- 行情/新闻数据授权。
- 合规免责声明。
- 禁止荐股/信号/收益承诺话术。
- 用户隐私与数据安全。
- 支付、退款、订阅权益。
- AI 输出审计和人工纠错机制。
- 老师服务边界培训。
