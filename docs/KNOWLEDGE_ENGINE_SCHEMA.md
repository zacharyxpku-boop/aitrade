# AI交易教育知识工程 Schema

本文件描述第一版教育知识底座。该底座是 `educationOnly:true`、`productionReady:false` 的教学资产，不是实盘交易系统。

## 分层

1. L0 课程域
2. L1 能力模块
3. L2 知识主题
4. L3 原子知识点
5. L4 图表案例
6. L5 常见错因
7. L6 训练任务
8. L7 AI批改标准

## 核心对象

- `KnowledgeNode`：一个可教学、可练习、可批改的原子知识点。
- `MarketCase`：用于教育演示的图表案例，必须标注 `sourceType` 和 `dataBoundary`。
- `TrainingScenario`：围绕知识点和图表案例生成的轻训练题。
- `MistakeTag`：用户常见错因标签，只用于教育复盘。
- `Rubric`：AI教练批改标准，只批改学习过程。
- `LearningPathEdge`：知识点之间的学习路径关系。
- `SourceReview`：来源审查记录，说明可参考范围和不可使用范围。

## 质量治理

`KnowledgeNode`、`MarketCase`、`TrainingScenario` 都必须包含：

- `qualityScore`
- `reviewStatus`
- `boundaryNote`

`reviewStatus` 当前支持：

- `draft`
- `reviewed`
- `approved`
- `deprecated`

第一版内容主要为 `draft`，用于建立知识工程骨架，后续需要人工审校后才能成为商业化课程资产。

## 数据边界

当前 `MarketCase` 均为 `sourceType: demo`。它们只用于教育演示，不代表真实授权行情、实时数据、可交易信号或收益证据。

## AI使用边界

AI 只能用于：

- 解释知识点
- 提问
- 批改学习过程
- 复盘错因
- 推荐下一知识点

AI 不能用于：

- 荐股
- 即时交易提示
- 收益类承诺
- 券商接入
- 自动交易
- 真实资金指导
