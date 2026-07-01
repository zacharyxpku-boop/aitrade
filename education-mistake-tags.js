const mistakeTagGroups = {
  chart: [
    ["chart.single_candle_overweight", "把单根K线看得过重"],
    ["chart.structure_ignored", "忽略高低点结构"],
    ["chart.level_as_line", "把支撑压力看成一条精确线"],
    ["chart.location_ignored", "只看形态名字，不看价格位置"],
    ["chart.volatility_ignored", "忽略波动突然放大"],
    ["chart.close_not_checked", "没有等待收盘确认"],
    ["chart.contextless_pattern", "脱离上下文套用形态"],
  ],
  timeframe: [
    ["timeframe.m15_only", "只看M15"],
    ["timeframe.d1_context_missing", "忽略D1方向"],
    ["timeframe.h4_range_missing", "忽略H4区间"],
    ["timeframe.h1_rhythm_missing", "忽略H1节奏变化"],
    ["timeframe.conflict_not_named", "没有说清多周期冲突"],
    ["timeframe.trigger_before_context", "先找触发点，后补背景"],
    ["timeframe.zoom_bias", "随意缩放图表制造结论"],
  ],
  breakout_range_reversal: [
    ["breakout.chase_after_extension", "看到突破后追逐延伸段"],
    ["breakout.false_breakout_missed", "没有识别假突破"],
    ["breakout.retest_ignored", "忽略突破后的回踩观察"],
    ["range.middle_action_bias", "在区间中部强行下结论"],
    ["range.edge_context_missing", "没有区分区间上沿和下沿"],
    ["reversal.pullback_confused", "把回调误判成反转"],
    ["reversal.exhaustion_missing", "没有观察趋势衰竭证据"],
  ],
  news_sentiment: [
    ["news.headline_as_reason", "把新闻标题当成理由"],
    ["news.event_timing_ignored", "忽略事件前后时间点"],
    ["news.sentiment_overfit", "过度解读情绪标签"],
    ["news.context_not_background", "把背景材料当成行动依据"],
    ["news.after_move_narrative", "价格走完后硬套叙事"],
    ["news.single_source_bias", "只看单一消息来源"],
    ["news.volatility_risk_missing", "忽略事件波动风险"],
  ],
  backtest: [
    ["backtest.future_leakage", "偷看未来"],
    ["backtest.sample_cherry_pick", "只挑成功样本"],
    ["backtest.sample_too_small", "样本太少"],
    ["backtest.costs_ignored", "忽略成本、滑点和点差"],
    ["backtest.one_case_as_rule", "把一次成功当规律"],
    ["backtest.metric_as_proof", "把指标当成能力证明"],
    ["backtest.regime_ignored", "忽略市场状态差异"],
  ],
  psychology_risk: [
    ["psychology.fomo_after_spike", "波动后害怕错过"],
    ["psychology.revenge_learning", "用情绪修正上一题"],
    ["psychology.confirmation_bias", "只找支持自己想法的证据"],
    ["psychology.overconfidence_after_correct", "答对一题后过度自信"],
    ["risk.invalidation_missing", "没有写失效条件"],
    ["risk.no_action_condition_missing", "没有写什么情况下不行动"],
    ["risk.plan_not_observable", "计划无法被复盘验证"],
  ],
};

const mistakeTags = Object.entries(mistakeTagGroups).flatMap(([category, items]) => (
  items.map(([id, label]) => ({
    id,
    category,
    label,
    learnerMeaning: `${label}。训练时只用于定位学习误区，不评价真实资金结果。`,
    coachingPrompt: `请指出学习者是否存在“${label}”，并要求其回到结构、周期和背景证据。`,
    boundaryNote: "错因标签只用于教育复盘，不产生交易建议、即时交易提示或收益承诺。",
  }))
));

module.exports = {
  mistakeTagGroups,
  mistakeTags,
};
