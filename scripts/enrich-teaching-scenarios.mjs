import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const chapters = {
  trend_range: {
    chapter: "趋势与区间",
    order: 1,
    moduleGoal: "先判断价格是在推进、停顿还是回到区间，不把每根K线都当机会。",
    framework: ["找最近前高/前低", "看高低点是否抬高或重叠", "先写观望条件，再写判断"],
  },
  breakout_false: {
    chapter: "突破与假突破",
    order: 2,
    moduleGoal: "分清突破、回踩、跌回区间和假突破，先写哪里认错。",
    framework: ["突破不等于行动", "回踩确认比追涨更重要", "跌回关键位先承认假设变弱"],
  },
  multi_timeframe: {
    chapter: "多周期确认",
    order: 3,
    moduleGoal: "把高周期背景、中周期结构和当前周期动作分开，不用一个周期解释全部。",
    framework: ["高周期只看背景", "中周期找结构位置", "当前周期只写课堂训练动作"],
  },
  context_sentiment: {
    chapter: "消息情绪边界",
    order: 4,
    moduleGoal: "把新闻、财报、社媒热度当作历史环境和偏见检查，不当作买卖理由。",
    framework: ["先分当时已知/未知", "消息只写进背景栏", "情绪强时更要写失效条件"],
  },
};

const definitions = {
  "starter-invalidation-002": {
    chapterKey: "breakout_false",
    teachingGoal: "看到前高没站稳时，先写突破假设在哪里失效。",
    commonMistake: "只看到冲高就认为突破成功，没有写跌回哪里说明自己错了。",
    correctTrainingAction: "标出前高、收盘跌回区间的位置，再写等待重新站回或放弃。",
    goodAnswerExample: "我看到价格冲过前高后收回，突破假设变弱；如果下一段不能重新站上前高，我先承认失效，只做课堂记录。",
    badAnswerExample: "前高被碰到就是突破，直接追。",
  },
  "builder-mtf-wait-003": {
    chapterKey: "multi_timeframe",
    teachingGoal: "执行周期有反弹时，检查高周期是否支持，不急着把小周期当全局。",
    commonMistake: "只看30m反弹就下结论，忽略高周期压制区。",
    correctTrainingAction: "先写高周期压制、中周期是否突破、当前周期只等待确认。",
    goodAnswerExample: "我看到当前周期反弹，但高周期压制还在；这题先练等待，只有背景和结构同时改善才继续复盘。",
    badAnswerExample: "30m涨了，所以高周期也一定转强。",
  },
  "context-event-boundary-004": {
    chapterKey: "context_sentiment",
    teachingGoal: "事件前后先分清当时知道什么、事后才知道什么。",
    commonMistake: "用财报结果或后续走势倒推当时判断正确。",
    correctTrainingAction: "写明当时只有预期、波动和情绪，不能把公布后的结果提前使用。",
    goodAnswerExample: "事件前我只知道市场预期偏乐观，不知道财报结果；所以只记录结构和风险，不用结果证明当时判断。",
    badAnswerExample: "后来涨了，所以事件前肯定该做多。",
  },
  "replay-hindsight-005": {
    chapterKey: "context_sentiment",
    teachingGoal: "回放前先遮住未来，训练按当时可见证据写判断。",
    commonMistake: "先看完整走势，再回头补一个看似合理的理由。",
    correctTrainingAction: "先写当时可见结构、未知信息和不做条件，再揭示后续走势。",
    goodAnswerExample: "在当前回放点，我只看到横盘转弱，还不知道后面下破；所以先写证据顺序和失效条件。",
    badAnswerExample: "后面跌了，所以我当时应该已经知道。",
  },
  "custom-1780544511115": {
    chapterKey: "breakout_false",
    teachingGoal: "跌回区间后承认突破失败，不为原判断找借口。",
    commonMistake: "突破失败后继续维护原判断，只把止损越放越远。",
    correctTrainingAction: "写清跌回区间就是假设变弱，等待新结构，不扩大课堂风险。",
    goodAnswerExample: "价格跌回区间，原突破假设失效；我先停止维护原判断，等新结构出现后再做教育复盘。",
    badAnswerExample: "只要之前突破过，就继续看突破成功。",
  },
  "custom-1780544062558": {
    chapterKey: "breakout_false",
    teachingGoal: "同类失败突破再练一次，确认不是靠记答案。",
    commonMistake: "把一次突破失败当成偶然，不建立固定检查表。",
    correctTrainingAction: "重复使用“突破、跌回、失效、不做条件”四步检查。",
    goodAnswerExample: "我先按检查表看：是否突破、是否跌回、哪里认错、现在不做什么；这只是课堂训练。",
    badAnswerExample: "这次应该不一样，所以不用写失效。",
  },
  "breakout-pullback-001": {
    chapterKey: "breakout_false",
    teachingGoal: "突破之后不急着追，先等待回踩是否守住关键位。",
    commonMistake: "把突破当入场理由，忽略推进力度变弱。",
    correctTrainingAction: "写出等待回踩确认、跌回关键位放弃、仓位只是课堂风险标记。",
    goodAnswerExample: "突破后实体变短，我先等回踩确认；如果跌回关键位，突破假设失效。",
    badAnswerExample: "突破就是机会，越快越好。",
  },
  "range-control-001": {
    chapterKey: "trend_range",
    teachingGoal: "震荡区间里先练少做，识别没有优势的位置。",
    commonMistake: "在区间中每根阳线追、每根阴线怕。",
    correctTrainingAction: "标出区间上沿/下沿，写等待边界或突破失败，不在中间乱做。",
    goodAnswerExample: "高低点重叠，说明还在区间；我先不在中间位置做判断，只等边界和失效条件。",
    badAnswerExample: "刚涨一根，马上判断趋势来了。",
  },
  "news-sentiment-001": {
    chapterKey: "context_sentiment",
    teachingGoal: "热点新闻出现时，把情绪当风险环境，不当行动理由。",
    commonMistake: "新闻越热越想追，忽略波动放大和失效条件。",
    correctTrainingAction: "写明新闻只解释背景，动作仍要回到结构、仓位边界和等待条件。",
    goodAnswerExample: "热点让波动变大，但不能替代结构；我先降低动作冲动，写清失效和不做条件。",
    badAnswerExample: "新闻很热，所以一定要跟上。",
  },
  "starter-range-boundary-006": {
    chapterKey: "trend_range",
    title: "区间边界：为什么中间位置最容易乱做？",
    tag: "入门 · 趋势与区间",
    technical: "价格在上沿和下沿之间来回震荡，最近几根K线没有连续推进。训练重点是识别区间中间位置没有优势。",
    news: "教学演示数据：没有新的基本面事件，不能用“没消息”当作随便判断的理由。",
    sentiment: "教学演示数据：情绪平淡，容易让人因为无聊而频繁出手。",
    question: "价格夹在区间中间时，更适合训练什么？",
    options: ["标出上下边界，等待接近边界或出现突破失败", "看到一根阳线就追", "看到一根阴线就做空", "因为没新闻所以随便判断"],
    answer: 0,
    feedbackTitle: "区间中间先练等待",
    feedback: "区间中间没有清楚优势。训练重点是标边界、写不做条件，而不是强行预测下一根K线。",
    tags: ["趋势与区间", "区间边界", "观望条件"],
    nextPath: "继续练趋势与区间，直到能先标边界，再决定是否需要做题。",
    teachingGoal: "学会在区间中间少做，先找上下边界。",
    commonMistake: "把区间里的每次小波动都当成趋势开始。",
    correctTrainingAction: "画出上沿下沿，写“不到边界不判断，突破失败再复盘”。",
    goodAnswerExample: "价格还在区间中间，我先标上下边界；不到边界不做判断，等突破或失败再练。",
    badAnswerExample: "中间位置也要马上猜方向。",
  },
  "builder-mtf-conflict-007": {
    chapterKey: "multi_timeframe",
    title: "15m 很强，但 4H 还压着，先听谁的？",
    tag: "进阶 · 多周期确认",
    timeframe: "15m / 4H 教学压缩",
    technical: "15m 出现连续反弹，但压缩后的 4H 仍靠近前高压制区。训练重点是识别多周期冲突。",
    news: "教学演示数据：没有新的公告能改变高周期压制，消息不能替代结构确认。",
    sentiment: "教学演示数据：短线情绪偏热，但高周期背景仍需要等待。",
    question: "小周期很强但高周期仍在压制区，训练上更合理的是？",
    options: ["把15m当执行信号，忽略4H", "先记录高周期压制，等待中周期确认", "因为短线热就扩大仓位", "看完结果再补理由"],
    answer: 1,
    feedbackTitle: "多周期冲突时，先降级成等待题",
    feedback: "小周期强不代表高周期已经放行。训练重点是把背景、结构、执行动作拆开。",
    tags: ["多周期确认", "高周期压制", "等待条件", "情绪边界"],
    nextPath: "继续练多周期确认，把高周期背景、中周期结构和当前周期动作分开写。",
    teachingGoal: "识别小周期和高周期冲突时，不把短线强势当全部依据。",
    commonMistake: "只选对自己有利的周期，忽略更大背景。",
    correctTrainingAction: "写清高周期压制、中周期确认条件、当前周期只做等待。",
    goodAnswerExample: "15m强，但4H还在压制；我先把这题降级成等待题，等中周期确认后再复盘。",
    badAnswerExample: "哪个周期涨就看哪个周期。",
  },
  "replay-evidence-order-008": {
    chapterKey: "trend_range",
    title: "趋势刚转弱时，证据顺序怎么写？",
    tag: "入门 · 证据顺序",
    technical: "前半段仍有推进，后半段实体缩短并开始回落，但当前还没有完整破位结果。训练重点是证据顺序。",
    news: "教学演示数据：当时没有新的事件，不能用后续走势补理由。",
    sentiment: "教学演示数据：情绪变化不明显，主要训练反事后归因。",
    question: "趋势开始转弱但还没完全破位时，最好的训练答案是？",
    options: ["先写已知证据、失效条件和等待条件", "直接说后面一定会跌", "用结果证明自己早知道", "只看新闻热度"],
    answer: 0,
    feedbackTitle: "先写证据顺序，再看结果",
    feedback: "趋势转弱不是结果证明。训练重点是按当时可见证据写清楚观察和失效。",
    tags: ["趋势与区间", "证据顺序", "反偷看未来", "回放练习"],
    nextPath: "去回放同一段 K 线，先写当时可见证据，再揭示后续走势。",
    teachingGoal: "在趋势转弱早期，先写证据顺序，不用未来走势倒推。",
    commonMistake: "把后续破位结果提前放进当时判断。",
    correctTrainingAction: "写当时已知、还不知道什么、哪里破坏原趋势。",
    goodAnswerExample: "当前只看到推进变弱，还不能说结果；我先写已知证据和破坏趋势的条件。",
    badAnswerExample: "后面跌了，所以当时已经确定会跌。",
  },
  "public-preview-aapl-1": {
    chapterKey: "trend_range",
    teachingGoal: "用公开预览历史窗口练前高和失效条件，不把真实股票当推荐。",
    commonMistake: "看到真实代码就误以为系统在推荐标的。",
    correctTrainingAction: "只读结构、前高、当前收盘和当时未知信息，明确公开预览非授权实盘数据。",
  },
  "public-preview-msft-2": {
    chapterKey: "multi_timeframe",
    teachingGoal: "用公开预览窗口练趋势回踩与等待条件。",
    commonMistake: "把历史走势片段当成未来可复制规律。",
    correctTrainingAction: "写回踩是否守住、失效区在哪里、哪些后续信息当时不可见。",
  },
  "public-preview-tsla-3": {
    chapterKey: "context_sentiment",
    teachingGoal: "情绪波动大时，练不追高和反事后归因。",
    commonMistake: "把热门标的和情绪热度当成行动理由。",
    correctTrainingAction: "写明情绪只是偏见检查，结构和失效条件才是训练证据。",
  },
  "public-preview-nvda-4": {
    chapterKey: "context_sentiment",
    teachingGoal: "消息热度很高时，练来源透明和结构边界。",
    commonMistake: "把公开来源标签误读成可信交易信号。",
    correctTrainingAction: "先写数据来源边界，再写结构、失效条件和不做条件。",
  },
};

for (const scenario of db.scenarios || []) {
  const def = definitions[scenario.id];
  if (!def) continue;
  const chapter = chapters[def.chapterKey];
  scenario.chapter = chapter.chapter;
  scenario.chapterOrder = chapter.order;
  scenario.moduleGoal = chapter.moduleGoal;
  scenario.teachingFramework = chapter.framework;
  scenario.teachingGoal = def.teachingGoal;
  scenario.commonMistake = def.commonMistake;
  scenario.correctTrainingAction = def.correctTrainingAction;
  scenario.boundaryNote = scenario.source?.mode === "public-preview" || scenario.releaseStatus === "public_preview_demo"
    ? "公开预览历史数据只用于教育试用和来源透明训练；商业化仍需授权行情、新闻和情绪数据。"
    : "当前是内部演示K线和演示新闻/情绪，只做教育训练，不是实盘信号或交易建议。";
  scenario.observationChecklist = [
    "我现在看到的结构是什么？",
    "哪里说明原判断可能失效？",
    "消息/情绪只是背景，还是被我当成理由？",
    "哪些后续结果在当时还不知道？",
  ];
  scenario.goodAnswerExample = def.goodAnswerExample || `我先按${chapter.chapter}检查表写：结构、失效条件、消息/情绪边界和不做条件；这只是教育训练。`;
  scenario.badAnswerExample = def.badAnswerExample || "看到真实代码或历史片段，就直接推断未来会怎样。";
  scenario.lessonSteps = [
    { label: "观察K线", text: "只看当时可见K线，先找前高、前低、区间或压制。" },
    { label: "标结构/背景", text: chapter.framework[0] || "先写背景，不写结论。" },
    { label: "写失效条件", text: "说明哪种变化代表原判断不成立。" },
    { label: "区分消息/情绪", text: "消息和情绪只做背景与偏见检查。" },
    { label: "选择答案", text: "最后才选择课堂判断，并写计划。" },
    { label: "AI复盘", text: "只评价学习过程，不输出交易建议。" },
  ];
  if (def.title) scenario.title = def.title;
  if (def.tag) scenario.tag = def.tag;
  if (def.timeframe) scenario.timeframe = def.timeframe;
  if (def.technical) scenario.technical = def.technical;
  if (def.news) scenario.news = def.news;
  if (def.sentiment) scenario.sentiment = def.sentiment;
  if (def.question) scenario.question = def.question;
  if (def.options) scenario.options = def.options;
  if (Number.isInteger(def.answer)) scenario.answer = def.answer;
  if (def.feedbackTitle) scenario.feedbackTitle = def.feedbackTitle;
  if (def.feedback) scenario.feedback = def.feedback;
  if (def.tags) scenario.tags = def.tags;
  if (def.nextPath) scenario.nextPath = def.nextPath;
  scenario.educationOnly = true;
  scenario.productionReady = false;
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + "\n");
