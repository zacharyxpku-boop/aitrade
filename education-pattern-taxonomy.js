const { sourceInventory } = require("./education-source-inventory");

const patternSeeds = {
  indicator: [
    "moving average", "exponential moving average", "relative strength index", "macd", "bollinger bands",
    "average true range", "stochastic oscillator", "commodity channel index", "on balance volume", "volume profile",
    "adx", "parabolic sar", "ichimoku", "vwap", "donchian channel", "keltner channel", "pivot points", "roc",
    "money flow index", "williams r",
  ],
  candlestick: [
    "doji", "hammer", "inverted hammer", "shooting star", "engulfing", "harami", "morning star", "evening star",
    "piercing pattern", "dark cloud cover", "three white soldiers", "three black crows", "marubozu", "spinning top",
    "inside bar", "outside bar", "pin bar", "long wick rejection", "gap candle", "wide range candle",
  ],
  chart_pattern: [
    "head and shoulders", "inverse head and shoulders", "double top", "double bottom", "triple top", "triple bottom",
    "ascending triangle", "descending triangle", "symmetrical triangle", "rising wedge", "falling wedge", "bull flag",
    "bear flag", "rectangle range", "cup and handle", "rounding bottom", "channel", "broadening formation",
    "breakout retest", "failed breakout",
  ],
  price_action: [
    "trend continuation", "trend exhaustion", "pullback", "range rotation", "range edge rejection", "support zone",
    "resistance zone", "liquidity sweep", "compression before breakout", "volatility expansion", "volatility contraction",
    "higher high", "higher low", "lower high", "lower low", "market structure shift", "price acceptance",
    "price rejection", "multi timeframe conflict", "context gap",
  ],
  backtest_metric: [
    "sample size", "future leakage", "look ahead bias", "survivorship bias", "overfitting", "transaction cost",
    "slippage", "spread", "drawdown", "expectancy", "profit factor", "sharpe ratio", "sortino ratio",
    "max adverse excursion", "max favorable excursion", "walk forward", "out of sample", "regime shift",
    "data snooping", "cherry picking",
  ],
};

const taxonomyTypes = Object.keys(patternSeeds);
const patternTaxonomy = [];

for (let index = 0; patternTaxonomy.length < 5000; index += 1) {
  const type = taxonomyTypes[index % taxonomyTypes.length];
  const name = patternSeeds[type][Math.floor(index / taxonomyTypes.length) % patternSeeds[type].length];
  const source = sourceInventory[index % sourceInventory.length];
  patternTaxonomy.push({
    id: `pt_${String(index + 1).padStart(4, "0")}`,
    type,
    category: type.replace(/_/g, " "),
    name: `${name} ${Math.floor(index / (taxonomyTypes.length * patternSeeds[type].length)) + 1}`.trim(),
    aliases: [name, name.replace(/\s+/g, "_")],
    sourceIds: [source.id],
    educationUse: "Use as taxonomy cue for education-only explanation, not as a standalone decision rule.",
    commonMisread: "Learners may treat a label as complete analysis without checking location, timeframe, and context.",
    multiTimeframeRelevance: "Map D1 for background, H4 for structure, H1 for rhythm, and M15 for local detail.",
    boundaryNote: "Pattern taxonomy is for classification and teaching only; it must not become a trade direction or performance claim.",
  });
}

module.exports = {
  patternTaxonomy,
};
