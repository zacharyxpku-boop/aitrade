# 知识蒸馏管线

本管线把公开素材候选转成 TradeGym 原创教育知识资产。

## 阶段

1. SourceInventory：收集公开来源、项目、文档、搜索索引。
2. SourceReview：审查 license、terms、内容使用、数据使用、商业化风险。
3. ConceptCandidate：抽取概念标签、别名、相关词、来源可靠性。
4. PatternTaxonomy：归类指标、K线形态、图表结构、回测指标、错因。
5. KnowledgeNode：用原创中文表达生成原子知识点。
6. MarketCase：绑定 demo 或授权案例，明确 sourceType 和 dataBoundary。
7. TrainingScenario：生成轻训练题。
8. Rubric：生成 AI 批改标准。
9. ReviewStatus：人工审查后从 draft 推进到 reviewed 或 approved。

## 蒸馏规则

- 不复制原文。
- 不复制代码注释。
- 不复制策略示例。
- 不把数据访问库变成数据授权。
- 不把形态识别变成行动提示。
- 不把回测指标变成收益证明。

## KnowledgeNode 生成标准

每个节点必须回答：

- 这是什么？
- 为什么重要？
- 看图先看什么？
- 常见误区是什么？
- 多周期如何阅读？
- 反例是什么？
- 应该如何练习？
- AI 如何批改？
- 边界是什么？

## 进入 learner-facing 的门槛

候选内容必须满足：

- 来源已审查。
- 不是复制正文。
- 表达为原创教育语言。
- 有图表案例或 demo 案例。
- 有训练题。
- 有 Rubric。
- 有错因标签。
- 有 boundaryNote。
- reviewStatus 至少为 `reviewed`。

当前采集层只提供素材，不直接证明内容可用于商业化产品。
