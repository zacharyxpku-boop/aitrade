const path = require("node:path");

const root = __dirname;

function env(name, fallback = "") {
  return process.env[name] || fallback;
}

function boolEnv(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function filePathEnv(name, fallback) {
  const value = env(name, fallback);
  return path.isAbsolute(value) ? value : path.join(root, value);
}

const config = {
  app: {
    env: env("APP_ENV", "local"),
    baseUrl: env("APP_BASE_URL", "http://localhost:4273"),
    port: Number(env("PORT", "4273")),
    cookieSecure: boolEnv("COOKIE_SECURE", false),
  },
  database: {
    sqlitePath: filePathEnv("TRADEGYM_SQLITE_PATH", path.join("data", "tradegym.sqlite")),
    seedPath: filePathEnv("TRADEGYM_SEED_PATH", path.join("data", "db.json")),
  },
  aiCoach: {
    provider: env("AI_COACH_PROVIDER", "mock"),
    apiKey: env("AI_COACH_API_KEY", ""),
    model: env("AI_COACH_MODEL", ""),
  },
  email: {
    provider: env("EMAIL_PROVIDER", "local"),
    from: env("EMAIL_FROM", "no-reply@tradegym.local"),
    exposeLocalTokens: boolEnv("EMAIL_EXPOSE_LOCAL_TOKENS", true),
  },
  payment: {
    provider: env("PAYMENT_PROVIDER", "local"),
    webhookSecretConfigured: Boolean(env("PAYMENT_WEBHOOK_SECRET", "")),
  },
  marketData: {
    provider: env("MARKET_DATA_PROVIDER", "demo"),
  },
  news: {
    provider: env("NEWS_PROVIDER", "demo"),
  },
  questionGenerator: {
    provider: env("QUESTION_GENERATOR_PROVIDER", "rule-based"),
  },
  knowledgeDistiller: {
    provider: env("KNOWLEDGE_DISTILLER_PROVIDER", "rule-based"),
  },
  audit: {
    immutableLedger: boolEnv("AUDIT_IMMUTABLE_LEDGER", false),
  },
};

function readiness() {
  const checks = [
    {
      key: "appBaseUrl",
      ok: Boolean(config.app.baseUrl),
      mode: config.app.env,
      message: "Application base URL is configured.",
    },
    {
      key: "database",
      ok: Boolean(config.database.sqlitePath),
      mode: "sqlite",
      message: "SQLite path is configured for local persistence.",
    },
    {
      key: "aiCoach",
      ok: config.aiCoach.provider !== "mock" && Boolean(process.env.AI_COACH_API_KEY),
      mode: config.aiCoach.provider,
      message: config.aiCoach.provider === "mock"
        ? "AI coach is running in mock fallback mode."
        : "External AI coach provider requires AI_COACH_API_KEY.",
      productionRequired: true,
    },
    {
      key: "email",
      ok: config.email.provider !== "local" && Boolean(process.env.EMAIL_API_KEY),
      mode: config.email.provider,
      message: config.email.provider === "local"
        ? "Email is local simulated; verification/reset tokens may be exposed for demo."
        : "Production email provider requires EMAIL_API_KEY.",
      productionRequired: true,
    },
    {
      key: "payment",
      ok: config.payment.provider !== "local" && config.payment.webhookSecretConfigured,
      mode: config.payment.provider,
      message: config.payment.provider === "local"
        ? "Payment is local simulated; no real money is processed."
        : "Production payment provider requires webhook signature verification.",
      productionRequired: true,
    },
    {
      key: "marketData",
      ok: config.marketData.provider !== "demo" && Boolean(process.env.MARKET_DATA_API_KEY),
      mode: config.marketData.provider,
      message: config.marketData.provider === "demo"
        ? "Market data is demo-only teaching data, not licensed live market data."
        : "External market data provider requires MARKET_DATA_API_KEY and license review.",
      productionRequired: true,
    },
    {
      key: "news",
      ok: config.news.provider !== "demo" && Boolean(process.env.NEWS_API_KEY),
      mode: config.news.provider,
      message: config.news.provider === "demo"
        ? "News and sentiment are demo-only teaching context."
        : "External news provider requires NEWS_API_KEY, attribution, and license review.",
      productionRequired: true,
    },
    {
      key: "questionGenerator",
      ok: config.questionGenerator.provider !== "rule-based" && Boolean(process.env.QUESTION_GENERATOR_API_KEY),
      mode: config.questionGenerator.provider,
      message: config.questionGenerator.provider === "rule-based"
        ? "Question generation uses deterministic teaching templates."
        : "External question generator requires review before publishing.",
      productionRequired: true,
    },
    {
      key: "knowledgeDistiller",
      ok: config.knowledgeDistiller.provider !== "rule-based" && Boolean(process.env.KNOWLEDGE_DISTILLER_API_KEY),
      mode: config.knowledgeDistiller.provider,
      message: config.knowledgeDistiller.provider === "rule-based"
        ? "Knowledge distillation uses deterministic teaching templates."
        : "External knowledge distiller requires KNOWLEDGE_DISTILLER_API_KEY and curriculum review.",
      productionRequired: true,
    },
    {
      key: "audit",
      ok: config.audit.immutableLedger,
      mode: config.audit.immutableLedger ? "immutable" : "local",
      message: config.audit.immutableLedger
        ? "Audit log is marked immutable by configuration."
        : "Audit log is local operational logging, not an immutable ledger.",
      productionRequired: true,
    },
  ];
  return {
    generatedAt: new Date().toISOString(),
    app: config.app,
    providers: {
      aiCoach: config.aiCoach.provider,
      email: config.email.provider,
      payment: config.payment.provider,
      marketData: config.marketData.provider,
      news: config.news.provider,
      questionGenerator: config.questionGenerator.provider,
      knowledgeDistiller: config.knowledgeDistiller.provider,
      auditImmutableLedger: config.audit.immutableLedger,
    },
    productionReady: checks.every((check) => check.ok && (!check.productionRequired || check.ok)),
    checks,
  };
}

module.exports = {
  config,
  readiness,
};
