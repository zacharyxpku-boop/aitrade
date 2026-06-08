const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const { config } = require("./config");

const sqlitePath = config.database.sqlitePath;
const seedPath = config.database.seedPath;

let db;

function openDb() {
  if (db) return db;
  db = new DatabaseSync(sqlitePath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      password_salt TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      plan TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS modules (
      position INTEGER PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      position INTEGER NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS knowledge_points (
      id TEXT PRIMARY KEY,
      position INTEGER NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS content_sources (
      id TEXT PRIMARY KEY,
      position INTEGER NOT NULL,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS content_processing_jobs (
      id TEXT PRIMARY KEY,
      content_source_id TEXT,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS replay_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS paper_trades (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      scenario_id TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS coach_review_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activation_intervention_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS learner_report_deliveries (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      status TEXT,
      category TEXT,
      priority TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS practice_assignments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      scenario_id TEXT,
      status TEXT,
      due_at TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cohorts (
      id TEXT PRIMARY KEY,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS course_packages (
      id TEXT PRIMARY KEY,
      status TEXT,
      version INTEGER,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS course_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      course_package_id TEXT,
      item_type TEXT,
      item_id TEXT,
      completed_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      course_package_id TEXT,
      cohort_id TEXT,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS course_package_assignments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      course_package_id TEXT,
      cohort_id TEXT,
      status TEXT,
      due_at TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS completion_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      course_package_id TEXT,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      count INTEGER NOT NULL,
      PRIMARY KEY (user_id, tag)
    );
    CREATE TABLE IF NOT EXISTS global_profile (
      tag TEXT PRIMARY KEY,
      count INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      type TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS open_source_reference_reviews (
      id TEXT PRIMARY KEY,
      reference_key TEXT,
      status TEXT,
      owner_email TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      plan TEXT,
      status TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      plan TEXT,
      status TEXT,
      current_period_end TEXT,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS billing_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT,
      created_at TEXT,
      value TEXT NOT NULL
    );
  `);
  const accountColumns = db.prepare("PRAGMA table_info(accounts)").all().map((row) => row.name);
  if (!accountColumns.includes("email_verified")) db.exec("ALTER TABLE accounts ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1");
  if (!accountColumns.includes("email_verification_token")) db.exec("ALTER TABLE accounts ADD COLUMN email_verification_token TEXT");
  if (!accountColumns.includes("created_at")) db.exec("ALTER TABLE accounts ADD COLUMN created_at TEXT");
  if (!accountColumns.includes("updated_at")) db.exec("ALTER TABLE accounts ADD COLUMN updated_at TEXT");
  if (!accountColumns.includes("last_login_at")) db.exec("ALTER TABLE accounts ADD COLUMN last_login_at TEXT");
  if (!accountColumns.includes("compliance_ack_at")) db.exec("ALTER TABLE accounts ADD COLUMN compliance_ack_at TEXT");
  if (!accountColumns.includes("compliance_version")) db.exec("ALTER TABLE accounts ADD COLUMN compliance_version TEXT");
  if (!accountColumns.includes("terms_version")) db.exec("ALTER TABLE accounts ADD COLUMN terms_version TEXT");
  if (!accountColumns.includes("privacy_version")) db.exec("ALTER TABLE accounts ADD COLUMN privacy_version TEXT");
  if (!accountColumns.includes("risk_disclosure_version")) db.exec("ALTER TABLE accounts ADD COLUMN risk_disclosure_version TEXT");
  if (!accountColumns.includes("legal_acceptance_at")) db.exec("ALTER TABLE accounts ADD COLUMN legal_acceptance_at TEXT");
  if (!accountColumns.includes("deletion_requested_at")) db.exec("ALTER TABLE accounts ADD COLUMN deletion_requested_at TEXT");
  if (!accountColumns.includes("deletion_completed_at")) db.exec("ALTER TABLE accounts ADD COLUMN deletion_completed_at TEXT");
  if (!accountColumns.includes("deletion_request_id")) db.exec("ALTER TABLE accounts ADD COLUMN deletion_request_id TEXT");
  if (!accountColumns.includes("account_status")) db.exec("ALTER TABLE accounts ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'");
  if (!accountColumns.includes("disabled_at")) db.exec("ALTER TABLE accounts ADD COLUMN disabled_at TEXT");
  if (!accountColumns.includes("disabled_reason")) db.exec("ALTER TABLE accounts ADD COLUMN disabled_reason TEXT");
  seedIfEmpty();
  return db;
}

function json(value) {
  return JSON.stringify(value ?? null);
}

function parse(value, fallback = null) {
  if (value == null) return fallback;
  return JSON.parse(value);
}

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM scenarios").get().count;
  if (count > 0) return;
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  writeDb(seed);
}

function getState(key, fallback) {
  const row = openDb().prepare("SELECT value FROM app_state WHERE key = ?").get(key);
  return row ? parse(row.value, fallback) : fallback;
}

function setState(tx, key, value) {
  tx.prepare("INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)").run(key, json(value));
}

function readDb() {
  const database = openDb();
  const accounts = database.prepare("SELECT * FROM accounts ORDER BY id").all().map((row) => ({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    name: row.name,
    role: row.role,
    plan: row.plan,
    emailVerified: Boolean(row.email_verified),
    emailVerificationToken: row.email_verification_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    complianceAckAt: row.compliance_ack_at,
    complianceVersion: row.compliance_version,
    termsVersion: row.terms_version,
    privacyVersion: row.privacy_version,
    riskDisclosureVersion: row.risk_disclosure_version,
    legalAcceptanceAt: row.legal_acceptance_at,
    deletionRequestedAt: row.deletion_requested_at,
    deletionCompletedAt: row.deletion_completed_at,
    deletionRequestId: row.deletion_request_id,
    accountStatus: row.account_status || "active",
    disabledAt: row.disabled_at,
    disabledReason: row.disabled_reason,
  }));
  const sessions = Object.fromEntries(database.prepare("SELECT token, value FROM sessions").all().map((row) => [row.token, parse(row.value)]));
  const passwordResets = database.prepare("SELECT value FROM password_resets ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const modules = database.prepare("SELECT value FROM modules ORDER BY position").all().map((row) => parse(row.value));
  const scenarios = database.prepare("SELECT value FROM scenarios ORDER BY position").all().map((row) => parse(row.value));
  const knowledgePoints = database.prepare("SELECT value FROM knowledge_points ORDER BY position").all().map((row) => parse(row.value));
  const contentSources = database.prepare("SELECT value FROM content_sources ORDER BY position").all().map((row) => parse(row.value));
  const contentProcessingJobs = database.prepare("SELECT value FROM content_processing_jobs ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const attempts = database.prepare("SELECT value FROM attempts ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const replayNotes = database.prepare("SELECT value FROM replay_notes ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const paperTrades = database.prepare("SELECT value FROM paper_trades ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const coachReviewTasks = database.prepare("SELECT value FROM coach_review_tasks ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const activationInterventionTasks = database.prepare("SELECT value FROM activation_intervention_tasks ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const learnerReportDeliveries = database.prepare("SELECT value FROM learner_report_deliveries ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const supportTickets = database.prepare("SELECT value FROM support_tickets ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const practiceAssignments = database.prepare("SELECT value FROM practice_assignments ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const cohorts = database.prepare("SELECT value FROM cohorts ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const coursePackages = database.prepare("SELECT value FROM course_packages ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const courseProgress = database.prepare("SELECT value FROM course_progress ORDER BY datetime(completed_at) DESC").all().map((row) => parse(row.value));
  const courseEnrollments = database.prepare("SELECT value FROM course_enrollments ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const coursePackageAssignments = database.prepare("SELECT value FROM course_package_assignments ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const completionReports = database.prepare("SELECT value FROM completion_reports ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const auditLogs = database.prepare("SELECT value FROM audit_logs ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const openSourceReferenceReviews = database.prepare("SELECT value FROM open_source_reference_reviews ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const orders = database.prepare("SELECT value FROM orders ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const subscriptions = database.prepare("SELECT value FROM subscriptions ORDER BY datetime(current_period_end) DESC").all().map((row) => parse(row.value));
  const billingEvents = database.prepare("SELECT value FROM billing_events ORDER BY datetime(created_at) DESC").all().map((row) => parse(row.value));
  const profiles = {};
  database.prepare("SELECT user_id, tag, count FROM profiles").all().forEach((row) => {
    profiles[row.user_id] ||= {};
    profiles[row.user_id][row.tag] = row.count;
  });
  const profile = {};
  database.prepare("SELECT tag, count FROM global_profile").all().forEach((row) => {
    profile[row.tag] = row.count;
  });
  return {
    user: getState("user", { id: "demo-user", name: "演示学员", plan: "Pro Trial", todayDone: 0, streakDays: 0, disciplineScore: null }),
    billing: getState("billing", { plans: [] }),
    ops: getState("ops", { publishChecklist: [] }),
    auditIntegritySeals: getState("auditIntegritySeals", []),
    readinessRemediationTasks: getState("readinessRemediationTasks", []),
    pilotSuccessActions: getState("pilotSuccessActions", []),
    pilotRenewalBriefs: getState("pilotRenewalBriefs", []),
    pilotRenewalBriefDeliveries: getState("pilotRenewalBriefDeliveries", []),
    cohortProcurementDeliveries: getState("cohortProcurementDeliveries", []),
    customerTrialPacketDeliveries: getState("customerTrialPacketDeliveries", []),
    customerTrialRoomShares: getState("customerTrialRoomShares", []),
    pilotExpansionPlans: getState("pilotExpansionPlans", []),
    pilotExpansionLaunchBriefs: getState("pilotExpansionLaunchBriefs", []),
    rosterImportHandoffs: getState("rosterImportHandoffs", []),
    learnerNextStepEvents: getState("learnerNextStepEvents", []),
    deletionRequests: getState("deletionRequests", []),
    educationModelRuns: getState("educationModelRuns", []),
    coachSessionBookings: getState("coachSessionBookings", []),
    publicPreviewSeedRuns: getState("publicPreviewSeedRuns", []),
    accounts,
    sessions,
    passwordResets,
    modules,
    scenarios,
    knowledgePoints,
    contentSources,
    contentProcessingJobs,
    attempts,
    replayNotes,
    paperTrades,
    coachReviewTasks,
    activationInterventionTasks,
    learnerReportDeliveries,
    supportTickets,
    practiceAssignments,
    cohorts,
    coursePackages,
    courseProgress,
    courseEnrollments,
    coursePackageAssignments,
    completionReports,
    profiles,
    profile,
    auditLogs,
    openSourceReferenceReviews,
    orders,
    subscriptions,
    billingEvents,
  };
}

function writeDb(next) {
  const database = openDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    database.exec(`
      DELETE FROM app_state;
      DELETE FROM accounts;
      DELETE FROM sessions;
      DELETE FROM password_resets;
      DELETE FROM modules;
      DELETE FROM scenarios;
      DELETE FROM knowledge_points;
      DELETE FROM content_sources;
      DELETE FROM content_processing_jobs;
      DELETE FROM attempts;
      DELETE FROM replay_notes;
      DELETE FROM paper_trades;
      DELETE FROM coach_review_tasks;
      DELETE FROM activation_intervention_tasks;
      DELETE FROM learner_report_deliveries;
      DELETE FROM support_tickets;
      DELETE FROM practice_assignments;
      DELETE FROM cohorts;
      DELETE FROM course_packages;
      DELETE FROM course_progress;
      DELETE FROM course_enrollments;
      DELETE FROM course_package_assignments;
      DELETE FROM completion_reports;
      DELETE FROM profiles;
      DELETE FROM global_profile;
      DELETE FROM audit_logs;
      DELETE FROM open_source_reference_reviews;
      DELETE FROM orders;
      DELETE FROM subscriptions;
      DELETE FROM billing_events;
    `);
    setState(database, "user", next.user);
    setState(database, "billing", next.billing);
    setState(database, "ops", next.ops);
    setState(database, "auditIntegritySeals", next.auditIntegritySeals || []);
    setState(database, "readinessRemediationTasks", next.readinessRemediationTasks || []);
    setState(database, "pilotSuccessActions", next.pilotSuccessActions || []);
    setState(database, "pilotRenewalBriefs", next.pilotRenewalBriefs || []);
    setState(database, "pilotRenewalBriefDeliveries", next.pilotRenewalBriefDeliveries || []);
    setState(database, "cohortProcurementDeliveries", next.cohortProcurementDeliveries || []);
    setState(database, "customerTrialPacketDeliveries", next.customerTrialPacketDeliveries || []);
    setState(database, "customerTrialRoomShares", next.customerTrialRoomShares || []);
    setState(database, "pilotExpansionPlans", next.pilotExpansionPlans || []);
    setState(database, "pilotExpansionLaunchBriefs", next.pilotExpansionLaunchBriefs || []);
    setState(database, "rosterImportHandoffs", next.rosterImportHandoffs || []);
    setState(database, "learnerNextStepEvents", next.learnerNextStepEvents || []);
    setState(database, "deletionRequests", next.deletionRequests || []);
    setState(database, "educationModelRuns", next.educationModelRuns || []);
    setState(database, "coachSessionBookings", next.coachSessionBookings || []);
    setState(database, "publicPreviewSeedRuns", next.publicPreviewSeedRuns || []);

    const insertAccount = database.prepare(`
      INSERT INTO accounts (
        id, email, password_hash, password_salt, name, role, plan,
        email_verified, email_verification_token, created_at, updated_at, last_login_at,
        compliance_ack_at, compliance_version, terms_version, privacy_version,
        risk_disclosure_version, legal_acceptance_at, deletion_requested_at,
        deletion_completed_at, deletion_request_id, account_status, disabled_at, disabled_reason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    (next.accounts || []).forEach((account) => {
      insertAccount.run(
        account.id,
        account.email,
        account.passwordHash || null,
        account.passwordSalt || null,
        account.name,
        account.role,
        account.plan,
        account.emailVerified === false ? 0 : 1,
        account.emailVerificationToken || null,
        account.createdAt || null,
        account.updatedAt || null,
        account.lastLoginAt || null,
        account.complianceAckAt || null,
        account.complianceVersion || null,
        account.termsVersion || null,
        account.privacyVersion || null,
        account.riskDisclosureVersion || null,
        account.legalAcceptanceAt || null,
        account.deletionRequestedAt || null,
        account.deletionCompletedAt || null,
        account.deletionRequestId || null,
        account.accountStatus || "active",
        account.disabledAt || null,
        account.disabledReason || null,
      );
    });

    const insertSession = database.prepare("INSERT INTO sessions (token, value, created_at) VALUES (?, ?, ?)");
    Object.entries(next.sessions || {}).forEach(([token, value]) => {
      insertSession.run(token, json(value), value.loggedInAt || new Date().toISOString());
    });

    const insertPasswordReset = database.prepare("INSERT INTO password_resets (token, user_id, email, expires_at, used_at, created_at, value) VALUES (?, ?, ?, ?, ?, ?, ?)");
    (next.passwordResets || []).forEach((item) => {
      insertPasswordReset.run(item.token, item.userId, item.email, item.expiresAt, item.usedAt || null, item.createdAt, json(item));
    });

    const insertModule = database.prepare("INSERT INTO modules (position, value) VALUES (?, ?)");
    (next.modules || []).forEach((item, index) => insertModule.run(index, json(item)));

    const insertScenario = database.prepare("INSERT INTO scenarios (id, position, value) VALUES (?, ?, ?)");
    (next.scenarios || []).forEach((item, index) => insertScenario.run(item.id, index, json(item)));

    const insertKnowledgePoint = database.prepare("INSERT INTO knowledge_points (id, position, value) VALUES (?, ?, ?)");
    (next.knowledgePoints || []).forEach((item, index) => insertKnowledgePoint.run(item.id, index, json(item)));

    const insertContentSource = database.prepare("INSERT INTO content_sources (id, position, status, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.contentSources || []).forEach((item, index) => insertContentSource.run(item.id, index, item.status || null, item.createdAt || null, json(item)));

    const insertContentProcessingJob = database.prepare("INSERT INTO content_processing_jobs (id, content_source_id, status, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.contentProcessingJobs || []).forEach((item) => insertContentProcessingJob.run(item.id, item.contentSourceId || null, item.status || null, item.createdAt || null, json(item)));

    const insertAttempt = database.prepare("INSERT INTO attempts (id, user_id, type, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.attempts || []).forEach((item) => insertAttempt.run(item.id, item.userId || null, item.type || null, item.createdAt || null, json(item)));

    const insertReplay = database.prepare("INSERT INTO replay_notes (id, user_id, created_at, value) VALUES (?, ?, ?, ?)");
    (next.replayNotes || []).forEach((item) => insertReplay.run(item.id, item.userId || null, item.createdAt || null, json(item)));

    const insertPaperTrade = database.prepare("INSERT INTO paper_trades (id, user_id, scenario_id, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.paperTrades || []).forEach((item) => insertPaperTrade.run(item.id, item.userId || null, item.scenarioId || null, item.createdAt || null, json(item)));

    const insertCoachReviewTask = database.prepare("INSERT INTO coach_review_tasks (id, user_id, status, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.coachReviewTasks || []).forEach((item) => insertCoachReviewTask.run(item.id, item.userId || null, item.status || null, item.createdAt || null, json(item)));

    const insertActivationInterventionTask = database.prepare("INSERT INTO activation_intervention_tasks (id, user_id, status, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.activationInterventionTasks || []).forEach((item) => insertActivationInterventionTask.run(item.id, item.userId || null, item.status || null, item.createdAt || null, json(item)));

    const insertLearnerReportDelivery = database.prepare("INSERT INTO learner_report_deliveries (id, user_id, status, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.learnerReportDeliveries || []).forEach((item) => insertLearnerReportDelivery.run(item.id, item.userId || null, item.status || null, item.createdAt || null, json(item)));

    const insertSupportTicket = database.prepare("INSERT INTO support_tickets (id, user_id, status, category, priority, created_at, value) VALUES (?, ?, ?, ?, ?, ?, ?)");
    (next.supportTickets || []).forEach((item) => insertSupportTicket.run(item.id, item.userId || null, item.status || null, item.category || null, item.priority || null, item.createdAt || null, json(item)));

    const insertPracticeAssignment = database.prepare("INSERT INTO practice_assignments (id, user_id, scenario_id, status, due_at, created_at, value) VALUES (?, ?, ?, ?, ?, ?, ?)");
    (next.practiceAssignments || []).forEach((item) => insertPracticeAssignment.run(item.id, item.userId || null, item.scenarioId || null, item.status || null, item.dueAt || null, item.createdAt || null, json(item)));

    const insertCohort = database.prepare("INSERT INTO cohorts (id, status, created_at, value) VALUES (?, ?, ?, ?)");
    (next.cohorts || []).forEach((item) => insertCohort.run(item.id, item.status || null, item.createdAt || null, json(item)));

    const insertCoursePackage = database.prepare("INSERT INTO course_packages (id, status, version, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.coursePackages || []).forEach((item) => insertCoursePackage.run(item.id, item.status || null, item.version || 1, item.createdAt || null, json(item)));

    const insertCourseProgress = database.prepare("INSERT INTO course_progress (id, user_id, course_package_id, item_type, item_id, completed_at, value) VALUES (?, ?, ?, ?, ?, ?, ?)");
    (next.courseProgress || []).forEach((item) => insertCourseProgress.run(item.id, item.userId || null, item.coursePackageId || null, item.itemType || null, item.itemId || null, item.completedAt || null, json(item)));

    const insertCourseEnrollment = database.prepare("INSERT INTO course_enrollments (id, user_id, course_package_id, cohort_id, status, created_at, value) VALUES (?, ?, ?, ?, ?, ?, ?)");
    (next.courseEnrollments || []).forEach((item) => insertCourseEnrollment.run(item.id, item.userId || null, item.coursePackageId || null, item.cohortId || null, item.status || null, item.createdAt || null, json(item)));

    const insertCoursePackageAssignment = database.prepare("INSERT INTO course_package_assignments (id, user_id, course_package_id, cohort_id, status, due_at, created_at, value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    (next.coursePackageAssignments || []).forEach((item) => insertCoursePackageAssignment.run(item.id, item.userId || null, item.coursePackageId || null, item.cohortId || null, item.status || null, item.dueAt || null, item.createdAt || null, json(item)));

    const insertCompletionReport = database.prepare("INSERT INTO completion_reports (id, user_id, course_package_id, status, created_at, value) VALUES (?, ?, ?, ?, ?, ?)");
    (next.completionReports || []).forEach((item) => insertCompletionReport.run(item.id, item.userId || null, item.coursePackageId || null, item.status || null, item.createdAt || null, json(item)));

    const insertProfile = database.prepare("INSERT INTO profiles (user_id, tag, count) VALUES (?, ?, ?)");
    Object.entries(next.profiles || {}).forEach(([userId, tags]) => {
      Object.entries(tags).forEach(([tag, count]) => insertProfile.run(userId, tag, count));
    });

    const insertGlobalProfile = database.prepare("INSERT INTO global_profile (tag, count) VALUES (?, ?)");
    Object.entries(next.profile || {}).forEach(([tag, count]) => insertGlobalProfile.run(tag, count));

    const insertAudit = database.prepare("INSERT INTO audit_logs (id, type, created_at, value) VALUES (?, ?, ?, ?)");
    (next.auditLogs || []).forEach((item) => insertAudit.run(item.id, item.type || null, item.createdAt || null, json(item)));

    const insertOpenSourceReferenceReview = database.prepare("INSERT INTO open_source_reference_reviews (id, reference_key, status, owner_email, created_at, value) VALUES (?, ?, ?, ?, ?, ?)");
    (next.openSourceReferenceReviews || []).forEach((item) => {
      insertOpenSourceReferenceReview.run(item.id, item.referenceKey || null, item.status || null, item.ownerEmail || null, item.createdAt || null, json(item));
    });

    const insertOrder = database.prepare("INSERT INTO orders (id, user_id, plan, status, created_at, value) VALUES (?, ?, ?, ?, ?, ?)");
    (next.orders || []).forEach((item) => insertOrder.run(item.id, item.userId || null, item.plan || null, item.status || null, item.createdAt || null, json(item)));

    const insertSubscription = database.prepare("INSERT INTO subscriptions (id, user_id, plan, status, current_period_end, value) VALUES (?, ?, ?, ?, ?, ?)");
    (next.subscriptions || []).forEach((item) => insertSubscription.run(item.id, item.userId || null, item.plan || null, item.status || null, item.currentPeriodEnd || null, json(item)));

    const insertBillingEvent = database.prepare("INSERT INTO billing_events (id, user_id, type, created_at, value) VALUES (?, ?, ?, ?, ?)");
    (next.billingEvents || []).forEach((item) => insertBillingEvent.run(item.id, item.userId || null, item.type || null, item.createdAt || null, json(item)));

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

module.exports = {
  readDb,
  writeDb,
  sqlitePath,
};
