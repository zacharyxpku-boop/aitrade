const state = {
  view: "dashboard",
  scenarioIndex: 0,
  selected: null,
  replayStep: 8,
  generatedDraft: null,
  selectedContentSourceId: null,
  adminCoursePackages: [],
  data: null,
  trialAccessPending: false,
  trialAccessPromise: null,
};

const nodes = {
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewTitle: document.querySelector("#viewTitle"),
  todayDone: document.querySelector("#todayDone"),
  streakDays: document.querySelector("#streakDays"),
  disciplineScore: document.querySelector("#disciplineScore"),
  habitStatus: document.querySelector("#habitStatus"),
  moduleGrid: document.querySelector("#moduleGrid"),
  refreshCourseCatalog: document.querySelector("#refreshCourseCatalog"),
  courseCatalogList: document.querySelector("#courseCatalogList"),
  lessonTag: document.querySelector("#lessonTag"),
  scenarioTitle: document.querySelector("#scenarioTitle"),
  symbolLabel: document.querySelector("#symbolLabel"),
  timeframeLabel: document.querySelector("#timeframeLabel"),
  chart: document.querySelector("#candleChart"),
  technicalContext: document.querySelector("#technicalContext"),
  newsContext: document.querySelector("#newsContext"),
  sentimentContext: document.querySelector("#sentimentContext"),
  sourceDisclosure: document.querySelector("#sourceDisclosure"),
  questionText: document.querySelector("#questionText"),
  options: document.querySelector("#options"),
  planInput: document.querySelector("#planInput"),
  submitBtn: document.querySelector("#submitBtn"),
  feedbackPanel: document.querySelector("#feedbackPanel"),
  feedbackTitle: document.querySelector("#feedbackTitle"),
  feedbackBody: document.querySelector("#feedbackBody"),
  scoreStructure: document.querySelector("#scoreStructure"),
  scoreContext: document.querySelector("#scoreContext"),
  scoreRisk: document.querySelector("#scoreRisk"),
  mistakeTags: document.querySelector("#mistakeTags"),
  nextBtn: document.querySelector("#nextBtn"),
  trainingResultActions: document.querySelector("#trainingResultActions"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  replayTitle: document.querySelector("#replayTitle"),
  replayChart: document.querySelector("#replayChart"),
  replayPrev: document.querySelector("#replayPrev"),
  replayNext: document.querySelector("#replayNext"),
  replayReset: document.querySelector("#replayReset"),
  replayPlan: document.querySelector("#replayPlan"),
  saveReplayPlan: document.querySelector("#saveReplayPlan"),
  paperTradeSide: document.querySelector("#paperTradeSide"),
  paperTradeRisk: document.querySelector("#paperTradeRisk"),
  paperTradeThesis: document.querySelector("#paperTradeThesis"),
  paperTradeInvalidation: document.querySelector("#paperTradeInvalidation"),
  paperTradeContext: document.querySelector("#paperTradeContext"),
  submitPaperTrade: document.querySelector("#submitPaperTrade"),
  paperTradeResult: document.querySelector("#paperTradeResult"),
  paperTradeLog: document.querySelector("#paperTradeLog"),
  refreshEvidenceIntegrity: document.querySelector("#refreshEvidenceIntegrity"),
  evidenceIntegrityPanel: document.querySelector("#evidenceIntegrityPanel"),
  refreshBacktestClassroom: document.querySelector("#refreshBacktestClassroom"),
  backtestClassroomPanel: document.querySelector("#backtestClassroomPanel"),
  backtestMisconceptionPanel: document.querySelector("#backtestMisconceptionPanel"),
  exportBacktestLiteracyJson: document.querySelector("#exportBacktestLiteracyJson"),
  exportBacktestLiteracyCsv: document.querySelector("#exportBacktestLiteracyCsv"),
  exportBacktestLiteracyMd: document.querySelector("#exportBacktestLiteracyMd"),
  refreshContextClassroom: document.querySelector("#refreshContextClassroom"),
  contextClassroomPanel: document.querySelector("#contextClassroomPanel"),
  contextMisconceptionPanel: document.querySelector("#contextMisconceptionPanel"),
  refreshSourceClassroom: document.querySelector("#refreshSourceClassroom"),
  sourceClassroomPanel: document.querySelector("#sourceClassroomPanel"),
  sourceMisconceptionPanel: document.querySelector("#sourceMisconceptionPanel"),
  profileTags: document.querySelector("#profileTags"),
  nextPathText: document.querySelector("#nextPathText"),
  learningPathPanel: document.querySelector("#learningPathPanel"),
  attemptLog: document.querySelector("#attemptLog"),
  refreshLearnerCoursePath: document.querySelector("#refreshLearnerCoursePath"),
  learnerCoursePathList: document.querySelector("#learnerCoursePathList"),
  refreshCoachReport: document.querySelector("#refreshCoachReport"),
  coachReportPanel: document.querySelector("#coachReportPanel"),
  refreshProgressReport: document.querySelector("#refreshProgressReport"),
  progressReportPanel: document.querySelector("#progressReportPanel"),
  refreshCoachSessionBookings: document.querySelector("#refreshCoachSessionBookings"),
  requestCoachSession: document.querySelector("#requestCoachSession"),
  coachSessionTopic: document.querySelector("#coachSessionTopic"),
  coachSessionWindow: document.querySelector("#coachSessionWindow"),
  coachSessionGoal: document.querySelector("#coachSessionGoal"),
  coachSessionBookingStatus: document.querySelector("#coachSessionBookingStatus"),
  coachSessionBookingList: document.querySelector("#coachSessionBookingList"),
  refreshAssignments: document.querySelector("#refreshAssignments"),
  assignmentList: document.querySelector("#assignmentList"),
  coachReviewList: document.querySelector("#coachReviewList"),
  refreshSupportTickets: document.querySelector("#refreshSupportTickets"),
  supportCategory: document.querySelector("#supportCategory"),
  supportSubject: document.querySelector("#supportSubject"),
  supportMessage: document.querySelector("#supportMessage"),
  createSupportTicket: document.querySelector("#createSupportTicket"),
  supportTicketStatus: document.querySelector("#supportTicketStatus"),
  supportTicketList: document.querySelector("#supportTicketList"),
  opsMetrics: document.querySelector("#opsMetrics"),
  activationFunnelList: document.querySelector("#activationFunnelList"),
  refreshActivationInterventions: document.querySelector("#refreshActivationInterventions"),
  activationInterventionList: document.querySelector("#activationInterventionList"),
  refreshMetrics: document.querySelector("#refreshMetrics"),
  refreshRevenueOps: document.querySelector("#refreshRevenueOps"),
  revenueOpsStatus: document.querySelector("#revenueOpsStatus"),
  revenueOpsList: document.querySelector("#revenueOpsList"),
  refreshRevenueOpsActions: document.querySelector("#refreshRevenueOpsActions"),
  revenueOpsActionList: document.querySelector("#revenueOpsActionList"),
  refreshReadiness: document.querySelector("#refreshReadiness"),
  readinessStatus: document.querySelector("#readinessStatus"),
  readinessGrid: document.querySelector("#readinessGrid"),
  createReadinessTasks: document.querySelector("#createReadinessTasks"),
  readinessRemediationList: document.querySelector("#readinessRemediationList"),
  refreshDataSources: document.querySelector("#refreshDataSources"),
  refreshDatasetManifest: document.querySelector("#refreshDatasetManifest"),
  exportDatasetManifestMd: document.querySelector("#exportDatasetManifestMd"),
  refreshOpenSourceMap: document.querySelector("#refreshOpenSourceMap"),
  refreshOpenSourceReviews: document.querySelector("#refreshOpenSourceReviews"),
  exportOpenSourceMapCsv: document.querySelector("#exportOpenSourceMapCsv"),
  exportOpenSourceMapMd: document.querySelector("#exportOpenSourceMapMd"),
  dataSourceStatus: document.querySelector("#dataSourceStatus"),
  dataSourceGrid: document.querySelector("#dataSourceGrid"),
  dataGovernanceQueue: document.querySelector("#dataGovernanceQueue"),
  refreshTeachingEvolutionLab: document.querySelector("#refreshTeachingEvolutionLab"),
  teachingEvolutionLabStatus: document.querySelector("#teachingEvolutionLabStatus"),
  teachingEvolutionLabList: document.querySelector("#teachingEvolutionLabList"),
  refreshReviewQueue: document.querySelector("#refreshReviewQueue"),
  refreshAuditLog: document.querySelector("#refreshAuditLog"),
  refreshAdminUsers: document.querySelector("#refreshAdminUsers"),
  adminUserSearch: document.querySelector("#adminUserSearch"),
  adminUserStatusFilter: document.querySelector("#adminUserStatusFilter"),
  adminUserRoleFilter: document.querySelector("#adminUserRoleFilter"),
  adminUserStatus: document.querySelector("#adminUserStatus"),
  adminUserList: document.querySelector("#adminUserList"),
  refreshCoachConsole: document.querySelector("#refreshCoachConsole"),
  exportEvidencePacketsJson: document.querySelector("#exportEvidencePacketsJson"),
  exportEvidencePacketsCsv: document.querySelector("#exportEvidencePacketsCsv"),
  coachConsoleSearch: document.querySelector("#coachConsoleSearch"),
  coachConsoleStatus: document.querySelector("#coachConsoleStatus"),
  educationServiceHealthPanel: document.querySelector("#educationServiceHealthPanel"),
  learningActionOutcomePanel: document.querySelector("#learningActionOutcomePanel"),
  learningActionQueueList: document.querySelector("#learningActionQueueList"),
  coachConsoleList: document.querySelector("#coachConsoleList"),
  coachProgressReportPanel: document.querySelector("#coachProgressReportPanel"),
  bulkContextRiskFollowups: document.querySelector("#bulkContextRiskFollowups"),
  bulkChartEvidenceFollowups: document.querySelector("#bulkChartEvidenceFollowups"),
  bulkLearningActionQueue: document.querySelector("#bulkLearningActionQueue"),
  createServiceSlaActions: document.querySelector("#createServiceSlaActions"),
  bulkServiceFollowups: document.querySelector("#bulkServiceFollowups"),
  refreshServiceDelivery: document.querySelector("#refreshServiceDelivery"),
  serviceDeliveryStatus: document.querySelector("#serviceDeliveryStatus"),
  serviceDeliveryList: document.querySelector("#serviceDeliveryList"),
  exportSupportSlaJson: document.querySelector("#exportSupportSlaJson"),
  exportSupportSlaCsv: document.querySelector("#exportSupportSlaCsv"),
  exportSupportSlaMd: document.querySelector("#exportSupportSlaMd"),
  refreshAdminSupportTickets: document.querySelector("#refreshAdminSupportTickets"),
  adminSupportSearch: document.querySelector("#adminSupportSearch"),
  adminSupportStatus: document.querySelector("#adminSupportStatus"),
  adminSupportStatusText: document.querySelector("#adminSupportStatusText"),
  adminSupportTicketList: document.querySelector("#adminSupportTicketList"),
  refreshAdminCoachSessions: document.querySelector("#refreshAdminCoachSessions"),
  adminCoachSessionSearch: document.querySelector("#adminCoachSessionSearch"),
  adminCoachSessionStatus: document.querySelector("#adminCoachSessionStatus"),
  adminCoachSessionStatusText: document.querySelector("#adminCoachSessionStatusText"),
  adminCoachSessionList: document.querySelector("#adminCoachSessionList"),
  refreshCoachTasks: document.querySelector("#refreshCoachTasks"),
  coachTaskList: document.querySelector("#coachTaskList"),
  exportLearningRecordsJson: document.querySelector("#exportLearningRecordsJson"),
  exportLearningRecordsCsv: document.querySelector("#exportLearningRecordsCsv"),
  exportLearningRecordsMd: document.querySelector("#exportLearningRecordsMd"),
  refreshRosterHandoffs: document.querySelector("#refreshRosterHandoffs"),
  viewRosterOnboardingProgress: document.querySelector("#viewRosterOnboardingProgress"),
  exportRosterOnboardingProgressCsv: document.querySelector("#exportRosterOnboardingProgressCsv"),
  exportRosterOnboardingProgressMd: document.querySelector("#exportRosterOnboardingProgressMd"),
  viewProcurementProgress: document.querySelector("#viewProcurementProgress"),
  exportProcurementProgressCsv: document.querySelector("#exportProcurementProgressCsv"),
  exportProcurementProgressMd: document.querySelector("#exportProcurementProgressMd"),
  exportProcurementProgressMeetingBrief: document.querySelector("#exportProcurementProgressMeetingBrief"),
  createProcurementMeetingActions: document.querySelector("#createProcurementMeetingActions"),
  refreshCohorts: document.querySelector("#refreshCohorts"),
  cohortName: document.querySelector("#cohortName"),
  cohortMembers: document.querySelector("#cohortMembers"),
  createCohort: document.querySelector("#createCohort"),
  rosterImportRows: document.querySelector("#rosterImportRows"),
  importRoster: document.querySelector("#importRoster"),
  cohortStatus: document.querySelector("#cohortStatus"),
  cohortList: document.querySelector("#cohortList"),
  rosterHandoffList: document.querySelector("#rosterHandoffList"),
  auditTypeFilter: document.querySelector("#auditTypeFilter"),
  auditUserFilter: document.querySelector("#auditUserFilter"),
  auditStatusFilter: document.querySelector("#auditStatusFilter"),
  auditFromFilter: document.querySelector("#auditFromFilter"),
  auditToFilter: document.querySelector("#auditToFilter"),
  refreshAuditIntegrity: document.querySelector("#refreshAuditIntegrity"),
  sealAuditIntegrity: document.querySelector("#sealAuditIntegrity"),
  auditIntegrityStatus: document.querySelector("#auditIntegrityStatus"),
  exportAuditJson: document.querySelector("#exportAuditJson"),
  exportAuditCsv: document.querySelector("#exportAuditCsv"),
  auditLog: document.querySelector("#auditLog"),
  aiCoachStatus: document.querySelector("#aiCoachStatus"),
  reviewQueue: document.querySelector("#reviewQueue"),
  refreshEducationModelRuns: document.querySelector("#refreshEducationModelRuns"),
  exportEducationModelRunsJson: document.querySelector("#exportEducationModelRunsJson"),
  exportEducationModelRunsCsv: document.querySelector("#exportEducationModelRunsCsv"),
  educationModelRunStatus: document.querySelector("#educationModelRunStatus"),
  educationModelRunList: document.querySelector("#educationModelRunList"),
  refreshScenarioReviews: document.querySelector("#refreshScenarioReviews"),
  scenarioReviewStatus: document.querySelector("#scenarioReviewStatus"),
  scenarioReviewList: document.querySelector("#scenarioReviewList"),
  publishChecklist: document.querySelector("#publishChecklist"),
  accountPlan: document.querySelector("#accountPlan"),
  loginDemo: document.querySelector("#loginDemo"),
  logoutDemo: document.querySelector("#logoutDemo"),
  friendStartLogin: document.querySelector("#friendStartLogin"),
  friendCheckProvider: document.querySelector("#friendCheckProvider"),
  friendProviderStatus: document.querySelector("#friendProviderStatus"),
  friendFeedbackConfusing: document.querySelector("#friendFeedbackConfusing"),
  friendFeedbackHelpful: document.querySelector("#friendFeedbackHelpful"),
  friendFeedbackContinue: document.querySelector("#friendFeedbackContinue"),
  friendSubmitFeedback: document.querySelector("#friendSubmitFeedback"),
  friendFeedbackStatus: document.querySelector("#friendFeedbackStatus"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginSubmit: document.querySelector("#loginSubmit"),
  loginStatus: document.querySelector("#loginStatus"),
  registerName: document.querySelector("#registerName"),
  registerEmail: document.querySelector("#registerEmail"),
  registerPassword: document.querySelector("#registerPassword"),
  legalAcceptance: document.querySelector("#legalAcceptance"),
  registerSubmit: document.querySelector("#registerSubmit"),
  verifyToken: document.querySelector("#verifyToken"),
  verifyEmailSubmit: document.querySelector("#verifyEmailSubmit"),
  resetEmail: document.querySelector("#resetEmail"),
  resetRequest: document.querySelector("#resetRequest"),
  resetToken: document.querySelector("#resetToken"),
  resetPassword: document.querySelector("#resetPassword"),
  resetConfirm: document.querySelector("#resetConfirm"),
  exportAccountData: document.querySelector("#exportAccountData"),
  deleteAccountReason: document.querySelector("#deleteAccountReason"),
  requestAccountDeletion: document.querySelector("#requestAccountDeletion"),
  accountLifecycleStatus: document.querySelector("#accountLifecycleStatus"),
  contentSourceTitle: document.querySelector("#contentSourceTitle"),
  contentSourceType: document.querySelector("#contentSourceType"),
  contentSourceText: document.querySelector("#contentSourceText"),
  createContentSource: document.querySelector("#createContentSource"),
  createChartScreenshotIntake: document.querySelector("#createChartScreenshotIntake"),
  processContentSource: document.querySelector("#processContentSource"),
  runContentPipelineDemo: document.querySelector("#runContentPipelineDemo"),
  refreshContentSources: document.querySelector("#refreshContentSources"),
  contentSourceStatus: document.querySelector("#contentSourceStatus"),
  contentSourceList: document.querySelector("#contentSourceList"),
  refreshContentJobs: document.querySelector("#refreshContentJobs"),
  contentJobStatus: document.querySelector("#contentJobStatus"),
  contentJobList: document.querySelector("#contentJobList"),
  knowledgeTitle: document.querySelector("#knowledgeTitle"),
  knowledgeSource: document.querySelector("#knowledgeSource"),
  distillKnowledge: document.querySelector("#distillKnowledge"),
  knowledgeStatus: document.querySelector("#knowledgeStatus"),
  knowledgeList: document.querySelector("#knowledgeList"),
  refreshCoursePackages: document.querySelector("#refreshCoursePackages"),
  coursePackageTitle: document.querySelector("#coursePackageTitle"),
  coursePackagePrice: document.querySelector("#coursePackagePrice"),
  createCoursePackage: document.querySelector("#createCoursePackage"),
  coursePackageStatus: document.querySelector("#coursePackageStatus"),
  coursePackageList: document.querySelector("#coursePackageList"),
  cmsTitle: document.querySelector("#cmsTitle"),
  cmsTag: document.querySelector("#cmsTag"),
  cmsQuestion: document.querySelector("#cmsQuestion"),
  cmsOptions: document.querySelector("#cmsOptions"),
  generateScenarioDraft: document.querySelector("#generateScenarioDraft"),
  publishScenario: document.querySelector("#publishScenario"),
  publishStatus: document.querySelector("#publishStatus"),
  entitlementGrid: document.querySelector("#entitlementGrid"),
  refreshEntitlement: document.querySelector("#refreshEntitlement"),
  buyCoachReviewAddon: document.querySelector("#buyCoachReviewAddon"),
  cancelSubscription: document.querySelector("#cancelSubscription"),
  requestRefund: document.querySelector("#requestRefund"),
  billingStatus: document.querySelector("#billingStatus"),
  subscriptionPanel: document.querySelector("#subscriptionPanel"),
  orderLog: document.querySelector("#orderLog"),
  refreshReceipts: document.querySelector("#refreshReceipts"),
  receiptLog: document.querySelector("#receiptLog"),
  refreshRevenueLedger: document.querySelector("#refreshRevenueLedger"),
  revenueLedger: document.querySelector("#revenueLedger"),
  refreshBillingCompliance: document.querySelector("#refreshBillingCompliance"),
  billingComplianceQueue: document.querySelector("#billingComplianceQueue"),
  refreshProductReadiness: document.querySelector("#refreshProductReadiness"),
  exportReadinessEvidenceJson: document.querySelector("#exportReadinessEvidenceJson"),
  exportReadinessEvidenceCsv: document.querySelector("#exportReadinessEvidenceCsv"),
  exportPilotHandoffJson: document.querySelector("#exportPilotHandoffJson"),
  exportPilotHandoffCsv: document.querySelector("#exportPilotHandoffCsv"),
  exportPilotRenewalJson: document.querySelector("#exportPilotRenewalJson"),
  exportPilotRenewalCsv: document.querySelector("#exportPilotRenewalCsv"),
  exportPilotRenewalMd: document.querySelector("#exportPilotRenewalMd"),
  exportPilotExpansionJson: document.querySelector("#exportPilotExpansionJson"),
  exportPilotExpansionCsv: document.querySelector("#exportPilotExpansionCsv"),
  exportPilotExpansionMd: document.querySelector("#exportPilotExpansionMd"),
  exportPrototypeScorecardJson: document.querySelector("#exportPrototypeScorecardJson"),
  exportPrototypeScorecardCsv: document.querySelector("#exportPrototypeScorecardCsv"),
  exportPrototypeScorecardMd: document.querySelector("#exportPrototypeScorecardMd"),
  exportTrialKickoffJson: document.querySelector("#exportTrialKickoffJson"),
  exportTrialKickoffCsv: document.querySelector("#exportTrialKickoffCsv"),
  exportTrialKickoffMd: document.querySelector("#exportTrialKickoffMd"),
  createTrialKickoffActions: document.querySelector("#createTrialKickoffActions"),
  exportTrialRoomJson: document.querySelector("#exportTrialRoomJson"),
  exportTrialRoomCsv: document.querySelector("#exportTrialRoomCsv"),
  exportTrialRoomMd: document.querySelector("#exportTrialRoomMd"),
  exportTrialRoomProgressMd: document.querySelector("#exportTrialRoomProgressMd"),
  sendTrialRoom: document.querySelector("#sendTrialRoom"),
  exportLaunchOpsJson: document.querySelector("#exportLaunchOpsJson"),
  exportLaunchOpsCsv: document.querySelector("#exportLaunchOpsCsv"),
  exportLaunchOpsMd: document.querySelector("#exportLaunchOpsMd"),
  createLaunchOpsActions: document.querySelector("#createLaunchOpsActions"),
  exportCustomerTrialJson: document.querySelector("#exportCustomerTrialJson"),
  exportCustomerTrialCsv: document.querySelector("#exportCustomerTrialCsv"),
  exportCustomerTrialMd: document.querySelector("#exportCustomerTrialMd"),
  sendCustomerTrialPacket: document.querySelector("#sendCustomerTrialPacket"),
  exportNextStepEngagementJson: document.querySelector("#exportNextStepEngagementJson"),
  exportNextStepEngagementCsv: document.querySelector("#exportNextStepEngagementCsv"),
  exportNextStepEngagementMd: document.querySelector("#exportNextStepEngagementMd"),
  savePilotExpansionLaunchBrief: document.querySelector("#savePilotExpansionLaunchBrief"),
  createPilotRenewalBrief: document.querySelector("#createPilotRenewalBrief"),
  savePilotExpansionPlan: document.querySelector("#savePilotExpansionPlan"),
  createPilotSuccessActions: document.querySelector("#createPilotSuccessActions"),
  productReadinessStatus: document.querySelector("#productReadinessStatus"),
  productReadinessList: document.querySelector("#productReadinessList"),
  complianceStatus: document.querySelector("#complianceStatus"),
  complianceChecklist: document.querySelector("#complianceChecklist"),
  acknowledgeCompliance: document.querySelector("#acknowledgeCompliance"),
  onboardingStatus: document.querySelector("#onboardingStatus"),
  onboardingSteps: document.querySelector("#onboardingSteps"),
  onboardingNext: document.querySelector("#onboardingNext"),
  refreshNotifications: document.querySelector("#refreshNotifications"),
  notificationStatus: document.querySelector("#notificationStatus"),
  notificationList: document.querySelector("#notificationList"),
  refreshAchievements: document.querySelector("#refreshAchievements"),
  achievementStatus: document.querySelector("#achievementStatus"),
  achievementList: document.querySelector("#achievementList"),
};

const viewMeta = {
  dashboard: ["用户试用", "先看学习流程，不看收益"],
  curriculum: ["课程路径", "交易学习框架"],
  trainer: ["第一步", "K 线训练"],
  replay: ["第二步", "历史回放和回测误区"],
  coach: ["第三步", "AI 复盘和学习反馈"],
  community: ["最后一步", "反馈和教育支持"],
  billing: ["本地演示", "订阅包装预览"],
  ops: ["管理员", "试用检查台"],
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "API request failed");
  }
  return payload;
}

async function loadBootstrap({ render = true } = {}) {
  state.data = await api("/api/bootstrap");
  if (render) renderAll();
}

async function ensureTrialAccess({ redirect = false } = {}) {
  if (state.data?.session) {
    if (!state.data?.compliance?.acknowledged) {
      await acknowledgeCompliance();
      await loadBootstrap();
    }
    if (redirect) setView("trainer");
    return state.data.session;
  }
  if (!state.trialAccessPromise) {
    state.trialAccessPending = true;
    setTrialEntryPending(true);
    state.trialAccessPromise = (async () => {
      await loginTrialAccount();
      if (!state.data?.compliance?.acknowledged) {
        await acknowledgeCompliance();
        await loadBootstrap({ render: false });
      }
      if (!state.data?.session) {
        throw new Error("试用会话没有建立成功，请刷新后重试。");
      }
      renderAll();
      if (nodes.habitStatus) {
        nodes.habitStatus.textContent = "已进入试用模式。直接按训练、回放、AI复盘、回测误区、反馈走完即可。";
      }
      return state.data.session;
    })().finally(() => {
      state.trialAccessPending = false;
      state.trialAccessPromise = null;
      setTrialEntryPending(false);
    });
  }
  const session = await state.trialAccessPromise;
  if (redirect) setView("trainer");
  return session;
}

function setTrialEntryPending(isPending) {
  [nodes.loginDemo, nodes.friendStartLogin].forEach((button) => {
    if (!button) return;
    button.disabled = isPending;
    button.textContent = isPending ? "正在进入试用..." : "一键进入试用";
  });
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("is-active"));
  document.querySelector(`#${view}View`)?.classList.add("is-active");
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === view);
  });
  const [eyebrow, title] = viewMeta[view];
  nodes.viewEyebrow.textContent = eyebrow;
  nodes.viewTitle.textContent = title;
  if (view === "ops" && state.data?.session?.role === "admin") {
    renderOps();
  }
}

function currentScenario() {
  return state.data.scenarios[state.scenarioIndex];
}

function renderAll() {
  renderModules();
  refreshCourseCatalog();
  renderTrainer();
  renderReplay();
  renderPaperTrades();
  renderEvidenceIntegrity();
  renderBacktestClassroom();
  renderMarketContextClassroom();
  renderProfile();
  renderDashboard();
  renderOnboarding();
  renderNotifications();
  renderAchievements();
  renderCompliance();
  renderBilling();
  refreshFriendProviderStatus();
  refreshReceipts();
  renderEntitlement();
  renderLearningPath();
  renderLearnerCoursePath();
  renderCoachReport();
  renderProgressReport();
  renderCoachReviews();
  renderCoachSessionBookings();
  renderSupportTickets(state.data.supportTickets || []);
  renderAssignments();
  renderSession();
  refreshBacktestClassroom();
  refreshMarketContextClassroom();
  refreshSourceTransparencyClassroom();
  refreshEvidenceIntegrity();
  refreshCoachSessionBookings();
}

function renderModules() {
  nodes.moduleGrid.innerHTML = state.data.modules
    .map((item) => `
      <article class="card">
        <p class="eyebrow">${item.level}</p>
        <h3>${item.title}</h3>
        <p>${item.outcome}</p>
        <span class="badge">${item.lessons} lessons</span>
      </article>
    `)
    .join("");
}

async function refreshCourseCatalog() {
  if (!nodes.courseCatalogList) return;
  try {
    const result = await api("/api/course-packages");
    state.data.coursePackages = result.packages;
    state.data.courseEnrollments = result.enrollments;
    state.data.coursePackageAssignments = result.coursePackageAssignments;
    state.data.completionReports = result.completionReports;
    renderLearnerCoursePath();
    nodes.courseCatalogList.innerHTML = result.packages.length
      ? result.packages.map((item) => `
        <div class="attempt-row">
          <div>
            <strong>${item.title}</strong>
            <span>${item.access} / ${item.enrolled ? "enrolled" : "not enrolled"} / requires ${item.requiredPlan} / your plan ${item.learnerPlan}</span>
            <span>${item.coursePackageAssignment ? `Assigned ${formatTime(item.coursePackageAssignment.createdAt)}${item.coursePackageAssignment.dueAt ? ` / due ${item.coursePackageAssignment.dueAt}` : ""}` : "No teacher package assignment yet"}</span>
            <span>Progress ${item.progress.percent}% (${item.progress.completedItems}/${item.progress.totalItems})</span>
            <span>${item.completionReport ? `Completion report issued ${formatTime(item.completionReport.createdAt)} / risk discipline ${item.completionReport.practiceSummary.averageRiskDiscipline ?? "--"}` : "Completion report unlocks at 100% education progress"}</span>
            <span>Knowledge ${item.knowledgePoints.length}${item.lockedCounts.knowledgePoints ? ` + ${item.lockedCounts.knowledgePoints} locked` : ""}; scenarios ${item.scenarios.length}${item.lockedCounts.scenarios ? ` + ${item.lockedCounts.scenarios} locked` : ""}</span>
            <span>${item.knowledgePoints.map((kp) => kp.title).join(" / ") || "No preview knowledge point"}</span>
            <span>${item.constraints[1]}</span>
          </div>
          <div class="billing-actions">
            ${item.knowledgePoints.map((kp) => `<button type="button" data-course-progress="knowledge" data-course-package-id="${item.id}" data-knowledge-point-id="${kp.id}">${item.progress.completedKnowledgePointIds.includes(kp.id) ? "Reviewed" : "Mark reviewed"}</button>`).join("")}
            <span class="tag ${item.canAccess ? "warn" : "danger"}">${item.canAccess ? "Full access" : "Upgrade"}</span>
          </div>
        </div>
      `).join("")
      : "<p>No published course packages yet.</p>";
  } catch (error) {
    nodes.courseCatalogList.innerHTML = `<p>Course packages require login: ${error.message}</p>`;
  }
}

async function markCourseKnowledgeReviewed(coursePackageId, knowledgePointId) {
  if (!nodes.courseCatalogList) return;
  try {
    await api("/api/course-packages/progress", {
      method: "POST",
      body: JSON.stringify({ coursePackageId, knowledgePointId }),
    });
    await refreshCourseCatalog();
    await refreshAssignments();
    renderLearnerCoursePath();
  } catch (error) {
    nodes.courseCatalogList.innerHTML = `<p>Could not update course progress: ${error.message}</p>`;
  }
}

function renderTrainer() {
  const lesson = currentScenario();
  state.selected = null;
  nodes.progressText.textContent = `${state.scenarioIndex + 1} / ${state.data.scenarios.length}`;
  nodes.progressBar.style.width = `${((state.scenarioIndex + 1) / state.data.scenarios.length) * 100}%`;
  nodes.lessonTag.textContent = lesson.tag;
  nodes.scenarioTitle.textContent = lesson.title;
  nodes.symbolLabel.textContent = lesson.symbol;
  nodes.timeframeLabel.textContent = lesson.timeframe;
  nodes.technicalContext.textContent = lesson.technical;
  nodes.newsContext.textContent = lesson.news;
  nodes.sentimentContext.textContent = lesson.sentiment;
  if (nodes.sourceDisclosure) nodes.sourceDisclosure.textContent = lesson.sourceTransparency?.learnerLabel || "Education-only teaching context; not a live signal or recommendation.";
  nodes.questionText.textContent = lesson.question;
  nodes.planInput.value = "";
  nodes.feedbackPanel.hidden = true;
  if (nodes.trainingResultActions) nodes.trainingResultActions.innerHTML = "";
  renderOptions(lesson);
  renderCandles(nodes.chart, lesson.candles);
}

function renderOptions(lesson) {
  nodes.options.innerHTML = "";
  lesson.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.setAttribute("aria-pressed", "false");
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    button.addEventListener("click", () => {
      state.selected = index;
      document.querySelectorAll(".option-btn").forEach((item) => item.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
    });
    nodes.options.appendChild(button);
  });
}

function renderCandles(target, candles) {
  const width = 760;
  const height = 340;
  const padding = 28;
  const values = candles.flat();
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scaleY = (value) => height - padding - ((value - min) / (max - min)) * (height - padding * 2);
  const step = (width - padding * 2) / candles.length;
  const bodyWidth = Math.max(7, step * 0.52);
  const grid = Array.from({ length: 5 }, (_, index) => {
    const y = padding + index * ((height - padding * 2) / 4);
    return `<line x1="${padding}" x2="${width - padding}" y1="${y}" y2="${y}" stroke="#e5e9e1" />`;
  }).join("");
  const bars = candles
    .map(([open, high, low, close], index) => {
      const x = padding + index * step + step / 2;
      const yHigh = scaleY(high);
      const yLow = scaleY(low);
      const yOpen = scaleY(open);
      const yClose = scaleY(close);
      const color = close >= open ? "#20885b" : "#b7473f";
      const bodyY = Math.min(yOpen, yClose);
      const bodyH = Math.max(3, Math.abs(yClose - yOpen));
      return `
        <line x1="${x}" x2="${x}" y1="${yHigh}" y2="${yLow}" stroke="${color}" stroke-width="2" />
        <rect x="${x - bodyWidth / 2}" y="${bodyY}" width="${bodyWidth}" height="${bodyH}" rx="2" fill="${color}" />
      `;
    })
    .join("");
  target.setAttribute("viewBox", `0 0 ${width} ${height}`);
  target.innerHTML = `${grid}${bars}`;
}

async function submitDecision() {
  if (state.selected === null) {
    nodes.planInput.focus();
    nodes.planInput.placeholder = "先选择一个判断，再写一句理由、止损或观望条件。";
    return;
  }
  nodes.submitBtn.disabled = true;
  try {
    await ensureTrialAccess();
    const lesson = currentScenario();
    const result = await api("/api/attempts", {
      method: "POST",
      body: JSON.stringify({
        scenarioId: lesson.id,
        selectedIndex: state.selected,
        plan: nodes.planInput.value.trim(),
      }),
    });
    state.data.user = result.user;
    state.data.profile = result.profile;
    state.data.attempts = result.attempts;
    state.data.practiceAssignments = result.practiceAssignments || state.data.practiceAssignments;
    state.data.courseProgressUpdates = result.courseProgressUpdates || [];
    state.data.courseEnrollments = result.courseEnrollments || state.data.courseEnrollments;
    state.data.coursePackageAssignments = result.coursePackageAssignments || state.data.coursePackageAssignments;
    state.data.completionReports = result.completionReports || state.data.completionReports;
    state.data.onboarding = result.onboarding || state.data.onboarding;
    state.data.habit = result.habit || state.data.habit;
    state.data.achievements = result.achievements || state.data.achievements;
    state.data.entitlement = result.entitlement;
    state.data.learningPath = result.learningPath;
    renderFeedback(result.feedback, result.nextTraining, result.courseProgressUpdates || []);
    renderProfile();
    renderDashboard();
    renderOnboarding();
    renderAchievements();
    renderEntitlement();
    renderLearningPath();
    renderAssignments();
    await refreshNotifications();
    await refreshCourseCatalog();
    await refreshCoachReport();
    await refreshProgressReport();
  } catch (error) {
    nodes.feedbackPanel.hidden = false;
    nodes.feedbackTitle.textContent = "提交失败";
    nodes.feedbackBody.textContent = error.message === "Login required"
      ? "试用会话没有建立成功，请点页面顶部“一键进入试用”后重试。"
      : error.message;
  } finally {
    nodes.submitBtn.disabled = false;
  }
}

function renderFeedback(feedback, nextTraining = null, courseProgressUpdates = state.data.courseProgressUpdates || []) {
  const habit = state.data.habit || {};
  const achievements = state.data.achievements || {};
  const courseProgressHtml = courseProgressUpdates.length
    ? courseProgressUpdates.map((item) => `<span>Course progress: ${escapeHtml(item.coursePackageTitle)} ${item.progress?.percent ?? 0}% (${item.progress?.completedItems ?? 0}/${item.progress?.totalItems ?? 0})</span>`).join("")
    : "<span>No course package progress linked to this drill.</span>";
  const contextReviewHtml = feedback.contextReview
    ? `<span>Context discipline ${feedback.contextReview.score}: ${escapeHtml(feedback.contextReview.summary)}</span>`
    : "";
  nodes.feedbackTitle.textContent = feedback.title;
  nodes.feedbackBody.textContent = feedback.body;
  nodes.scoreStructure.textContent = `${feedback.scores[0]}`;
  nodes.scoreContext.textContent = `${feedback.scores[1]}`;
  nodes.scoreRisk.textContent = `${feedback.scores[2]}`;
  nodes.mistakeTags.innerHTML = feedback.tags
    .map((tag, index) => `<span class="tag ${index === 0 ? "danger" : "warn"}">${tag}</span>`)
    .join("");
  nodes.nextPathText.textContent = feedback.nextPath;
  if (nodes.trainingResultActions) {
    nodes.trainingResultActions.innerHTML = `
      <div class="attempt-row trial-next-row">
        <div>
          <strong>训练完成，下一步按顺序走</strong>
          <span>${feedback.nextPath}</span>
          <span>今日 ${habit.todayDone ?? 0}/${habit.dailyGoal || 3}，连续 ${habit.streakDays ?? 0} 天，状态 ${habit.status || "in_progress"}</span>
          <span>${achievements.latestUnlocked ? `新里程碑：${achievements.latestUnlocked.title}` : `里程碑 ${achievements.unlockedCount || 0}/${achievements.totalCount || 0}`}</span>
          ${contextReviewHtml}
          ${courseProgressHtml}
          <span>${nextTraining?.scenario ? `下一题：${nextTraining.scenario.title} / ${nextTraining.reason}` : "暂无下一题，先去回放和AI复盘。"}</span>
        </div>
        <span class="tag warn">只做教育训练</span>
      </div>
      <div class="trial-flow-actions">
        <button type="button" data-training-result-action="replay">去回放/回测误区</button>
        <button type="button" data-training-result-action="coach">看 AI 复盘</button>
        ${nextTraining?.scenario ? `<button type="button" data-training-result-action="next" data-scenario-id="${nextTraining.scenario.id}">再练一题</button>` : ""}
        <button type="button" data-training-result-action="feedback">提交反馈</button>
      </div>
    `;
  }
  nodes.feedbackPanel.hidden = false;
}

function renderReplay() {
  const lesson = currentScenario();
  const step = Math.max(4, Math.min(state.replayStep, lesson.candles.length));
  nodes.replayTitle.textContent = `${lesson.symbol} 回放 ${step}/${lesson.candles.length} 根K线`;
  renderCandles(nodes.replayChart, lesson.candles.slice(0, step));
}

function renderPaperTrades() {
  if (!nodes.paperTradeLog) return;
  const trades = state.data.paperTrades || [];
  nodes.paperTradeLog.innerHTML = trades.length
    ? trades.slice(0, 8).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${item.side} / ${item.scenarioTitle}</strong>
          <span>${formatTime(item.createdAt)} / ${item.evaluation.simulatedR}R / 风险 ${item.riskPercent}%</span>
          ${item.contextReview ? `<span>环境边界 ${item.contextReview.score}: ${escapeHtml(item.contextReview.summary)}</span>` : ""}
          ${item.replayDebrief ? `<span>回放复盘 ${item.replayDebrief.processScore}: ${escapeHtml(item.replayDebrief.decisionQuality)} / ${escapeHtml(item.replayDebrief.nextPractice?.[0] || "按同一张检查表再回放一次。")}</span>` : ""}
          <span>${item.evaluation.note}</span>
          ${item.replayDebrief ? `<div class="billing-actions"><button type="button" data-replay-debrief-followup="${escapeHtml(item.id)}">生成复盘跟进</button></div>` : ""}
        </div>
        <span class="tag ${item.evaluation.disciplineScore >= 70 ? "warn" : "danger"}">${item.evaluation.disciplineScore}</span>
      </div>
    `).join("")
    : "<p>还没有模拟记录。先在回放区保存一次教学模拟。</p>";
}

async function createReplayDebriefFollowup(paperTradeId) {
  if (!nodes.paperTradeResult || !paperTradeId) return;
  try {
    const result = await api("/api/admin/replay-debrief-followups", {
      method: "POST",
      body: JSON.stringify({
        paperTradeId,
        assignedCoachEmail: state.data?.account?.email || "coach@tradegym.local",
      }),
    });
    nodes.paperTradeResult.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Replay debrief coach follow-up ${result.reused ? "reused" : "created"}</strong>
            <span>${escapeHtml(result.task.focus || "Replay debrief follow-up")} / ${escapeHtml(result.task.priority || "normal")} / ${escapeHtml(result.task.status || "open")}</span>
            <span>Process ${result.task.replayDebrief?.processScore ?? "-"} / ${escapeHtml(result.task.replayDebrief?.decisionQuality || "review")}</span>
            <span>${escapeHtml(result.constraints?.[1] || "Coach follow-up reviews education process evidence only.")}</span>
          </div>
          <span class="tag warn">coach</span>
        </div>
      `
    );
    await refreshCoachReviews();
    await refreshCoachReport();
    await refreshProgressReport();
  } catch (error) {
    nodes.paperTradeResult.insertAdjacentHTML("afterbegin", `<p>Replay debrief follow-up failed: ${escapeHtml(error.message)}</p>`);
  }
}

function renderEvidenceIntegrity(audit = state.data.evidenceIntegrity) {
  if (!nodes.evidenceIntegrityPanel) return;
  if (!audit) {
    nodes.evidenceIntegrityPanel.innerHTML = "<p>完成训练和回放后，这里会检查学习证据是否完整。</p>";
    return;
  }
  const summary = audit.summary || {};
  const dimensions = audit.dimensions || [];
  nodes.evidenceIntegrityPanel.innerHTML = `
    <div class="score-grid">
      <div><span>状态</span><strong>${escapeHtml(summary.status || "unreviewed")}</strong></div>
      <div><span>薄弱项</span><strong>${summary.weakDimensions ?? 0}</strong></div>
      <div><span>图表训练</span><strong>${summary.trainingAttempts ?? 0}</strong></div>
      <div><span>模拟样本</span><strong>${summary.paperTradeSamples ?? 0}</strong></div>
    </div>
    ${dimensions.map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          ${(item.evidence || []).map((evidence) => `<span>${escapeHtml(evidence)}</span>`).join("")}
          <span>${escapeHtml(item.nextAction || "Continue education-only evidence collection.")}</span>
        </div>
        <span class="tag ${String(item.status || "").includes("needs") || String(item.status || "").includes("too_small") ? "danger" : "warn"}">${escapeHtml(item.status || "unreviewed")}</span>
      </div>
    `).join("")}
    <ol class="clean-list">${(audit.nextLearningActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
    <p class="muted-note">${escapeHtml(audit.constraints?.[1] || "Education audit only; no stock recommendation, live signal, or real-money trading instruction.")}</p>
  `;
}

async function refreshEvidenceIntegrity() {
  if (!nodes.evidenceIntegrityPanel) return;
  try {
    const result = await api("/api/learning/evidence-integrity");
    state.data.evidenceIntegrity = result.audit;
    renderEvidenceIntegrity(result.audit);
  } catch (error) {
    nodes.evidenceIntegrityPanel.innerHTML = `<p>证据检查暂时失败：${error.message}</p>`;
  }
}

function renderBacktestClassroom(classroom = state.data.backtestClassroom) {
  if (!nodes.backtestClassroomPanel) return;
  if (!classroom) {
    nodes.backtestClassroomPanel.innerHTML = "<p>先保存一次模拟记录，再检查回测指标是否被误读。</p>";
    renderBacktestMisconception(null);
    return;
  }
  const metrics = classroom.metrics || {};
  const setupDiagnostics = classroom.setupDiagnostics || [];
  const assumptions = classroom.simulationAssumptions || {};
  const friction = assumptions.frictionModel || {};
  const sampleModel = assumptions.sampleModel || {};
  const contextModel = assumptions.contextModel || {};
  const riskModel = assumptions.riskModel || {};
  const reliabilityAudit = classroom.reliabilityAudit || {};
  const assumptionChecklist = (assumptions.learnerChecklist || []).slice(0, 4);
  const literacyBrief = state.data.backtestLiteracyBrief;
  const literacyRows = (literacyBrief?.rows || []).slice(0, 4).map((item) => `
    <div class="mini-row">
      <span>${escapeHtml(item.section)} / ${escapeHtml(item.item)} / ${escapeHtml(item.status)}</span>
      <span>${escapeHtml(item.next || "")}</span>
    </div>
  `).join("");
  const setupDiagnosticsHtml = setupDiagnostics.length
    ? `
      <div class="section-kicker">Setup diagnostics</div>
      ${setupDiagnostics.slice(0, 5).map((item) => `
        <div class="attempt-row">
          <div>
            <strong>${escapeHtml(item.label || "general_practice")}</strong>
            <span>${item.sampleSize ?? 0} sample(s) / win rate ${item.winRatePct ?? 0}% / expectancy ${item.expectancyR ?? 0}R / drawdown ${item.maxDrawdownR ?? 0}R</span>
            <span>Average discipline: ${item.averageDiscipline ?? "not enough records"}</span>
            ${(item.warnings || []).map((warning) => `<span>${escapeHtml(warning)}</span>`).join("")}
          </div>
          <span class="tag warn">Pattern review</span>
        </div>
      `).join("")}
    `
    : "";
  nodes.backtestClassroomPanel.innerHTML = `
    <div class="score-grid">
      <div><span>样本</span><strong>${metrics.sampleSize ?? 0}</strong></div>
      <div><span>胜率</span><strong>${metrics.winRatePct ?? 0}%</strong></div>
      <div><span>期望</span><strong>${metrics.expectancyR ?? 0}R</strong></div>
      <div><span>回撤</span><strong>${metrics.maxDrawdownR ?? 0}R</strong></div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(classroom.sampleQuality || "practice_sample_only")}</strong>
        ${(classroom.interpretation || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        <span>${escapeHtml(classroom.constraints?.[2] || "Metrics are learning diagnostics, not future performance proof.")}</span>
      </div>
      <span class="tag warn">只做教育训练</span>
    </div>
    <div class="attempt-row">
      <div>
        <strong>回测可信度：${escapeHtml(reliabilityAudit.grade || "unreviewed")}</strong>
        ${(reliabilityAudit.interpretation || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        ${(reliabilityAudit.riskFlags || []).slice(0, 4).map((item) => `<span>Risk flag: ${escapeHtml(item)}</span>`).join("")}
        <span>${escapeHtml(reliabilityAudit.constraints?.[1] || "Reliability is education evidence quality only, not a signal or strategy score.")}</span>
      </div>
      <span class="tag danger">不是策略评分</span>
    </div>
    ${literacyBrief ? `
      <div class="attempt-row">
        <div>
          <strong>Backtest literacy brief</strong>
          <span>Sample ${literacyBrief.summary?.sampleSize || 0} / reliability ${escapeHtml(literacyBrief.summary?.reliabilityGrade || "unreviewed")} / risk flags ${literacyBrief.summary?.riskFlags || 0} / setup groups ${literacyBrief.summary?.setupGroups || 0}</span>
          ${(literacyBrief.learnerBrief || []).slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          <div class="mini-list">${literacyRows}</div>
          <span>${escapeHtml(literacyBrief.constraints?.[2] || "Metrics are education diagnostics, not strategy proof.")}</span>
        </div>
        <span class="tag warn">Metric literacy</span>
      </div>
    ` : ""}
    <div class="attempt-row">
      <div>
        <strong>模拟假设</strong>
        <span>${escapeHtml(assumptions.executionModel || "classroom replay")} / ${escapeHtml(assumptions.priceSource || "demo scenario candles")}</span>
        <span>Fees ${friction.feesIncluded ? "included" : "excluded"} / spread ${friction.spreadIncluded ? "included" : "excluded"} / slippage ${friction.slippageIncluded ? "included" : "excluded"} / partial fills ${friction.partialFillsIncluded ? "included" : "excluded"}</span>
        <span>Sample quality: ${escapeHtml(sampleModel.currentQuality || classroom.sampleQuality || "practice_sample_only")}; setup comparison needs ${sampleModel.minimumForSetupComparison ?? 20}+ records.</span>
        <span>${escapeHtml(contextModel.note || "News and sentiment are context boundaries, not trade permission.")}</span>
        <span>${escapeHtml(riskModel.note || "Risk metrics are classroom discipline checks, not real-money readiness.")}</span>
      </div>
      <span class="tag danger">不能实盘执行</span>
    </div>
    ${assumptionChecklist.length ? `<ol class="clean-list">${assumptionChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>` : ""}
    ${(reliabilityAudit.nextLearningActions || []).length ? `<ol class="clean-list">${reliabilityAudit.nextLearningActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>` : ""}
    ${setupDiagnosticsHtml}
    <ol class="clean-list">${(classroom.nextActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
  `;
  renderBacktestMisconception(classroom.misconceptionDrill);
}

async function refreshBacktestClassroom() {
  if (!nodes.backtestClassroomPanel) return;
  try {
    const result = await api("/api/backtest/classroom");
    const brief = await api("/api/backtest/literacy-brief");
    state.data.backtestClassroom = result.classroom;
    state.data.backtestLiteracyBrief = brief.brief;
    renderBacktestClassroom(result.classroom);
  } catch (error) {
    nodes.backtestClassroomPanel.innerHTML = `<p>回测误区练习暂时失败：${error.message}</p>`;
  }
}

async function exportBacktestLiteracyBrief(format) {
  if (!nodes.backtestClassroomPanel) return;
  try {
    const response = await fetch(`/api/backtest/literacy-brief/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Backtest literacy brief export failed");
    }
    const text = await response.text();
    nodes.backtestClassroomPanel.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Backtest literacy brief (${format.toUpperCase()})</strong>
            <span>Education metric-literacy export only. No stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money instruction.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2200))}</pre>
      `
    );
  } catch (error) {
    nodes.backtestClassroomPanel.insertAdjacentHTML("afterbegin", `<p>Backtest literacy export failed: ${escapeHtml(error.message)}</p>`);
  }
}

function renderBacktestMisconception(drill = state.data.backtestClassroom?.misconceptionDrill, feedback = null) {
  if (!nodes.backtestMisconceptionPanel) return;
  if (!drill) {
    nodes.backtestMisconceptionPanel.innerHTML = "";
    return;
  }
  nodes.backtestMisconceptionPanel.innerHTML = `
    <div class="attempt-row">
      <div>
        <strong>回测指标误区练习</strong>
        <span>${escapeHtml(drill.prompt)}</span>
        <span>${escapeHtml(drill.requiredPrinciple || "Backtest metrics are education diagnostics only.")}</span>
      </div>
      <span class="tag warn">不是信号</span>
    </div>
    <div class="option-grid">
      ${drill.options.map((option, index) => `
        <button type="button" data-backtest-drill-answer="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(option)}</button>
      `).join("")}
    </div>
    ${feedback ? `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(feedback.title)}</strong>
          <span>${escapeHtml(feedback.body)}</span>
          <span>${escapeHtml(feedback.nextStep)}</span>
        </div>
        <span class="tag warn">只做教育训练</span>
      </div>
    ` : ""}
  `;
}

async function submitBacktestMisconception(selectedIndex) {
  if (!nodes.backtestMisconceptionPanel) return;
  try {
    await ensureTrialAccess();
    const result = await api("/api/backtest/misconception-attempts", {
      method: "POST",
      body: JSON.stringify({ selectedIndex }),
    });
    state.data.profile = result.profile;
    state.data.attempts = result.attempts;
    state.data.backtestClassroom = result.classroom;
    state.data.courseProgressUpdates = result.courseProgressUpdates || [];
    state.data.coursePackageAssignments = result.coursePackageAssignments || state.data.coursePackageAssignments;
    state.data.completionReports = result.completionReports || state.data.completionReports;
    renderBacktestClassroom(result.classroom);
    renderBacktestMisconception(result.classroom.misconceptionDrill, result.feedback);
    renderProfile();
    renderDashboard();
    await refreshCourseCatalog();
    renderLearnerCoursePath();
    await refreshCoachReport();
    await refreshProgressReport();
  } catch (error) {
    nodes.backtestMisconceptionPanel.innerHTML += `<p>${error.message}</p>`;
  }
}

function renderMarketContextClassroom(classroom = state.data.marketContextClassroom) {
  if (!nodes.contextClassroomPanel) return;
  if (!classroom) {
    nodes.contextClassroomPanel.innerHTML = "<p>完成图表训练后，这里会检查你有没有把消息/情绪当成买卖信号。</p>";
    renderContextMisconception(null);
    return;
  }
  const coverage = classroom.coverage || {};
  const riskSummary = classroom.riskSummary || {};
  const contextRiskItems = (riskSummary.riskItems || []).filter((item) => Number(item.count || 0) > 0).slice(0, 3);
  nodes.contextClassroomPanel.innerHTML = `
    <div class="score-grid">
      <div><span>场景</span><strong>${coverage.approvedScenarios ?? 0}</strong></div>
      <div><span>环境练习</span><strong>${coverage.contextAttempts ?? 0}</strong></div>
      <div><span>边界薄弱</span><strong>${coverage.weakBoundaryAttempts ?? 0}</strong></div>
      <div><span>环境分</span><strong>${coverage.averageContextDiscipline ?? "-"}</strong></div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>消息和情绪是背景，不是信号</strong>
        ${(classroom.interpretation || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        <span>${escapeHtml(classroom.constraints?.[1] || "No stock recommendation, live signal, or market prediction.")}</span>
      </div>
      <span class="tag warn">不是信号</span>
    </div>
    <div class="attempt-row">
      <div>
        <strong>环境风险总结</strong>
        <span>${escapeHtml(riskSummary.operatingStatus || "needs_context_evidence")} / wrong misconception attempts ${riskSummary.wrongMisconceptionAttempts ?? 0}</span>
        ${riskSummary.dominantRisk ? `<span>Dominant risk: ${escapeHtml(riskSummary.dominantRisk.label)} - ${escapeHtml(riskSummary.dominantRisk.educationResponse)}</span>` : "<span>No dominant context-risk pattern yet; keep collecting education evidence.</span>"}
        ${(riskSummary.coachActions || []).slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        <span>${escapeHtml(riskSummary.constraints?.[1] || "Not sentiment scoring, market prediction, signal, or recommendation.")}</span>
      </div>
      <span class="tag danger">不是预测</span>
    </div>
    ${contextRiskItems.length ? `
      <div class="section-kicker">Observed context risks</div>
      ${contextRiskItems.map((item) => `
        <div class="attempt-row">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${item.count} observed item(s)</span>
            <span>${escapeHtml(item.educationResponse)}</span>
          </div>
          <span class="tag warn">Coach cue</span>
        </div>
      `).join("")}
    ` : ""}
    <ol class="clean-list">${(classroom.nextActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
  `;
  renderContextMisconception(classroom.drill);
}

async function refreshMarketContextClassroom() {
  if (!nodes.contextClassroomPanel) return;
  try {
    const result = await api("/api/context/classroom");
    state.data.marketContextClassroom = result.classroom;
    renderMarketContextClassroom(result.classroom);
  } catch (error) {
    nodes.contextClassroomPanel.innerHTML = `<p>消息/情绪检查暂时失败：${error.message}</p>`;
  }
}

function renderContextMisconception(drill = state.data.marketContextClassroom?.drill, feedback = null) {
  if (!nodes.contextMisconceptionPanel) return;
  if (!drill) {
    nodes.contextMisconceptionPanel.innerHTML = "";
    return;
  }
  nodes.contextMisconceptionPanel.innerHTML = `
    <div class="attempt-row">
      <div>
        <strong>消息/情绪误区练习</strong>
        <span>${escapeHtml(drill.prompt)}</span>
        <span>${escapeHtml(drill.requiredPrinciple || "Market context is a learning input, not a trading signal.")}</span>
      </div>
      <span class="tag warn">只做教育训练</span>
    </div>
    <div class="option-grid">
      ${drill.options.map((option, index) => `
        <button type="button" data-context-drill-answer="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(option)}</button>
      `).join("")}
    </div>
    ${feedback ? `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(feedback.title)}</strong>
          <span>${escapeHtml(feedback.body)}</span>
          <span>${escapeHtml(feedback.nextStep)}</span>
        </div>
        <span class="tag warn">只做教育训练</span>
      </div>
    ` : ""}
  `;
}

async function submitContextMisconception(selectedIndex) {
  if (!nodes.contextMisconceptionPanel) return;
  try {
    await ensureTrialAccess();
    const result = await api("/api/context/misconception-attempts", {
      method: "POST",
      body: JSON.stringify({ selectedIndex }),
    });
    state.data.profile = result.profile;
    state.data.attempts = result.attempts;
    state.data.marketContextClassroom = result.classroom;
    renderMarketContextClassroom(result.classroom);
    renderContextMisconception(result.classroom.drill, result.feedback);
    renderProfile();
    renderDashboard();
    await refreshCoachReport();
    await refreshProgressReport();
  } catch (error) {
    nodes.contextMisconceptionPanel.innerHTML += `<p>${error.message}</p>`;
  }
}

function renderSourceTransparencyClassroom(classroom = state.data.sourceTransparencyClassroom) {
  if (!nodes.sourceClassroomPanel) return;
  if (!classroom) {
    nodes.sourceClassroomPanel.innerHTML = "<p>刷新后检查数据来源标签，避免把演示数据误当真实信号。</p>";
    renderSourceMisconception(null);
    return;
  }
  const coverage = classroom.coverage || {};
  nodes.sourceClassroomPanel.innerHTML = `
    <div class="score-grid">
      <div><span>场景</span><strong>${coverage.approvedScenarios ?? 0}</strong></div>
      <div><span>演示标签</span><strong>${coverage.demoScenarios ?? 0}</strong></div>
      <div><span>内部演示</span><strong>${coverage.internalDemoLicenses ?? 0}</strong></div>
      <div><span>边界薄弱</span><strong>${coverage.weakSourceBoundaryAttempts ?? 0}</strong></div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>来源标签是安全边界，不是信号</strong>
        ${(classroom.interpretation || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        <span>${escapeHtml(classroom.constraints?.[1] || "Demo labels are not recommendations, live signals, or production data licenses.")}</span>
      </div>
      <span class="tag warn">不是信号</span>
    </div>
    <ol class="clean-list">${(classroom.nextActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
  `;
  renderSourceMisconception(classroom.drill);
}

async function refreshSourceTransparencyClassroom() {
  if (!nodes.sourceClassroomPanel) return;
  try {
    const result = await api("/api/source-transparency/classroom");
    state.data.sourceTransparencyClassroom = result.classroom;
    renderSourceTransparencyClassroom(result.classroom);
  } catch (error) {
    nodes.sourceClassroomPanel.innerHTML = `<p>来源检查暂时失败：${escapeHtml(error.message)}</p>`;
  }
}

function renderSourceMisconception(drill = state.data.sourceTransparencyClassroom?.drill, feedback = null) {
  if (!nodes.sourceMisconceptionPanel) return;
  if (!drill) {
    nodes.sourceMisconceptionPanel.innerHTML = "";
    return;
  }
  nodes.sourceMisconceptionPanel.innerHTML = `
    <div class="attempt-row">
      <div>
        <strong>来源标签误区练习</strong>
        <span>${escapeHtml(drill.prompt)}</span>
        <span>${escapeHtml(drill.requiredPrinciple || "Source labels are safety boundaries, not signals.")}</span>
      </div>
      <span class="tag warn">只做教育训练</span>
    </div>
    <div class="option-grid">
      ${drill.options.map((option, index) => `
        <button type="button" data-source-drill-answer="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(option)}</button>
      `).join("")}
    </div>
    ${feedback ? `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(feedback.title)}</strong>
          <span>${escapeHtml(feedback.body)}</span>
          <span>${escapeHtml(feedback.nextStep)}</span>
        </div>
        <span class="tag warn">只做教育训练</span>
      </div>
    ` : ""}
  `;
}

async function submitSourceMisconception(selectedIndex) {
  if (!nodes.sourceMisconceptionPanel) return;
  try {
    await ensureTrialAccess();
    const result = await api("/api/source-transparency/misconception-attempts", {
      method: "POST",
      body: JSON.stringify({ selectedIndex }),
    });
    state.data.profile = result.profile;
    state.data.attempts = result.attempts;
    state.data.sourceTransparencyClassroom = result.classroom;
    state.data.courseProgressUpdates = result.courseProgressUpdates || [];
    state.data.coursePackageAssignments = result.coursePackageAssignments || state.data.coursePackageAssignments;
    state.data.completionReports = result.completionReports || state.data.completionReports;
    renderSourceTransparencyClassroom(result.classroom);
    renderSourceMisconception(result.classroom.drill, result.feedback);
    renderProfile();
    renderDashboard();
    await refreshCourseCatalog();
    renderLearnerCoursePath();
    await refreshCoachReport();
    await refreshProgressReport();
  } catch (error) {
    nodes.sourceMisconceptionPanel.innerHTML += `<p>${escapeHtml(error.message)}</p>`;
  }
}

function renderProfile() {
  const entries = Object.entries(state.data.profile).sort((a, b) => b[1] - a[1]);
  nodes.profileTags.innerHTML = entries.length
    ? entries.map(([tag, count], index) => `<span class="tag ${index < 2 ? "danger" : "warn"}">${tag} x${count}</span>`).join("")
    : '<span class="tag">No profile yet</span>';
  nodes.attemptLog.innerHTML = state.data.attempts.length
    ? state.data.attempts.map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${item.title}</strong>
          <span>${formatTime(item.createdAt)} / ${item.selectedText || item.type}</span>
        </div>
        <span class="tag ${item.correct ? "warn" : "danger"}">${item.correct ? "Framework ok" : "Needs correction"}</span>
      </div>
    `).join("")
    : '<p>No training records yet. Complete daily practice to build a user profile.</p>';
}

function renderLearningPath(path = state.data.learningPath) {
  if (!nodes.learningPathPanel) return;
  if (!path) {
    nodes.learningPathPanel.innerHTML = "<p>Complete one training task to generate a learning path.</p>";
    return;
  }
  nodes.nextPathText.textContent = path.recommendedKnowledgePoint
    ? path.recommendedKnowledgePoint.learningObjective
    : path.nextActions?.[0] || "Complete one training task to generate a learning path.";
  nodes.learningPathPanel.innerHTML = `
    <div class="attempt-row">
      <div>
        <strong>Focus: ${path.focus}</strong>
        <span>Level ${path.level} / education-only recommendation</span>
      </div>
      <span class="tag warn">No signals</span>
    </div>
    ${path.recommendedKnowledgePoint ? `
      <div class="attempt-row">
        <div>
          <strong>${path.recommendedKnowledgePoint.title}</strong>
          <span>${path.recommendedKnowledgePoint.learningObjective}</span>
        </div>
        <span class="tag">Knowledge</span>
      </div>
    ` : ""}
    ${path.recommendedScenario ? `
      <div class="attempt-row">
        <div>
          <strong>${path.recommendedScenario.title}</strong>
          <span>${path.recommendedScenario.tag}</span>
        </div>
        <span class="tag">Practice</span>
      </div>
    ` : ""}
    <ol class="clean-list">${(path.nextActions || []).map((item) => `<li>${item}</li>`).join("")}</ol>
  `;
}

function learnerCoursePathItems() {
  const packages = state.data.coursePackages || [];
  const active = packages.filter((item) => item.enrolled || item.coursePackageAssignment || item.progress?.completedItems > 0);
  return active.length ? active : packages.filter((item) => item.canAccess).slice(0, 2);
}

function renderLearnerCoursePath() {
  if (!nodes.learnerCoursePathList) return;
  const items = learnerCoursePathItems();
  nodes.learnerCoursePathList.innerHTML = items.length
    ? items.map((item) => {
      const nextKnowledge = (item.knowledgePoints || []).find((kp) => !(item.progress?.completedKnowledgePointIds || []).includes(kp.id));
      const nextScenario = (item.scenarios || []).find((scenario) => !(item.progress?.completedScenarioIds || []).includes(scenario.id));
      const nextBacktestDrill = (item.backtestDrills || []).find((drill) => !(item.progress?.completedBacktestDrillIds || []).includes(drill.id));
      const nextContextDrill = (item.contextDrills || []).find((drill) => !(item.progress?.completedContextDrillIds || []).includes(drill.id));
      const nextSourceDrill = (item.sourceTransparencyDrills || []).find((drill) => !(item.progress?.completedSourceTransparencyDrillIds || []).includes(drill.id));
      return `
        <div class="attempt-row">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${item.progress?.percent || 0}% complete / ${item.progress?.completedItems || 0} of ${item.progress?.totalItems || 0}</span>
            <span>${item.coursePackageAssignment ? `Teacher assigned ${formatTime(item.coursePackageAssignment.createdAt)}` : item.enrolled ? "Enrolled learning product" : "Available course package"}</span>
            <span>${nextKnowledge ? `Next knowledge: ${escapeHtml(nextKnowledge.title)}` : "All visible knowledge reviewed."}</span>
            <span>${nextScenario ? `Next drill: ${escapeHtml(nextScenario.title)}` : "No visible drill remaining."}</span>
            <span>${nextBacktestDrill ? `Next metric drill: ${escapeHtml(nextBacktestDrill.title)}` : "Backtest metric drill complete."}</span>
            <span>${nextContextDrill ? `Next context drill: ${escapeHtml(nextContextDrill.title)}` : "Market context drill complete."}</span>
            <span>${nextSourceDrill ? `Next source label drill: ${escapeHtml(nextSourceDrill.title)}` : "Source transparency drill complete."}</span>
            <span>${escapeHtml(item.constraints?.[1] || "Education-only; no signals or real-money trading.")}</span>
          </div>
          <div class="billing-actions">
            ${nextKnowledge ? `<button type="button" data-course-progress="knowledge" data-course-package-id="${escapeHtml(item.id)}" data-knowledge-point-id="${escapeHtml(nextKnowledge.id)}">Mark next knowledge reviewed</button>` : ""}
            ${nextScenario ? `<button type="button" data-course-scenario-id="${escapeHtml(nextScenario.id)}">Practice package drill</button>` : ""}
            ${nextBacktestDrill ? `<button type="button" data-course-backtest-drill="${escapeHtml(nextBacktestDrill.id)}">Open metric drill</button>` : ""}
            ${nextContextDrill ? `<button type="button" data-course-context-drill="${escapeHtml(nextContextDrill.id)}">Open context drill</button>` : ""}
            ${nextSourceDrill ? `<button type="button" data-course-source-drill="${escapeHtml(nextSourceDrill.id)}">Open source drill</button>` : ""}
            <span class="tag ${item.canAccess ? "warn" : "danger"}">${item.canAccess ? "Learning path" : "Preview"}</span>
          </div>
        </div>
      `;
    }).join("")
    : "<p>Login and refresh packages to see course package next steps.</p>";
}

async function refreshLearnerCoursePath() {
  await refreshCourseCatalog();
  renderLearnerCoursePath();
}

function renderCoachReport(report = state.data.coachReport) {
  if (!nodes.coachReportPanel) return;
  if (!report) {
    nodes.coachReportPanel.innerHTML = "<p>Login and complete practice to generate a coach report.</p>";
    return;
  }
  const topMistakes = report.topMistakes?.length
    ? report.topMistakes.map((item) => `<span class="tag danger">${item.tag} x${item.count}</span>`).join("")
    : '<span class="tag">No repeated mistake yet</span>';
  const riskFlags = report.riskFlags?.length
    ? report.riskFlags.map((item) => `<span class="tag warn">${item}</span>`).join("")
    : '<span class="tag warn">No major risk flag</span>';
  nodes.coachReportPanel.innerHTML = `
    <div class="attempt-row">
      <div>
        <strong>${report.learner?.name || "Learner"} / ${report.entitlement?.plan || "No plan"}</strong>
        <span>Training ${report.activity.trainingAttempts} / Replay ${report.activity.replayNotes} / Paper ${report.activity.paperTrades}</span>
        <span>Safety drills: metric ${report.activity.backtestMisconceptionAttempts || 0} / context ${report.activity.contextMisconceptionAttempts || 0} / source ${report.activity.sourceTransparencyMisconceptionAttempts || 0}</span>
        <span>Generated ${formatTime(report.generatedAt)}</span>
      </div>
      <span class="tag warn">Education only</span>
    </div>
    <div class="score-grid">
      <div><span>Risk discipline</span><strong>${report.discipline.averageRiskDiscipline ?? "--"}</strong></div>
      <div><span>Context discipline</span><strong>${report.discipline.averageContextDiscipline ?? "--"}</strong></div>
      <div><span>Paper discipline</span><strong>${report.discipline.averagePaperDiscipline ?? "--"}</strong></div>
      <div><span>Latest sim R</span><strong>${report.discipline.latestPaperTradeR ?? "--"}</strong></div>
    </div>
    <div class="profile-tags">${topMistakes}</div>
    <div class="profile-tags">${riskFlags}</div>
    <ol class="clean-list">${(report.nextActions || []).map((item) => `<li>${item}</li>`).join("")}</ol>
    <p class="muted-note">${report.constraints?.[0] || "No investment advice."}</p>
  `;
}

async function refreshCoachReport() {
  if (!nodes.coachReportPanel) return;
  try {
    const result = await api("/api/coach/report");
    state.data.coachReport = result.report;
    renderCoachReport(result.report);
  } catch (error) {
    nodes.coachReportPanel.innerHTML = `<p>Coach report requires login: ${error.message}</p>`;
  }
}

function renderLearningEvidencePacket(packet) {
  if (!packet) return "";
  const quality = packet.evidenceQuality?.length
    ? packet.evidenceQuality.slice(0, 6).map((item) => `<span class="tag ${item.includes("needs") || item.includes("small") ? "danger" : "warn"}">${escapeHtml(item)}</span>`).join("")
    : '<span class="tag">No evidence quality markers yet</span>';
  const setups = packet.setupDiagnostics?.length
    ? packet.setupDiagnostics.slice(0, 4).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.label || "general_practice")}</strong>
          <span>${item.sampleSize ?? 0} sample(s) / win rate ${item.winRatePct ?? 0}% / expectancy ${item.expectancyR ?? 0}R</span>
          <span>${escapeHtml(item.warnings?.[0] || "Setup evidence is for learning review only.")}</span>
        </div>
        <span class="tag warn">Setup evidence</span>
      </div>
    `).join("")
    : "<p>No setup evidence yet. Save paper trade journals with context boundaries.</p>";
  const paper = packet.latestPaperTrades?.length
    ? packet.latestPaperTrades.slice(0, 3).map((item) => `
      <span>${escapeHtml(item.scenarioTitle || "paper trade")} / ${escapeHtml(item.side || "watch")} / discipline ${item.disciplineScore ?? "--"} / context ${item.contextScore ?? "--"}</span>
    `).join("")
    : "<span>No paper trade journal evidence yet.</span>";
  const followups = packet.recentEvidenceFollowups?.length
    ? packet.recentEvidenceFollowups.slice(0, 3).map((item) => `
      <span>${escapeHtml(item.status || "open")} / ${escapeHtml(item.learnerStatus || "unread")} / ${escapeHtml(item.focus || "evidence follow-up")} / ${item.completedAt ? `completed ${formatTime(item.completedAt)}` : item.learnerRespondedAt ? `responded ${formatTime(item.learnerRespondedAt)}` : `created ${formatTime(item.createdAt)}`}${item.replayDebrief?.processScore != null ? ` / replay score ${item.replayDebrief.processScore}` : ""}${item.learnerResponse ? ` / learner: ${escapeHtml(item.learnerResponse)}` : ""}${item.nextEducationAction?.label ? ` / next: ${escapeHtml(item.nextEducationAction.label)}` : ""}${item.nextEducationActionAssignment ? ` / assignment ${escapeHtml(item.nextEducationActionAssignment.status || "assigned")}${item.nextEducationActionAssignment.completedAttemptId ? ` attempt ${escapeHtml(item.nextEducationActionAssignment.completedAttemptId)}` : ""}` : ""}${item.coachNote ? ` / coach: ${escapeHtml(item.coachNote)}` : ""}</span>
    `).join("")
    : "<span>No evidence follow-up task yet.</span>";
  const nextActionCandidates = packet.evidenceNextActionCandidates?.length
    ? packet.evidenceNextActionCandidates.slice(0, 3).map((item) => `
      <span>${escapeHtml(item.priority || "normal")} / ${escapeHtml(item.actionType || "education_action")} / ${escapeHtml(item.label || "Review learning evidence")} / ${escapeHtml(item.rationale || "Education workflow only.")}</span>
    `).join("")
    : "<span>No learner-response next action yet.</span>";
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Learning Evidence Packet</p>
        <h3>Coach-ready education evidence</h3>
      </div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(packet.schemaVersion || "learning-evidence-packet")}</strong>
        <span>Training ${packet.counts?.trainingAttempts ?? 0} / Replay ${packet.counts?.replayNotes ?? 0} / Paper ${packet.counts?.paperTrades ?? 0} / Setup groups ${packet.counts?.setupGroups ?? 0}</span>
        <span>Evidence follow-ups: ${packet.followUpSummary?.openEvidenceFollowups ?? 0} open / ${packet.followUpSummary?.respondedEvidenceFollowups ?? 0} learner response(s) / ${packet.followUpSummary?.completedEvidenceFollowups ?? 0} completed</span>
        <span>Replay debrief loop: ${packet.replayDebriefFollowupSummary?.replayDebriefFollowups ?? 0} task(s) / ${packet.replayDebriefFollowupSummary?.assignedReplayDebriefFollowups ?? 0} assigned / ${packet.replayDebriefFollowupSummary?.completedReplayDebriefAssignments ?? 0} assignment completed</span>
        <span>Risk ${packet.discipline?.averageRiskDiscipline ?? "--"} / Context ${packet.discipline?.averageContextDiscipline ?? "--"} / Human coach ${packet.discipline?.readyForHumanCoach ? "ready" : "not ready"}</span>
        <div class="profile-tags">${quality}</div>
        <div class="clean-list">${paper}</div>
        <div class="clean-list">${followups}</div>
        <div class="clean-list">${nextActionCandidates}</div>
        <span>${escapeHtml(packet.constraints?.[1] || "No stock recommendation, live signal, return promise, or real-money trading instruction.")}</span>
      </div>
      <span class="tag warn">Evidence</span>
    </div>
    ${setups}
    <label for="learningEvidenceExport">Evidence packet export</label>
    <textarea id="learningEvidenceExport" rows="8" readonly>${escapeHtml(packet.exportText || "")}</textarea>
  `;
}

function renderProgressReport(report = state.data?.progressReport) {
  if (!nodes.progressReportPanel) return;
  if (!report) {
    nodes.progressReportPanel.innerHTML = "<p>Generate a learner progress report after logging in and completing practice.</p>";
    return;
  }
  const achievements = report.achievements?.achievements?.filter((item) => item.unlocked).slice(0, 5) || [];
  const achievementHtml = achievements.length
    ? achievements.map((item) => `<span class="tag warn">${escapeHtml(item.title)}</span>`).join("")
    : '<span class="tag">No milestone unlocked yet</span>';
  const mistakeHtml = report.topMistakes?.length
    ? report.topMistakes.slice(0, 5).map((item) => `<span class="tag danger">${escapeHtml(item.tag)} x${item.count}</span>`).join("")
    : '<span class="tag">No repeated mistake yet</span>';
  const courseHtml = report.coursePackages?.length
    ? report.coursePackages.slice(0, 4).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${item.progress.percent}% complete / ${item.progress.completedItems} of ${item.progress.totalItems}</span>
          <span>${item.completionReport ? "Completion report issued" : "Education progress only"}</span>
        </div>
        <span class="tag ${item.completionReport ? "warn" : "danger"}">${item.enrolled ? "enrolled" : item.access}</span>
      </div>
    `).join("")
    : "<p>No course package progress yet.</p>";
  const completionReportHtml = report.completionReports?.length
    ? report.completionReports.slice(0, 4).map((item) => {
      const mistakeTags = item.practiceSummary?.topMistakeTags?.length
        ? item.practiceSummary.topMistakeTags.slice(0, 4).map((tag) => `<span class="tag danger">${escapeHtml(tag.tag)} x${tag.count}</span>`).join("")
        : '<span class="tag">No repeated mistake in this package</span>';
      return `
        <div class="attempt-row completion-report-card">
          <div>
            <strong>${escapeHtml(item.coursePackageTitle)} / completion report</strong>
            <span>Issued ${formatTime(item.issuedAt)} / v${item.courseVersion || 1} / ${item.progress?.percent ?? 0}% complete</span>
            <span>Completed ${item.progress?.completedItems ?? 0} of ${item.progress?.totalItems ?? 0} education items</span>
            <span>Training attempts ${item.practiceSummary?.trainingAttempts ?? 0} / average risk discipline ${item.practiceSummary?.averageRiskDiscipline ?? "--"}</span>
            <span>${escapeHtml(item.statements?.[1] || "Course completion is not trading skill certification, investment advice, or real-money readiness.")}</span>
            <div class="profile-tags">${mistakeTags}</div>
          </div>
          <div class="billing-actions">
            <button type="button" data-completion-certificate-format="json" data-report-id="${escapeHtml(item.id)}">Certificate JSON</button>
            <button type="button" data-completion-certificate-format="csv" data-report-id="${escapeHtml(item.id)}">Certificate CSV</button>
            <button type="button" data-completion-certificate-format="md" data-report-id="${escapeHtml(item.id)}">Certificate Brief</button>
            <span class="tag warn">Education proof</span>
          </div>
        </div>
      `;
    }).join("")
    : "<p>No completion report issued yet.</p>";
  const deliveryHtml = report.reportDeliveries?.length
    ? report.reportDeliveries.slice(0, 5).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>Coach note / ${formatTime(item.createdAt)}</strong>
          <span>${escapeHtml(item.coachNote)}</span>
          <span>Next step: ${escapeHtml(item.nextStep)}</span>
          <span>${item.assignment ? `Linked assignment: ${escapeHtml(item.assignment.scenarioTitle)} / ${escapeHtml(item.assignment.status)}` : "No linked assignment"}</span>
          <span>${escapeHtml(item.constraints?.[1] || "Education-only guidance, not a signal.")}</span>
        </div>
        <div class="profile-tags">
          <span class="tag ${item.learnerStatus === "completed" ? "warn" : "danger"}">${escapeHtml(item.learnerStatus || "unread")}</span>
          ${item.learnerStatus === "unread" ? `<button type="button" data-learner-report-action="read" data-delivery-id="${escapeHtml(item.id)}">Mark read</button>` : ""}
          ${item.learnerStatus !== "completed" ? `<button type="button" data-learner-report-action="completed" data-delivery-id="${escapeHtml(item.id)}">Complete next step</button>` : ""}
        </div>
      </div>
    `).join("")
    : "<p>No delivered coach notes yet.</p>";
  const coachSessionFollowupHtml = report.coachSessionFollowups?.length
    ? report.coachSessionFollowups.slice(0, 5).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.topic || "Coach session follow-up")}</strong>
          <span>${escapeHtml(item.status)} / outcome ${escapeHtml(item.postSessionOutcomeStatus || "session_completed")}${item.scheduledAt ? ` / session ${formatTime(item.scheduledAt)}` : ""}</span>
          <span>Assignments ${item.assignments?.length || 0} / completed ${(item.assignments || []).filter((assignment) => assignment.status === "completed").length}</span>
          <span>${escapeHtml(item.constraints?.[1] || "Education service continuity only.")}</span>
        </div>
        <span class="tag ${item.postSessionOutcomeStatus === "practice_completed" ? "warn" : "danger"}">${escapeHtml(item.postSessionOutcomeStatus || "session_completed")}</span>
      </div>
    `).join("")
    : "<p>No coach session follow-up evidence yet.</p>";
  const nextProductHtml = renderNextLearningProduct(report.nextLearningProduct);
  const approvedEducationModelRunHtml = renderApprovedEducationModelRun(report.approvedEducationModelRun);
  const learningEvidencePacketHtml = renderLearningEvidencePacket(report.learningEvidencePacket);
  nodes.progressReportPanel.innerHTML = `
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(report.learner?.name || "Learner progress")}</strong>
        <span>Training ${report.activity.trainingAttempts} / Replay ${report.activity.replayNotes} / Paper ${report.activity.paperTrades}</span>
        <span>Generated ${formatTime(report.generatedAt)}</span>
      </div>
      <span class="tag warn">Education only</span>
    </div>
    <div class="score-grid">
      <div><span>Today</span><strong>${report.habit?.todayDone ?? 0}/${report.habit?.dailyGoal ?? 3}</strong></div>
      <div><span>Streak</span><strong>${report.habit?.streakDays ?? 0}</strong></div>
      <div><span>Milestones</span><strong>${report.achievements?.unlockedCount ?? 0}/${report.achievements?.totalCount ?? 0}</strong></div>
    </div>
    <div class="profile-tags">${achievementHtml}</div>
    <div class="profile-tags">${mistakeHtml}</div>
    ${learningEvidencePacketHtml}
    ${courseHtml}
    ${renderEducationModelContext(report.educationModelContext)}
    ${renderEducationTutoringPlan(report.educationTutoringPlan)}
    ${approvedEducationModelRunHtml}
    ${nextProductHtml}
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Completion Reports</p>
        <h3>Education proof, not trading certification</h3>
      </div>
    </div>
    ${completionReportHtml}
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Coach Delivery</p>
        <h3>Delivered notes</h3>
      </div>
    </div>
    ${deliveryHtml}
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Session Follow-up</p>
        <h3>Post-session practice evidence</h3>
      </div>
    </div>
    ${coachSessionFollowupHtml}
    <label for="progressReportExport">Share/export text</label>
    <textarea id="progressReportExport" rows="9" readonly>${escapeHtml(report.exportText || report.shareText || "")}</textarea>
    <p class="muted-note">${escapeHtml(report.constraints?.[1] || "No investment advice, signals, return promises, or real-money instruction.")}</p>
  `;
}

function renderApprovedEducationModelRun(run) {
  if (!run) {
    return `
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Reviewed Tutoring Artifact</p>
          <h3>No approved model run yet</h3>
        </div>
      </div>
      <div class="attempt-row">
        <div>
          <strong>Human review pending</strong>
          <span>Archive a tutoring run and have an admin approve it before using it as reviewed teaching evidence.</span>
          <span>No stock recommendation, live signal, return promise, or real-money trading instruction.</span>
        </div>
        <span class="tag danger">Needs review</span>
      </div>
    `;
  }
  const focus = run.focusAreas?.length
    ? run.focusAreas.slice(0, 5).map((item) => `<span class="tag warn">${escapeHtml(item)}</span>`).join("")
    : '<span class="tag">Education process review</span>';
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Reviewed Tutoring Artifact</p>
        <h3>Human-approved teaching evidence</h3>
      </div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(run.id)} / ${escapeHtml(run.reviewStatus)}</strong>
        <span>Reviewed ${formatTime(run.reviewedAt)} by ${escapeHtml(run.reviewedBy || "admin")}</span>
        <span>${escapeHtml(run.reviewNote || "Approved for education-only tutoring workflow review.")}</span>
        <span>Context ${escapeHtml(run.contextSchemaVersion || "context")} / plan ${escapeHtml(run.planSchemaVersion || "plan")} / lesson steps ${run.lessonStepCount ?? 0}</span>
        <div class="profile-tags">${focus}</div>
        <span>${escapeHtml(run.constraints?.[1] || "No stock recommendation, live signal, return promise, or real-money instruction.")}</span>
      </div>
      <span class="tag warn">Approved</span>
    </div>
  `;
}

function renderNextLearningProduct(recommendation, options = {}) {
  if (!recommendation) return "";
  const constraints = recommendation.constraints?.length
    ? recommendation.constraints.slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "<span>Education-only recommendation. No investment advice.</span>";
  const actionButton = options.userId && recommendation.coursePackageId
    ? `<button type="button" data-coach-action="assign-course-package" data-user-id="${escapeHtml(options.userId)}" data-course-package-id="${escapeHtml(recommendation.coursePackageId)}">Assign recommended package</button>`
    : options.userId && recommendation.sourceCompletionReportId
      ? `<button type="button" data-coach-action="completion-followup" data-report-id="${escapeHtml(recommendation.sourceCompletionReportId)}">Create recommended follow-up</button>`
      : "";
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Next Learning Product</p>
        <h3>Recommended education step</h3>
      </div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(recommendation.title || "Next education step")}</strong>
        <span>Type ${escapeHtml(recommendation.type || "education")} / reason ${escapeHtml(recommendation.reason || "learning_progress")}</span>
        <span>Focus: ${escapeHtml(recommendation.focus || "Build a repeatable review routine.")}</span>
        <span>Action: ${escapeHtml(recommendation.action || "Continue education-only practice.")}</span>
        <div class="clean-list">${constraints}</div>
      </div>
      <div class="billing-actions">
        ${actionButton}
        <span class="tag warn">${recommendation.educationOnly ? "Education only" : "Review needed"}</span>
      </div>
    </div>
  `;
}

function renderEducationModelContext(context) {
  if (!context) return "";
  const prohibited = context.prohibitedUses?.length
    ? context.prohibitedUses.slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "<span>No trading advice, signals, return promises, or real-money trading.</span>";
  const mistakes = context.learningSignals?.topMistakes?.length
    ? context.learningSignals.topMistakes.slice(0, 4).map((item) => `<span class="tag danger">${escapeHtml(item.tag)} x${item.count}</span>`).join("")
    : '<span class="tag">No repeated mistake yet</span>';
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Education Model Context</p>
        <h3>Safe tutoring input</h3>
      </div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(context.schemaVersion || "education-model-context")}</strong>
        <span>Scope ${escapeHtml(context.dataScope || "learning profile only")} / course blockers ${context.activity?.courseEvidenceBlockers ?? 0}</span>
        <span>Signals: risk ${context.learningSignals?.averageRiskDiscipline ?? "--"} / context ${context.learningSignals?.averageContextDiscipline ?? "--"} / habit ${escapeHtml(context.learningSignals?.habitStatus || "unknown")}</span>
        <div class="profile-tags">${mistakes}</div>
        <div class="clean-list">${prohibited}</div>
      </div>
      <span class="tag warn">No signal data</span>
    </div>
  `;
}

function renderEducationTutoringPlan(plan) {
  if (!plan) return "";
  const focus = plan.focusAreas?.length
    ? plan.focusAreas.slice(0, 5).map((item) => `<span class="tag warn">${escapeHtml(item)}</span>`).join("")
    : '<span class="tag">General decision-process practice</span>';
  const steps = plan.lessonSteps?.length
    ? plan.lessonSteps.slice(0, 4).map((item) => `
      <li><strong>${escapeHtml(item.title)}</strong><br><span>${escapeHtml(item.prompt)}</span></li>
    `).join("")
    : "<li>Complete one education-only drill and write a short reflection.</li>";
  const questions = plan.coachScript?.length
    ? plan.coachScript.slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "<span>What is the learning objective?</span>";
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Tutoring Plan</p>
        <h3>Education-only next lesson</h3>
      </div>
    </div>
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(plan.schemaVersion || "education-tutoring-plan")}</strong>
        <span>Provider ${escapeHtml(plan.provider?.provider || "local")} / moderation ${escapeHtml(plan.moderationStatus || "review")}</span>
        <div class="profile-tags">${focus}</div>
        <ol class="clean-list">${steps}</ol>
        <div class="clean-list">${questions}</div>
      </div>
      <div class="billing-actions">
        <button type="button" data-education-model-run="archive">Archive tutoring run</button>
        <span class="tag warn">Human review</span>
      </div>
    </div>
  `;
}

async function archiveEducationModelRun() {
  if (!nodes.progressReportPanel) return;
  try {
    const result = await api("/api/education-model/tutoring-plan/runs", {
      method: "POST",
      body: JSON.stringify({}),
    });
    nodes.progressReportPanel.insertAdjacentHTML(
      "afterbegin",
      `<p class="muted-note">Archived education model run ${escapeHtml(result.run.id)} / ${escapeHtml(result.run.moderationStatus)}.</p>`
    );
    await refreshProgressReport();
    await refreshMetrics();
    await refreshAuditLog();
  } catch (error) {
    nodes.progressReportPanel.insertAdjacentHTML("afterbegin", `<p>Education model run archive failed: ${escapeHtml(error.message)}</p>`);
  }
}

async function refreshProgressReport() {
  if (!nodes.progressReportPanel) return;
  try {
    const result = await api("/api/learner/progress-report");
    state.data.progressReport = result.report;
    renderProgressReport(result.report);
    await refreshNotifications();
  } catch (error) {
    nodes.progressReportPanel.innerHTML = `<p>Progress report requires login: ${escapeHtml(error.message)}</p>`;
  }
}

async function updateLearnerReportDelivery(deliveryId, action) {
  if (!nodes.progressReportPanel) return;
  try {
    const result = await api("/api/learner/report-deliveries/update", {
      method: "POST",
      body: JSON.stringify({ deliveryId, action }),
    });
    state.data.progressReport = result.report;
    renderProgressReport(result.report);
  } catch (error) {
    nodes.progressReportPanel.insertAdjacentHTML("afterbegin", `<p>Update delivery failed: ${escapeHtml(error.message)}</p>`);
  }
}

function renderCoachReviews(tasks = state.data.coachReviewTasks || []) {
  if (!nodes.coachReviewList) return;
  nodes.coachReviewList.innerHTML = tasks.length
    ? tasks.slice(0, 8).map((task) => `
      <div class="attempt-row">
        <div>
          <strong>${task.focus}</strong>
          <span>${task.status} / ${formatTime(task.updatedAt || task.createdAt)}</span>
          <span>${task.coachNote || task.requestNote || "Coach review is pending."}</span>
        </div>
        <span class="tag ${task.status === "completed" ? "warn" : "danger"}">${task.status}</span>
      </div>
    `).join("")
    : "<p>No coach reviews yet. Coach plan users can request or receive education reviews here.</p>";
}

async function refreshCoachReviews() {
  if (!nodes.coachReviewList) return;
  try {
    const result = await api("/api/coach/reviews");
    state.data.coachReviewTasks = result.tasks;
    renderCoachReviews(result.tasks);
  } catch (error) {
    nodes.coachReviewList.innerHTML = `<p>Coach reviews require login: ${error.message}</p>`;
  }
}

function renderCoachSessionBookings(bookings = state.data.coachSessionBookings || []) {
  if (!nodes.coachSessionBookingList) return;
  nodes.coachSessionBookingList.innerHTML = bookings.length
    ? bookings.slice(0, 8).map((booking) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(booking.topic)}</strong>
          <span>${escapeHtml(booking.status)} / preferred ${escapeHtml(booking.preferredWindow || "not set")}${booking.scheduledAt ? ` / scheduled ${formatTime(booking.scheduledAt)}` : ""}</span>
          <span>${escapeHtml(booking.learnerGoal)}</span>
          <span>${escapeHtml(booking.adminNote || "Waiting for education-service scheduling.")}</span>
          <span>${escapeHtml(booking.constraints?.[1] || "No stock recommendation, live signal, returns, or real-money instruction.")}</span>
        </div>
        <span class="tag ${booking.status === "requested" ? "danger" : "warn"}">${escapeHtml(booking.status)}</span>
      </div>
    `).join("")
    : "<p>No coach session bookings yet. Coach plan users can request an education review appointment.</p>";
}

async function refreshCoachSessionBookings() {
  if (!nodes.coachSessionBookingList) return;
  try {
    const result = await api("/api/coach/session-bookings");
    state.data.coachSessionBookings = result.bookings || [];
    renderCoachSessionBookings(state.data.coachSessionBookings);
    if (nodes.coachSessionBookingStatus) {
      nodes.coachSessionBookingStatus.textContent = `Coach session bookings ${result.bookings?.length || 0}. Education service only.`;
    }
  } catch (error) {
    nodes.coachSessionBookingStatus.textContent = `Coach session booking requires Coach plan and compliance acknowledgement: ${escapeHtml(error.message)}`;
    nodes.coachSessionBookingList.innerHTML = "";
  }
}

async function requestCoachSessionBooking() {
  if (!nodes.coachSessionBookingStatus) return;
  try {
    const result = await api("/api/coach/session-bookings", {
      method: "POST",
      body: JSON.stringify({
        topic: nodes.coachSessionTopic?.value || "",
        preferredWindow: nodes.coachSessionWindow?.value || "",
        learnerGoal: nodes.coachSessionGoal?.value || "",
      }),
    });
    state.data.coachSessionBookings = result.bookings || [result.booking];
    renderCoachSessionBookings(state.data.coachSessionBookings);
    nodes.coachSessionBookingStatus.textContent = `Requested coach session ${result.booking.id}: ${result.booking.status}`;
    if (state.session?.role === "admin") await refreshAuditLog();
  } catch (error) {
    nodes.coachSessionBookingStatus.textContent = `Request coach session failed: ${escapeHtml(error.message)}`;
  }
}

function renderSupportTickets(tickets = []) {
  if (!nodes.supportTicketList) return;
  nodes.supportTicketList.innerHTML = tickets.length
    ? tickets.slice(0, 8).map((ticket) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(ticket.subject)}</strong>
          <span>${escapeHtml(ticket.category)} / ${escapeHtml(ticket.status)} / ${escapeHtml(ticket.priority || "normal")} / SLA ${formatTime(ticket.slaDueAt)}</span>
          <span>${escapeHtml(ticket.message)}</span>
          <span>${escapeHtml(ticket.adminNote || "Support team has not replied yet.")}</span>
          <span>${escapeHtml(ticket.constraints?.[1] || "No stock recommendation, live signal, returns, or real-money instruction.")}</span>
        </div>
        <span class="tag ${ticket.status === "resolved" ? "warn" : "danger"}">${escapeHtml(ticket.status)}</span>
      </div>
    `).join("")
    : "<p>No support tickets yet.</p>";
}

async function refreshSupportTickets() {
  if (!nodes.supportTicketList) return;
  try {
    const result = await api("/api/support/tickets");
    state.data.supportTickets = result.tickets || [];
    renderSupportTickets(state.data.supportTickets);
    if (nodes.supportTicketStatus) {
      nodes.supportTicketStatus.textContent = `Support tickets ${result.summary?.total || 0}, open ${result.summary?.open || 0}, resolved ${result.summary?.resolved || 0}`;
    }
  } catch (error) {
    nodes.supportTicketStatus.textContent = `Support requires login: ${escapeHtml(error.message)}`;
    nodes.supportTicketList.innerHTML = "";
  }
}

async function createSupportTicket() {
  if (!nodes.supportTicketStatus) return;
  try {
    const result = await api("/api/support/tickets", {
      method: "POST",
      body: JSON.stringify({
        category: nodes.supportCategory?.value || "learning",
        subject: nodes.supportSubject?.value || "",
        message: nodes.supportMessage?.value || "",
      }),
    });
    nodes.supportTicketStatus.textContent = `Created support ticket ${result.ticket.id}: ${result.ticket.status}`;
    state.data.supportTickets = result.tickets || [result.ticket];
    renderSupportTickets(state.data.supportTickets);
    await refreshAuditLog();
  } catch (error) {
    nodes.supportTicketStatus.textContent = `Create support ticket failed: ${escapeHtml(error.message)}`;
  }
}

async function markSupportTicketRead(ticketId) {
  if (!ticketId) return;
  try {
    const result = await api("/api/support/tickets/read", {
      method: "POST",
      body: JSON.stringify({ ticketId }),
    });
    state.data.supportTickets = result.tickets || state.data.supportTickets || [];
    state.data.notifications = result.notifications || state.data.notifications;
    renderSupportTickets(state.data.supportTickets);
    renderNotifications(state.data.notifications);
    setView("coach");
  } catch (error) {
    if (nodes.supportTicketStatus) nodes.supportTicketStatus.textContent = `Read support reply failed: ${escapeHtml(error.message)}`;
  }
}

function renderAssignments(assignments = state.data.practiceAssignments || []) {
  if (!nodes.assignmentList) return;
  nodes.assignmentList.innerHTML = assignments.length
    ? assignments.map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${item.scenarioTitle}</strong>
          <span>${item.status} / ${item.focus} ${item.dueAt ? `/ due ${item.dueAt}` : ""}</span>
          <span>${item.instructions}</span>
          <span>${item.completedAt ? `Completed ${formatTime(item.completedAt)}` : item.constraints?.[0] || "Education-only assignment."}</span>
        </div>
        <span class="tag ${item.status === "completed" ? "warn" : "danger"}">${item.status}</span>
      </div>
    `).join("")
    : "<p>No assigned practice yet.</p>";
}

async function refreshAssignments() {
  if (!nodes.assignmentList) return;
  try {
    const result = await api("/api/assignments");
    state.data.practiceAssignments = result.assignments;
    renderAssignments(result.assignments);
    await refreshNotifications();
  } catch (error) {
    nodes.assignmentList.innerHTML = `<p>Assignments require login: ${error.message}</p>`;
  }
}

function renderDashboard() {
  const habit = state.data.habit || {};
  nodes.todayDone.textContent = `${habit.todayDone ?? state.data.user.todayDone ?? 0} / ${habit.dailyGoal || 3}`;
  nodes.streakDays.textContent = `${habit.streakDays ?? state.data.user.streakDays ?? 0} 天`;
  nodes.disciplineScore.textContent = habit.averageRiskDiscipline ?? state.data.user.disciplineScore ?? "--";
  if (nodes.habitStatus) {
    nodes.habitStatus.textContent = habit.nextAction || "先登录，再记录每天的训练和复盘。";
  }
}

function renderOnboarding(onboarding = state.data.onboarding) {
  if (!nodes.onboardingStatus || !nodes.onboardingSteps) return;
  if (!onboarding) {
    nodes.onboardingStatus.textContent = "登录后开始教育训练路径。";
    nodes.onboardingSteps.innerHTML = "";
    if (nodes.onboardingNext) nodes.onboardingNext.disabled = true;
    return;
  }
  nodes.onboardingStatus.textContent = onboarding.status === "completed"
    ? "这条试用流程已走完，可以提交反馈。"
    : "下一步：按“继续”进入当前练习。";
  nodes.onboardingSteps.innerHTML = "";
  if (nodes.onboardingNext) {
    nodes.onboardingNext.disabled = !state.data.session || onboarding.status === "completed";
    nodes.onboardingNext.dataset.nextView = state.data.nextStepPlan?.primary?.targetView || onboarding.nextView || "dashboard";
    nodes.onboardingNext.dataset.scenarioId = state.data.nextStepPlan?.primary?.scenarioId || onboarding.recommendedScenario?.id || "";
  }
}

function renderNextStepPlan(plan) {
  if (!plan) return "";
  const primaryStatus = plan.primary?.status
    ? `<span>上次动作：${escapeHtml(plan.primary.status)}${plan.primary.lastEventAt ? ` / ${formatTime(plan.primary.lastEventAt)}` : ""}</span>`
    : "";
  const actionRows = (plan.actions || []).slice(0, 4).map((item) => `
    <div class="mini-row">
      <span>${escapeHtml(item.title || item.id)} / ${escapeHtml(item.reason || "learning_progress")}</span>
      <span>${escapeHtml(item.action || "")}${item.status ? ` / ${escapeHtml(item.status)}` : ""}</span>
    </div>
  `).join("");
  return `
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(plan.primary?.title || "下一步学习")}</strong>
        <span>${escapeHtml(plan.primary?.action || "继续做教育训练。")}</span>
        <span>${escapeHtml(plan.primary?.evidence || "根据你的学习流程推荐。")}</span>
        ${primaryStatus}
        <span>待练习 ${plan.evidence?.openAssignments || 0} / 未读 ${plan.evidence?.unreadNotifications || 0} / 纸面回测样本 ${plan.evidence?.backtestSampleSize || 0} / 可信度 ${escapeHtml(plan.evidence?.backtestReliabilityGrade || "未复核")}</span>
        <span>${escapeHtml(plan.constraints?.[1] || "不荐股、不出实盘信号、不承诺收益、不接券商、不指导真实资金。")}</span>
        <div class="mini-list">${actionRows}</div>
      </div>
      <span class="tag warn">下一步</span>
    </div>
  `;
}

async function recordNextStepEvent(eventType = "opened") {
  const action = state.data?.nextStepPlan?.primary;
  if (!action?.id || !state.data?.session) return null;
  const result = await api("/api/next-step-plan/events", {
    method: "POST",
    body: JSON.stringify({
      actionId: action.id,
      eventType,
    }),
  });
  state.data.nextStepPlan = result.plan || state.data.nextStepPlan;
  return result.event;
}

function renderActivationPlan(plan) {
  if (!plan) return "";
  const checklist = plan.checklist?.length
    ? plan.checklist.slice(0, 5).map((item) => `<span class="tag ${item.status === "completed" ? "warn" : item.status === "current" ? "danger" : ""}">${escapeHtml(item.title)} / ${escapeHtml(item.status)}</span>`).join("")
    : '<span class="tag">暂无启动步骤</span>';
  return `
    <div class="attempt-row">
      <div>
        <strong>${escapeHtml(plan.title || "启动计划")}</strong>
        <span>${escapeHtml(plan.firstDayGoal || "完成第一个教育学习闭环。")}</span>
        <span>下一步：${escapeHtml(plan.nextAction || "继续完成登录后的引导。")}</span>
        <span>进度 ${plan.progress?.completedSteps ?? 0}/${plan.progress?.totalSteps ?? 0} / ${plan.progress?.percent ?? 0}%</span>
        ${plan.recommendedScenario ? `<span>推荐练习：${escapeHtml(plan.recommendedScenario.title)} / ${escapeHtml(plan.recommendedScenario.symbol || "")} ${escapeHtml(plan.recommendedScenario.timeframe || "")}</span>` : ""}
        <span>${escapeHtml(plan.constraints?.[1] || "不提供投资建议、实盘信号、收益承诺、券商连接或真实资金流程。")}</span>
        <div class="profile-tags">${checklist}</div>
      </div>
      <span class="tag warn">启动</span>
    </div>
  `;
}

function renderNotifications(summary = state.data.notifications) {
  if (!nodes.notificationStatus || !nodes.notificationList) return;
  if (!summary || !state.data.session) {
    nodes.notificationStatus.textContent = "登录后查看教练笔记和分配练习。";
    nodes.notificationList.innerHTML = "";
    return;
  }
  nodes.notificationStatus.textContent = `${summary.summary?.total || 0} open item(s), ${summary.summary?.unread || 0} unread note(s), ${summary.summary?.openAssignments || 0} practice assignment(s), ${summary.summary?.activationInterventions || 0} activation follow-up(s), ${summary.summary?.nextLearningProducts || 0} next step(s), ${summary.summary?.coachSessions || 0} coach session(s), ${summary.summary?.supportReplies || 0} support replie(s).`;
  nodes.notificationList.innerHTML = summary.notifications?.length
    ? summary.notifications.map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.body)}</span>
          <span>${formatTime(item.createdAt)} / ${escapeHtml(item.status)}</span>
          <span>${escapeHtml(summary.constraints?.[1] || "Education workflow only.")}</span>
        </div>
        <div class="profile-tags">
          <span class="tag ${item.status === "unread" || item.status === "assigned" ? "danger" : "warn"}">${escapeHtml(item.type)}</span>
          <button type="button"
            data-notification-action="${item.type === "practice_assignment" ? "start-assignment" : item.type === "support_ticket_update" ? "open-support" : item.type === "activation_intervention" ? "open-activation" : item.type === "next_learning_product" ? "open-next-learning" : item.type === "learning_evidence_followup" ? "open-evidence-followup" : item.type === "coach_session_booking" ? "open-coach-session" : "open-report"}"
            data-delivery-id="${escapeHtml(item.deliveryId || "")}"
            data-ticket-id="${escapeHtml(item.ticketId || "")}"
            data-booking-id="${escapeHtml(item.bookingId || "")}"
            data-task-id="${escapeHtml(item.taskId || "")}"
            data-report-id="${escapeHtml(item.sourceCompletionReportId || "")}"
            data-course-package-id="${escapeHtml(item.coursePackageId || "")}"
            data-target-view="${escapeHtml(item.targetView || "")}"
            data-scenario-id="${escapeHtml(item.scenarioId || "")}">
            ${escapeHtml(item.actionLabel)}
          </button>
        </div>
      </div>
    `).join("")
    : "<p>No open coach notes or assigned practice.</p>";
}

async function refreshNotifications() {
  if (!state.data?.session) {
    renderNotifications(state.data?.notifications);
    return;
  }
  try {
    const result = await api("/api/notifications");
    state.data.notifications = result;
    renderNotifications(result);
  } catch (error) {
    if (nodes.notificationStatus) nodes.notificationStatus.textContent = `Notifications require login: ${error.message}`;
  }
}

function renderAchievements(summary = state.data.achievements) {
  if (!nodes.achievementStatus || !nodes.achievementList) return;
  if (!summary) {
    nodes.achievementStatus.textContent = "登录后查看学习里程碑。";
    nodes.achievementList.innerHTML = "";
    return;
  }
  nodes.achievementStatus.textContent = `${summary.unlockedCount}/${summary.totalCount} unlocked${summary.latestUnlocked ? ` / latest: ${summary.latestUnlocked.title}` : ""}`;
  nodes.achievementList.innerHTML = (summary.achievements || []).map((item) => `
    <div class="attempt-row">
      <div>
        <strong>${item.title}</strong>
        <span>${item.description}</span>
        <span>Progress ${item.progress}/${item.target}${item.unlockedAt ? ` / unlocked ${formatTime(item.unlockedAt)}` : ""}</span>
      </div>
      <span class="tag ${item.unlocked ? "warn" : ""}">${item.status}</span>
    </div>
  `).join("");
}

async function refreshAchievements() {
  if (!state.data?.session) {
    renderAchievements(state.data?.achievements);
    return;
  }
  try {
    const result = await api("/api/achievements");
    state.data.achievements = result.achievements;
    renderAchievements(result.achievements);
  } catch (error) {
    if (nodes.achievementStatus) nodes.achievementStatus.textContent = `Achievements require login: ${error.message}`;
  }
}

async function refreshOnboarding() {
  if (!state.data?.session) {
    renderOnboarding(state.data?.onboarding);
    return;
  }
  try {
    const result = await api("/api/onboarding");
    const nextStep = await api("/api/next-step-plan");
    state.data.onboarding = result.onboarding;
    state.data.nextStepPlan = nextStep.plan;
    renderOnboarding(result.onboarding);
  } catch (error) {
    if (nodes.onboardingStatus) nodes.onboardingStatus.textContent = `Onboarding requires login: ${error.message}`;
  }
}

function selectScenarioById(scenarioId) {
  if (!scenarioId || !state.data?.scenarios?.length) return false;
  const index = state.data.scenarios.findIndex((item) => item.id === scenarioId);
  if (index < 0) return false;
  state.scenarioIndex = index;
  state.replayStep = 8;
  renderTrainer();
  renderReplay();
  return true;
}

function renderCompliance(compliance = state.data.compliance) {
  if (!nodes.complianceStatus || !nodes.complianceChecklist) return;
  if (!compliance) {
    nodes.complianceStatus.textContent = "进入试用后自动确认教育风险说明。";
    nodes.complianceChecklist.innerHTML = "";
    if (nodes.acknowledgeCompliance) nodes.acknowledgeCompliance.disabled = true;
    return;
  }
  nodes.complianceStatus.textContent = compliance.acknowledged
    ? `已确认 ${compliance.version} / ${formatTime(compliance.acknowledgedAt)}`
    : `训练、回放或订阅前需要确认：${compliance.version}`;
  nodes.complianceChecklist.innerHTML = (compliance.requiredStatements || [])
    .map((item) => `<li>${item}</li>`)
    .join("");
  if (nodes.acknowledgeCompliance) {
    nodes.acknowledgeCompliance.disabled = !state.data.session || compliance.acknowledged;
  }
}

function renderSession() {
  const session = state.data.session;
  const roleLabel = session?.role === "admin" ? "管理员" : session?.role === "student" ? "试用模式" : "试用入口";
  nodes.accountPlan.textContent = roleLabel;
  if (nodes.loginStatus) {
    nodes.loginStatus.textContent = session
      ? `Logged in: ${session.email} (${session.role})`
      : "Not logged in";
  }
}
function renderEntitlement(entitlement = state.data.entitlement) {
  if (!nodes.entitlementGrid) return;
  if (!entitlement) {
    nodes.entitlementGrid.innerHTML = "<span>Please log in</span>";
    return;
  }
  nodes.entitlementGrid.innerHTML = `
    <span>Plan ${entitlement.plan}</span>
    <span>Training ${entitlement.usage.training}/${entitlement.limits.dailyTraining}</span>
    <span>Replay ${entitlement.usage.replay}/${entitlement.limits.dailyReplay}</span>
    <span>AI ${entitlement.limits.aiCoach}</span>
    <span>Coach review ${entitlement.usage.coachReview}/${entitlement.limits.totalCoachReviews}</span>
    <span>Add-on reviews ${entitlement.limits.addonCoachReviews}</span>
    <span>Training left ${entitlement.remaining.training}</span>
    <span>Coach reviews left ${entitlement.remaining.coachReview}</span>
  `;
}
function renderBillingState(billing = state.data.billingState) {
  if (!nodes.subscriptionPanel || !nodes.orderLog) return;
  state.data.billingState = billing || { activeSubscription: null, orders: [], events: [] };
  const subscription = state.data.billingState.activeSubscription;
  nodes.subscriptionPanel.innerHTML = subscription
    ? `
      <span>Subscription ${subscription.plan}</span>
      <span>Status ${subscription.status}</span>
      <span>Period end ${formatTime(subscription.currentPeriodEnd)}</span>
    `
    : "<span>No active subscription</span>";
  nodes.orderLog.innerHTML = state.data.billingState.orders?.length
    ? state.data.billingState.orders.map((order) => `
      <div class="attempt-row">
        <div>
          <strong>${order.plan} / ${order.kind || "subscription"} / ${order.status}</strong>
          <span>${formatTime(order.createdAt)} / ${order.id}${order.coachReviewCredits ? ` / +${order.coachReviewCredits} review` : ""}</span>
        </div>
        <div class="billing-actions">
          ${order.status === "pending" ? `<button type="button" data-billing-event="payment.succeeded" data-order-id="${order.id}">Pay success</button>` : ""}
          ${order.status === "paid" && order.kind !== "addon" ? `<button type="button" data-billing-event="subscription.canceled" data-order-id="${order.id}">Cancel</button>` : ""}
          ${order.status === "paid" ? `<button type="button" data-billing-event="payment.refunded" data-order-id="${order.id}">Refund</button>` : ""}
        </div>
      </div>
    `).join("")
    : "<p>No orders yet. Choose a plan to create a local simulated order.</p>";
}

async function refreshReceipts() {
  if (!nodes.receiptLog) return;
  try {
    const result = await api("/api/billing/receipts");
    nodes.receiptLog.innerHTML = result.receipts.length
      ? result.receipts.map((receipt) => `
        <div class="attempt-row">
          <div>
            <strong>${receipt.item} / ${receipt.kind} / ${receipt.status}</strong>
            <span>${receipt.id} / ${formatTime(receipt.issuedAt)} / ¥${(receipt.amountCents / 100).toFixed(2)}</span>
            <span>${receipt.note}</span>
          </div>
          <span class="tag warn">${receipt.currency}</span>
        </div>
      `).join("")
      : `<p>${result.note}</p>`;
  } catch (error) {
    nodes.receiptLog.innerHTML = `<p>Receipts require login: ${error.message}</p>`;
  }
}

async function refreshRevenueLedger() {
  if (!nodes.revenueLedger) return;
  try {
    const result = await api("/api/admin/revenue-ledger");
    nodes.revenueLedger.innerHTML = `
      <div class="check-grid">
        <span>Gross ¥${(result.totals.grossCents / 100).toFixed(2)}</span>
        <span>Refunds ¥${(result.totals.refundedCents / 100).toFixed(2)}</span>
        <span>Net ¥${(result.totals.netCents / 100).toFixed(2)}</span>
        <span>Paid orders ${result.totals.paidOrders}</span>
      </div>
      ${result.entries.length ? result.entries.slice(0, 12).map((entry) => `
        <div class="attempt-row">
          <div>
            <strong>${entry.item} / ${entry.kind} / ${entry.eventType}</strong>
            <span>${formatTime(entry.createdAt)} / ${entry.orderId} / impact ¥${(entry.revenueImpactCents / 100).toFixed(2)}</span>
          </div>
          <span class="tag warn">${entry.providerMode || "local"}</span>
        </div>
      `).join("") : `<p>${result.note}</p>`}
    `;
    await refreshBillingCompliance();
  } catch (error) {
    nodes.revenueLedger.innerHTML = `<p>Revenue ledger requires admin login: ${error.message}</p>`;
    if (nodes.billingComplianceQueue) nodes.billingComplianceQueue.innerHTML = "";
  }
}

async function refreshBillingCompliance() {
  if (!nodes.billingComplianceQueue) return;
  try {
    const result = await api("/api/admin/billing-compliance-queue?limit=40");
    const summary = result.summary || {};
    nodes.billingComplianceQueue.innerHTML = `
      <div class="check-grid">
        <span>Queue ${summary.total || 0}</span>
        <span>High ${summary.highPriority || 0}</span>
        <span>Invoices missing ${summary.missingTaxInvoices || 0}</span>
        <span>Tax profiles missing ${summary.missingTaxProfiles || 0}</span>
      </div>
      ${(result.items || []).length ? result.items.slice(0, 10).map((item) => `
        <div class="attempt-row">
          <div>
            <strong>${escapeHtml(item.plan || "order")} / ${escapeHtml(item.kind || "subscription")} / ${escapeHtml(item.status || "unknown")}</strong>
            <span>${escapeHtml(item.orderId)} / ${escapeHtml(item.providerMode || "local")} / ¥${((item.amountCents || 0) / 100).toFixed(2)}</span>
            <span>Gaps: ${(item.gaps || []).map(escapeHtml).join(" / ")}</span>
            <span>${escapeHtml(item.nextAction || "Review billing compliance before production.")}</span>
          </div>
          <span class="tag ${item.priority === "high" ? "danger" : "warn"}">${escapeHtml(item.priority || "normal")}</span>
        </div>
      `).join("") : `<p>${escapeHtml(result.constraints?.[1] || "No billing compliance gaps yet.")}</p>`}
    `;
  } catch (error) {
    nodes.billingComplianceQueue.innerHTML = `<p>Billing compliance queue requires admin login: ${escapeHtml(error.message)}</p>`;
  }
}

async function refreshProductReadiness() {
  if (!nodes.productReadinessList) return;
  try {
    const prototypeScorecard = await api("/api/admin/commercial-prototype-scorecard");
    const trialKickoffPlan = await api("/api/admin/customer-trial-kickoff-plan");
    const trialRoom = await api("/api/admin/customer-trial-room");
    const trialRoomShares = await api("/api/admin/customer-trial-room-shares");
    const launchOps = await api("/api/admin/launch-ops-board");
    const result = await api("/api/admin/product-readiness");
    const pilotChecklist = await api("/api/admin/pilot-success-checklist");
    const pilotActions = await api("/api/admin/pilot-success-actions");
    const pilotBriefs = await api("/api/admin/pilot-renewal-briefs");
    const pilotBriefDeliveries = await api("/api/admin/pilot-renewal-brief-deliveries");
    const pilotExpansion = await api("/api/admin/pilot-expansion-plan");
    const pilotExpansionPlans = await api("/api/admin/pilot-expansion-plans");
    const pilotExpansionLaunch = await api("/api/admin/pilot-expansion-launch-checklist");
    const pilotExpansionLaunchBriefs = await api("/api/admin/pilot-expansion-launch-briefs");
    const customerTrialDeliveries = await api("/api/admin/customer-trial-packet-deliveries");
    const nextStepEngagement = await api("/api/admin/next-step-engagement-report?limit=20");
    const checklistRows = (pilotChecklist.criteria || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.status)}</span>
        <span>${escapeHtml(item.evidence || "")}</span>
      </div>
    `).join("");
    const pilotActionRows = [
      ...(pilotActions.actions || []).slice(0, 3).map((item) => `
        <div class="mini-row">
          <span>${escapeHtml(item.title)} / ${escapeHtml(item.status || "open")} / ${escapeHtml(item.priority || "medium")} / ${escapeHtml(item.ownerEmail || "unassigned")}</span>
          <span>
            ${item.status !== "in_progress" ? `<button type="button" data-pilot-action-status="in_progress" data-pilot-action-id="${escapeHtml(item.id)}">Start</button>` : ""}
            ${item.status !== "done" ? `<button type="button" data-pilot-action-status="done" data-pilot-action-id="${escapeHtml(item.id)}">Done</button>` : ""}
            ${item.status !== "deferred" ? `<button type="button" data-pilot-action-status="deferred" data-pilot-action-id="${escapeHtml(item.id)}">Defer</button>` : ""}
          </span>
        </div>
      `),
      ...(pilotActions.candidates || []).filter((item) => !item.alreadyOpen).slice(0, 3).map((item) => `
        <div class="mini-row">
          <span>${escapeHtml(item.title)} / candidate / ${escapeHtml(item.priority || "medium")}</span>
          <span>${escapeHtml(item.next || "")}</span>
        </div>
      `),
    ].join("");
    const pilotBriefRows = (pilotBriefs.briefs || []).slice(0, 3).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title || "Pilot renewal brief")} / ${escapeHtml(item.status || "draft")} / ${escapeHtml(item.recommendation || "review")} / ${escapeHtml(item.ownerEmail || "unassigned")}</span>
        <span>
          ${item.status !== "sent" ? `<button type="button" data-pilot-brief-status="sent" data-pilot-brief-id="${escapeHtml(item.id)}">Mark sent</button>` : ""}
          ${item.status !== "reviewed" ? `<button type="button" data-pilot-brief-status="reviewed" data-pilot-brief-id="${escapeHtml(item.id)}">Reviewed</button>` : ""}
          ${item.status !== "archived" ? `<button type="button" data-pilot-brief-status="archived" data-pilot-brief-id="${escapeHtml(item.id)}">Archive</button>` : ""}
          <button type="button" data-pilot-brief-deliver="${escapeHtml(item.id)}">Send</button>
        </span>
      </div>
    `).join("");
    const pilotBriefDeliveryRows = (pilotBriefDeliveries.deliveries || []).slice(0, 3).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.briefTitle || "Pilot renewal brief")} / ${escapeHtml(item.recipientEmail || "")} / ${escapeHtml(item.providerMode || "local-simulated")} / feedback ${escapeHtml(item.feedbackStatus || "pending_feedback")}</span>
        <span>
          ${formatTime(item.sentAt || item.createdAt)}
          <button type="button" data-pilot-delivery-feedback="objections" data-pilot-delivery-id="${escapeHtml(item.id)}">Objection</button>
          <button type="button" data-pilot-delivery-feedback="expansion_interest" data-pilot-delivery-id="${escapeHtml(item.id)}">Expansion</button>
          <button type="button" data-pilot-delivery-feedback="renewal_ready" data-pilot-delivery-id="${escapeHtml(item.id)}">Renewal ready</button>
          <button type="button" data-pilot-delivery-feedback="no_fit" data-pilot-delivery-id="${escapeHtml(item.id)}">No fit</button>
          ${(item.feedbackStatus && item.feedbackStatus !== "pending_feedback") ? `<button type="button" data-pilot-delivery-action="${escapeHtml(item.id)}">Create action</button>` : ""}
        </span>
      </div>
    `).join("");
    const expansionRows = (pilotExpansion.rows || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.section)} / ${escapeHtml(item.item)} / ${escapeHtml(item.status)}</span>
        <span>${escapeHtml(item.next || "")}</span>
      </div>
    `).join("");
    const savedExpansionRows = (pilotExpansionPlans.plans || []).slice(0, 3).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title || "Pilot expansion plan")} / ${escapeHtml(item.status || "draft")} / ${escapeHtml(item.decision || "review")} / ${escapeHtml(item.ownerEmail || "unassigned")}</span>
        <span>
          ${item.status !== "approved" ? `<button type="button" data-pilot-expansion-status="approved" data-pilot-expansion-id="${escapeHtml(item.id)}">Approve</button>` : ""}
          ${item.status !== "in_progress" ? `<button type="button" data-pilot-expansion-status="in_progress" data-pilot-expansion-id="${escapeHtml(item.id)}">Start</button>` : ""}
          ${item.status !== "completed" ? `<button type="button" data-pilot-expansion-status="completed" data-pilot-expansion-id="${escapeHtml(item.id)}">Complete</button>` : ""}
          ${item.status !== "deferred" ? `<button type="button" data-pilot-expansion-status="deferred" data-pilot-expansion-id="${escapeHtml(item.id)}">Defer</button>` : ""}
        </span>
      </div>
    `).join("");
    const expansionLaunchRows = (pilotExpansionLaunch.checklist || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title || item.key)} / ${escapeHtml(item.status || "review")}</span>
        <span>${escapeHtml(item.next || "")}</span>
      </div>
    `).join("");
    const expansionLaunchBriefRows = (pilotExpansionLaunchBriefs.briefs || []).slice(0, 3).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title || "Pilot expansion launch brief")} / ${escapeHtml(item.status || "draft")} / ready ${item.summary?.ready || 0}/${item.summary?.total || 0} / ${escapeHtml(item.ownerEmail || "unassigned")}</span>
        <span>
          ${item.status !== "approved" ? `<button type="button" data-pilot-launch-brief-status="approved" data-pilot-launch-brief-id="${escapeHtml(item.id)}">Approve</button>` : ""}
          ${item.status !== "shared" ? `<button type="button" data-pilot-launch-brief-status="shared" data-pilot-launch-brief-id="${escapeHtml(item.id)}">Shared</button>` : ""}
          ${item.status !== "reviewed" ? `<button type="button" data-pilot-launch-brief-status="reviewed" data-pilot-launch-brief-id="${escapeHtml(item.id)}">Reviewed</button>` : ""}
          ${item.status !== "archived" ? `<button type="button" data-pilot-launch-brief-status="archived" data-pilot-launch-brief-id="${escapeHtml(item.id)}">Archive</button>` : ""}
        </span>
      </div>
    `).join("");
    const nextStepEngagementRows = (nextStepEngagement.recentEvents || []).slice(0, 4).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title || item.actionId)} / ${escapeHtml(item.eventType || "opened")} / ${escapeHtml(item.email || "learner")}</span>
        <span>${formatTime(item.createdAt)} / ${escapeHtml(item.targetView || "workflow")}</span>
      </div>
    `).join("");
    const customerTrialDeliveryRows = (customerTrialDeliveries.deliveries || []).slice(0, 4).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.recipientEmail || "customer")} / ${escapeHtml(item.providerMode || "local-simulated")} / feedback ${escapeHtml(item.feedbackStatus || "pending_feedback")} / ${escapeHtml(item.launchDecision || "review")}</span>
        <span>
          ${formatTime(item.sentAt || item.createdAt)}
          <button type="button" data-trial-delivery-feedback="objections" data-trial-delivery-id="${escapeHtml(item.id)}">Objection</button>
          <button type="button" data-trial-delivery-feedback="needs_more_evidence" data-trial-delivery-id="${escapeHtml(item.id)}">Evidence</button>
          <button type="button" data-trial-delivery-feedback="trial_ready" data-trial-delivery-id="${escapeHtml(item.id)}">Trial ready</button>
          <button type="button" data-trial-delivery-feedback="no_fit" data-trial-delivery-id="${escapeHtml(item.id)}">No fit</button>
          ${(item.feedbackStatus && item.feedbackStatus !== "pending_feedback") ? `<button type="button" data-trial-delivery-action="${escapeHtml(item.id)}">Create action</button>` : ""}
        </span>
      </div>
    `).join("");
    const prototypeLaneRows = (prototypeScorecard.lanes || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.status)} / ${item.score || 0}/${item.maxScore || 0}</span>
        <span>${escapeHtml(item.metric || "")}</span>
      </div>
    `).join("");
    const prototypeBlockerRows = (prototypeScorecard.blockers || []).slice(0, 5).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.priority || "medium")} / ${escapeHtml(item.source || "scorecard")}</span>
        <span>${escapeHtml(item.next || "")}</span>
      </div>
    `).join("");
    const trialKickoffStepRows = (trialKickoffPlan.steps || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.status || "needs_action")} / ${escapeHtml(item.priority || "medium")} / ${escapeHtml(item.ownerEmail || "unassigned")}</span>
        <span>${escapeHtml(item.next || "")}</span>
      </div>
    `).join("");
    const trialRoomSectionRows = (trialRoom.sections || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.status || "review")} / ${escapeHtml(item.metric || "")}</span>
        <span>${escapeHtml(item.next || "")}</span>
      </div>
    `).join("");
    const trialRoomArtifactRows = (trialRoom.reviewArtifacts || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.label || item.key)} / available</span>
        <span>${escapeHtml(item.endpoint || "")}</span>
      </div>
    `).join("");
    const trialRoomShareRows = (trialRoomShares.shares || []).slice(0, 4).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.recipientEmail || "customer")} / ${escapeHtml(item.providerMode || "local-simulated")} / feedback ${escapeHtml(item.feedbackStatus || "pending_feedback")} / ${escapeHtml(item.roomDecision || "review")}</span>
        <span>
          ${formatTime(item.sharedAt || item.createdAt)}
          <button type="button" data-room-share-feedback="objections" data-room-share-id="${escapeHtml(item.id)}">Objection</button>
          <button type="button" data-room-share-feedback="needs_more_evidence" data-room-share-id="${escapeHtml(item.id)}">Evidence</button>
          <button type="button" data-room-share-feedback="room_accepted_for_review" data-room-share-id="${escapeHtml(item.id)}">Accepted</button>
          <button type="button" data-room-share-feedback="no_fit" data-room-share-id="${escapeHtml(item.id)}">No fit</button>
          <button type="button" data-room-share-buyer-review="${escapeHtml(item.id)}">Buyer review</button>
          <button type="button" data-room-share-buyer-objection="${escapeHtml(item.id)}">Log objection</button>
          ${(item.feedbackStatus && item.feedbackStatus !== "pending_feedback") ? `<button type="button" data-room-share-action="${escapeHtml(item.id)}">Create action</button>` : ""}
        </span>
      </div>
    `).join("");
    const launchLaneRows = (launchOps.lanes || []).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.status)} / ${escapeHtml(item.metric || "")}</span>
        <span>${escapeHtml(item.next || "")}</span>
      </div>
    `).join("");
    const launchBlockerRows = (launchOps.blockers || []).slice(0, 5).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.source)} / ${escapeHtml(item.priority || "medium")}</span>
        <span>${escapeHtml(item.next || "")}</span>
      </div>
    `).join("");
    nodes.productReadinessStatus.textContent = `${result.summary.ready}/${result.summary.total} operating areas ready, ${result.summary.gaps} gap(s). Launch ops ${launchOps.decision || "review"}. Production ready: ${result.productionReady ? "yes" : "no"}.`;
    nodes.productReadinessList.innerHTML = `
      <div class="attempt-row ops-row">
        <div>
          <strong>Customer trial room</strong>
          <span>${escapeHtml(trialRoom.decision || "customer_trial_room_needs_follow_through")} / score ${trialRoom.summary?.score || 0}/100 / sections ${trialRoom.summary?.sections || 0} / deliveries ${trialRoom.summary?.deliveries || 0} / feedback pending ${trialRoom.summary?.feedbackPending || 0}.</span>
          <span>Room shares ${trialRoomShares.summary?.total || 0}, pending share feedback ${trialRoomShares.summary?.feedbackPending || 0}, accepted ${trialRoomShares.summary?.roomAcceptedForReview || 0}, evidence requests ${trialRoomShares.summary?.needsMoreEvidence || 0}. Buyer review evidence ${trialRoom.summary?.buyerReviewNeedsMoreEvidence || 0}, objections ${trialRoom.summary?.buyerReviewObjections || 0}, accepted ${trialRoom.summary?.buyerReviewAccepted || 0}.</span>
          <span>Kickoff needs action ${trialRoom.summary?.kickoffNeedsAction || 0}, blocked ${trialRoom.summary?.kickoffBlocked || 0}, open actions ${trialRoom.summary?.openActions || 0}, room action done ${trialRoom.summary?.roomFeedbackActionsDone || 0}, room action open ${trialRoom.summary?.roomFeedbackActionsOpen || 0}, audit ${escapeHtml(trialRoom.summary?.auditVerificationStatus || "not_sealed")}.</span>
          <span>${escapeHtml(trialRoom.constraints?.[1] || "Trial room is education SaaS trial evidence only.")}</span>
          <div class="mini-list">${trialRoomSectionRows || "<span>No trial room sections yet.</span>"}</div>
          <div class="mini-list">${trialRoomArtifactRows || "<span>No trial room artifacts yet.</span>"}</div>
          <div class="mini-list">${trialRoomShareRows || "<span>No trial room share records yet.</span>"}</div>
        </div>
        <span class="tag ${trialRoom.summary?.kickoffBlocked ? "danger" : trialRoom.summary?.kickoffNeedsAction ? "warn" : ""}">Room</span>
      </div>
      <div class="attempt-row ops-row">
        <div>
          <strong>Commercial prototype scorecard</strong>
          <span>${escapeHtml(prototypeScorecard.decision || "customer_trial_operating_gaps")} / customer trial readiness ${prototypeScorecard.customerTrialReadinessScore || 0}/100 / blockers ${prototypeScorecard.summary?.blockers || 0} / high priority ${prototypeScorecard.summary?.highPriorityBlockers || 0}.</span>
          <span>Trial deliveries ${prototypeScorecard.summary?.customerTrialDeliveries || 0}, pending feedback ${prototypeScorecard.summary?.trialFeedbackPending || 0}, room shares ${prototypeScorecard.summary?.customerTrialRoomShares || 0}, buyer evidence ${prototypeScorecard.summary?.buyerReviewNeedsMoreEvidence || 0}, buyer objections ${prototypeScorecard.summary?.buyerReviewObjections || 0}.</span>
          <span>Open pilot actions ${prototypeScorecard.summary?.openPilotActions || 0}, room actions done ${prototypeScorecard.summary?.trialRoomFeedbackActionsDone || 0}, room actions open ${prototypeScorecard.summary?.trialRoomFeedbackActionsOpen || 0}, SLA high ${prototypeScorecard.summary?.serviceSlaHighPriority || 0}, audit ${escapeHtml(prototypeScorecard.summary?.auditVerificationStatus || "not_sealed")}.</span>
          <span>${escapeHtml(prototypeScorecard.constraints?.[1] || "Scorecard is education SaaS trial operations only.")}</span>
          <div class="mini-list">${prototypeLaneRows || "<span>No scorecard lanes yet.</span>"}</div>
          <div class="mini-list">${prototypeBlockerRows || "<span>No scorecard blockers detected in current prototype data.</span>"}</div>
        </div>
        <span class="tag ${prototypeScorecard.summary?.highPriorityBlockers ? "danger" : prototypeScorecard.summary?.blockers ? "warn" : ""}">${prototypeScorecard.customerTrialReadinessScore || 0}/100</span>
      </div>
      <div class="attempt-row ops-row">
        <div>
          <strong>Customer trial kickoff plan</strong>
          <span>${escapeHtml(trialKickoffPlan.decision || "kickoff_needs_owner_follow_through")} / steps ${trialKickoffPlan.summary?.done || 0} done, ${trialKickoffPlan.summary?.needsAction || 0} needs action, ${trialKickoffPlan.summary?.blocked || 0} blocked / action recommended ${trialKickoffPlan.summary?.actionRecommended || 0}.</span>
          <span>Score ${trialKickoffPlan.scorecard?.customerTrialReadinessScore || 0}/100. Latest delivery ${trialKickoffPlan.latestDelivery ? `${escapeHtml(trialKickoffPlan.latestDelivery.recipientEmail || "customer")} / ${escapeHtml(trialKickoffPlan.latestDelivery.feedbackStatus || "pending_feedback")}` : "none"}.</span>
          <span>${escapeHtml(trialKickoffPlan.constraints?.[1] || "Kickoff plan is bounded education SaaS trial operations only.")}</span>
          <div class="mini-list">${trialKickoffStepRows || "<span>No kickoff steps yet.</span>"}</div>
        </div>
        <span class="tag ${trialKickoffPlan.summary?.blocked ? "danger" : trialKickoffPlan.summary?.needsAction ? "warn" : ""}">Kickoff</span>
      </div>
      <div class="attempt-row ops-row">
        <div>
          <strong>Launch ops board</strong>
          <span>${escapeHtml(launchOps.decision || "education_launch_ops_review")} / blockers ${launchOps.summary?.blockers || 0} / readiness gaps ${launchOps.summary?.readinessGaps || 0} / procurement open ${launchOps.summary?.procurementActionsOpen || 0} / service SLA high ${launchOps.summary?.highPriorityServiceSlaItems || 0} / audit ${escapeHtml(launchOps.summary?.auditVerificationStatus || "not_sealed")}.</span>
          <span>Launch checklist ${launchOps.summary?.launchChecklistReady || 0}/${launchOps.summary?.launchChecklistTotal || 0}. productionReady remains ${String(launchOps.productionReady)}.</span>
          <span>Customer trial deliveries ${customerTrialDeliveries.summary?.total || 0}, pending feedback ${customerTrialDeliveries.summary?.feedbackPending || 0}, trial ready ${customerTrialDeliveries.summary?.trialReady || 0}, evidence requests ${customerTrialDeliveries.summary?.needsMoreEvidence || 0}, objections ${customerTrialDeliveries.summary?.objections || 0}, local simulated ${customerTrialDeliveries.summary?.localSimulated || 0}. ${escapeHtml(customerTrialDeliveries.provider?.productionNote || "Production email provider required before real delivery.")}</span>
          <span>${escapeHtml(launchOps.constraints?.[1] || "Launch ops board is education SaaS operations only.")}</span>
          <div class="mini-list">${launchLaneRows || "<span>No launch lanes yet.</span>"}</div>
          <div class="mini-list">${launchBlockerRows || "<span>No launch ops blockers detected in current prototype data.</span>"}</div>
          <div class="mini-list">${customerTrialDeliveryRows || "<span>No customer trial packet delivery records yet.</span>"}</div>
        </div>
        <span class="tag ${launchOps.summary?.blockers ? "danger" : "warn"}">Launch ops</span>
      </div>
      <div class="attempt-row ops-row">
        <div>
          <strong>Next-step engagement</strong>
          <span>Events ${nextStepEngagement.summary?.totalEvents || 0}, opened ${nextStepEngagement.summary?.opened || 0}, completed ${nextStepEngagement.summary?.completed || 0}, learners ${nextStepEngagement.summary?.learners || 0}, action types ${nextStepEngagement.summary?.actionTypes || 0}.</span>
          <span>${escapeHtml(nextStepEngagement.constraints?.[1] || "Education workflow follow-through only, not trading performance.")}</span>
          <div class="mini-list">${nextStepEngagementRows || "<span>No next-step engagement events yet.</span>"}</div>
        </div>
        <span class="tag warn">Learning ops</span>
      </div>
      <div class="attempt-row ops-row">
        <div>
          <strong>Pilot success checklist</strong>
          <span>Decision: ${escapeHtml(pilotChecklist.decision || "review")}. Met ${pilotChecklist.summary?.met || 0}/${pilotChecklist.summary?.total || 0}, watch ${pilotChecklist.summary?.watch || 0}, gaps ${pilotChecklist.summary?.gap || 0}.</span>
          <span>Actions open ${pilotActions.summary?.open || 0}, in progress ${pilotActions.summary?.inProgress || 0}, candidates ${pilotActions.summary?.candidates || 0}.</span>
          <span>Saved briefs ${pilotBriefs.summary?.total || 0}, draft ${pilotBriefs.summary?.draft || 0}, sent ${pilotBriefs.summary?.sent || 0}, reviewed ${pilotBriefs.summary?.reviewed || 0}.</span>
          <span>Brief deliveries ${pilotBriefDeliveries.summary?.total || 0}, pending feedback ${pilotBriefDeliveries.summary?.feedbackPending || 0}, renewal ready ${pilotBriefDeliveries.summary?.renewalReady || 0}, expansion ${pilotBriefDeliveries.summary?.expansionInterest || 0}, objections ${pilotBriefDeliveries.summary?.objections || 0}, local simulated ${pilotBriefDeliveries.summary?.localSimulated || 0}. ${escapeHtml(pilotBriefDeliveries.provider?.productionNote || "Production email provider required before real delivery.")}</span>
          <span>Expansion plan ${escapeHtml(pilotExpansion.decision || "review")} / target ${pilotExpansion.summary?.targetLearners || 0} learner(s) / cohort size ${pilotExpansion.summary?.recommendedCohortSize || 0} / coach capacity ${pilotExpansion.summary?.coachCapacityRemaining || 0}. Saved ${pilotExpansionPlans.summary?.total || 0}, approved ${pilotExpansionPlans.summary?.approved || 0}, in progress ${pilotExpansionPlans.summary?.inProgress || 0}, completed ${pilotExpansionPlans.summary?.completed || 0}, deferred ${pilotExpansionPlans.summary?.deferred || 0}. Launch ready ${pilotExpansionLaunch.summary?.ready || 0}/${pilotExpansionLaunch.summary?.total || 0}, needs action ${pilotExpansionLaunch.summary?.needsAction || 0}, blocked ${pilotExpansionLaunch.summary?.blocked || 0}. Launch briefs ${pilotExpansionLaunchBriefs.summary?.total || 0}, shared ${pilotExpansionLaunchBriefs.summary?.shared || 0}, reviewed ${pilotExpansionLaunchBriefs.summary?.reviewed || 0}.</span>
          <span>${escapeHtml(pilotChecklist.constraints?.[1] || "Education delivery and customer-success readiness only.")}</span>
          <div class="mini-list">${checklistRows}</div>
          <div class="mini-list">${pilotActionRows || "<span>No pilot success action candidates right now.</span>"}</div>
          <div class="mini-list">${pilotBriefRows || "<span>No saved pilot renewal briefs yet.</span>"}</div>
          <div class="mini-list">${pilotBriefDeliveryRows || "<span>No pilot renewal brief delivery records yet.</span>"}</div>
          <div class="mini-list">${savedExpansionRows || "<span>No saved pilot expansion plans yet.</span>"}</div>
          <div class="mini-list">${expansionLaunchRows || "<span>No pilot expansion launch checklist yet.</span>"}</div>
          <div class="mini-list">${expansionLaunchBriefRows || "<span>No saved pilot expansion launch briefs yet.</span>"}</div>
          <div class="mini-list">${expansionRows || "<span>No expansion plan rows yet.</span>"}</div>
        </div>
        <span class="tag ${pilotChecklist.summary?.gap ? "danger" : pilotChecklist.summary?.watch ? "warn" : ""}">${escapeHtml(pilotChecklist.decision || "review")}</span>
      </div>
      ${result.checks.map((item) => `
      <div class="attempt-row ops-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${item.evidence.map(escapeHtml).join(" / ")}</span>
          ${item.controls?.length ? `<span>${item.controls.slice(0, 4).map((control) => `${escapeHtml(control.key)}=${escapeHtml(control.status)}`).join(" / ")}</span>` : ""}
          <span>Next: ${escapeHtml(item.next)}</span>
          <span>${escapeHtml(result.constraints?.[1] || "Education product readiness only.")}</span>
        </div>
        <span class="tag ${item.status === "ready" ? "warn" : "danger"}">${escapeHtml(item.status)}</span>
      </div>
    `).join("")}
    `;
    await refreshReadinessRemediation();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Product readiness requires admin login: ${error.message}`;
    nodes.productReadinessList.innerHTML = "";
    if (nodes.readinessRemediationList) nodes.readinessRemediationList.innerHTML = "";
  }
}

async function refreshReadinessRemediation() {
  if (!nodes.readinessRemediationList) return;
  try {
    const result = await api("/api/admin/readiness-remediation-tasks");
    const tasks = (result.tasks || []).slice(0, 8).map((task) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <span>${escapeHtml(task.sourceKey)} / ${escapeHtml(task.priority || "medium")} / ${escapeHtml(task.status || "open")}</span>
          <span>${(task.evidence || []).slice(0, 2).map(escapeHtml).join(" / ")}</span>
          <span>Next: ${escapeHtml(task.next || "")}</span>
          <span>${task.ownerEmail ? `Owner ${escapeHtml(task.ownerEmail)}` : "No owner assigned"}${task.dueAt ? ` / due ${escapeHtml(task.dueAt)}` : ""}</span>
        </div>
        <div class="billing-actions">
          ${task.status !== "in_progress" ? `<button type="button" data-readiness-task-status="in_progress" data-readiness-task-id="${escapeHtml(task.id)}">Start</button>` : ""}
          ${task.status !== "done" ? `<button type="button" data-readiness-task-status="done" data-readiness-task-id="${escapeHtml(task.id)}">Done</button>` : ""}
          ${task.status !== "deferred" ? `<button type="button" data-readiness-task-status="deferred" data-readiness-task-id="${escapeHtml(task.id)}">Defer</button>` : ""}
        </div>
      </div>
    `).join("");
    const candidates = (result.candidates || []).slice(0, 4).map((item) => `
      <div class="mini-row">
        <span>${escapeHtml(item.title)} / ${escapeHtml(item.priority)} / ${escapeHtml(item.status)}</span>
        <span>${escapeHtml(item.sourceKey)}</span>
      </div>
    `).join("");
    nodes.readinessRemediationList.innerHTML = `
      <p class="muted-note">Open ${result.summary.open || 0}, in progress ${result.summary.inProgress || 0}, candidates ${result.summary.candidates || 0}. These are product operations tasks only.</p>
      ${tasks || "<p>No readiness remediation tasks yet.</p>"}
      ${candidates ? `<div class="mini-list">${candidates}</div>` : ""}
    `;
  } catch (error) {
    nodes.readinessRemediationList.innerHTML = `<p>Readiness remediation requires admin login: ${escapeHtml(error.message)}</p>`;
  }
}

async function createReadinessTasks() {
  if (!nodes.readinessRemediationList) return;
  nodes.createReadinessTasks.disabled = true;
  try {
    await api("/api/admin/readiness-remediation-tasks/bulk", {
      method: "POST",
      body: JSON.stringify({ maxCreate: 6, ownerEmail: "ops@tradegym.local" }),
    });
    await refreshReadinessRemediation();
  } catch (error) {
    nodes.readinessRemediationList.innerHTML = `<p>Readiness task creation failed: ${escapeHtml(error.message)}</p>`;
  } finally {
    nodes.createReadinessTasks.disabled = false;
  }
}

async function updateReadinessTask(taskId, status) {
  if (!taskId || !status) return;
  try {
    await api("/api/admin/readiness-remediation-tasks/update", {
      method: "POST",
      body: JSON.stringify({
        taskId,
        status,
        ownerEmail: "ops@tradegym.local",
        resolutionNote: status === "done"
          ? "Marked complete in the local product readiness prototype. Production evidence must still be verified separately."
          : "Updated from the local product readiness prototype.",
      }),
    });
    await refreshProductReadiness();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Readiness task update failed: ${error.message}`;
  }
}

function renderBilling() {
  const cards = document.querySelectorAll(".price-card");
  state.data.billing.plans.forEach((plan, index) => {
    const card = cards[index];
    if (!card) return;
    card.querySelector("h3").textContent = plan.name;
    card.querySelector("strong").textContent = plan.price;
    card.querySelector("p").textContent = plan.description;
  });
  renderBillingState();
}

async function refreshEntitlement() {
  try {
    const result = await api("/api/billing/entitlements");
    state.data.entitlement = result.entitlement;
    state.data.billingState = result.billing;
    renderEntitlement();
    renderBillingState();
    await refreshReceipts();
    if (nodes.billingStatus) nodes.billingStatus.textContent = "Entitlement refreshed.";
  } catch (error) {
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Entitlement failed: ${error.message}`;
  }
}

async function checkout(plan) {
  try {
    const result = await api("/api/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    state.data.user = result.user;
    state.data.session = result.session;
    state.data.entitlement = result.entitlement;
    state.data.billingState = result.billing;
    renderSession();
    renderEntitlement();
    renderBillingState();
    await refreshReceipts();
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Created ${plan} order. Simulate payment to activate.`;
  } catch (error) {
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Checkout failed: ${error.message}`;
  }
}

async function buyCoachReviewAddon() {
  try {
    const result = await api("/api/billing/addon-checkout-session", {
      method: "POST",
      body: JSON.stringify({ productId: "coach_review_1" }),
    });
    state.data.entitlement = result.entitlement;
    state.data.billingState = result.billing;
    renderEntitlement();
    renderBillingState();
    await refreshReceipts();
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Created add-on order: ${result.order.plan}. Simulate payment to add one coach review.`;
  } catch (error) {
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Add-on checkout failed: ${error.message}`;
  }
}

async function cancelSubscription() {
  try {
    const result = await api("/api/billing/cancel-subscription", {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.data.entitlement = result.entitlement;
    state.data.billingState = result.billing;
    renderEntitlement();
    renderBillingState();
    await refreshReceipts();
    await refreshRevenueLedger();
    await refreshRevenueOps();
    if (nodes.billingStatus) nodes.billingStatus.textContent = "Subscription canceled. Access returned to Starter for this local education SaaS demo.";
  } catch (error) {
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Cancel subscription failed: ${error.message}`;
  }
}

async function requestRefundReview() {
  try {
    const result = await api("/api/billing/refund-request", {
      method: "POST",
      body: JSON.stringify({
        reason: "Please review my latest education SaaS subscription order for a refund. This is a billing support request, not trading advice.",
      }),
    });
    state.data.supportTickets = result.support?.tickets || state.data.supportTickets || [];
    renderSupportTickets(state.data.supportTickets);
    await refreshAdminSupportTickets();
    await refreshAuditLog();
    if (nodes.billingStatus) nodes.billingStatus.textContent = `${result.reused ? "Reused" : "Created"} refund support ticket ${result.ticket.id}.`;
  } catch (error) {
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Refund request failed: ${error.message}`;
  }
}

async function simulateBillingEvent(type, orderId) {
  try {
    const result = await api("/api/billing/webhook", {
      method: "POST",
      body: JSON.stringify({ type, orderId }),
    });
    state.data.user = result.user;
    state.data.session = result.session;
    state.data.entitlement = result.entitlement;
    state.data.billingState = result.billing;
    renderSession();
    renderEntitlement();
    renderBillingState();
    await refreshReceipts();
    await refreshRevenueLedger();
    await refreshRevenueOps();
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Processed billing event: ${type}`;
  } catch (error) {
    if (nodes.billingStatus) nodes.billingStatus.textContent = `Billing event failed: ${error.message}`;
  }
}
function renderOps() {
  if (nodes.publishChecklist) {
    nodes.publishChecklist.innerHTML = state.data.ops.publishChecklist.map((item) => `<span>${item}</span>`).join("");
  }
  refreshMetrics();
  refreshRevenueOps();
  refreshRevenueOpsActions();
  refreshRevenueLedger();
  refreshProductReadiness();
  refreshReadiness();
  refreshDataSources();
  refreshTeachingEvolutionLab();
  renderKnowledgePoints();
  refreshContentJobs();
  refreshAdminUsers();
  refreshCoachConsole();
  refreshServiceDelivery();
  refreshAdminCoachSessions();
  refreshCoachTasks();
  refreshCohorts();
  refreshReviewQueue();
  refreshEducationModelRuns();
  refreshAuditLog();
  refreshCoursePackages();
}

async function refreshMetrics() {
  if (!nodes.opsMetrics) return;
  try {
    const metrics = await api("/api/admin/metrics");
    const topMistakes = metrics.topMistakes.length
      ? metrics.topMistakes.map(([tag, count]) => `${tag} x${count}`).join(" / ")
      : "No profile yet";
    const activation = metrics.activationFunnel || {};
    const activationBuckets = activation.buckets || {};
    const nextLearningSummary = activation.nextLearningSummary || {};
    nodes.opsMetrics.innerHTML = `
      <span>Users ${metrics.users}</span>
      <span>Activation learners ${activation.totalLearners || 0}</span>
      <span>Activation avg ${activation.averagePercent || 0}%</span>
      <span>Next learning ${nextLearningSummary.opened || 0} opened / ${nextLearningSummary.unread || 0} unread</span>
      <span>Activation compliance ${activationBuckets.compliance || 0}</span>
      <span>Activation drill ${activationBuckets.first_training || 0}</span>
      <span>Activation replay ${activationBuckets.first_replay || 0}</span>
      <span>Scenarios ${metrics.scenarios}</span>
      <span>Attempts ${metrics.attempts}</span>
      <span>Replay notes ${metrics.replayNotes}</span>
      <span>Paper trades ${metrics.paperTrades}</span>
      <span>Report deliveries ${metrics.learnerReportDeliveries || 0}</span>
      <span>Assignments ${metrics.practiceAssignments || 0}</span>
      <span>Cohorts ${metrics.cohorts || 0}</span>
      <span>Packages ${metrics.coursePackages || 0}</span>
      <span>Enrollments ${metrics.courseEnrollments || 0}</span>
      <span>Package assignments ${metrics.coursePackageAssignments || 0}</span>
      <span>Completion reports ${metrics.completionReports || 0}</span>
      <span>Education model runs ${metrics.educationModelRuns || 0}</span>
      <span>Activation interventions ${metrics.openActivationInterventions || 0} open / ${metrics.activationInterventions || 0} total</span>
      <span>Content jobs ${metrics.contentProcessingJobs || 0}</span>
      <span>Audit logs ${metrics.auditLogs}</span>
      <span>Review queue ${metrics.reviewQueue}</span>
      <span>Net revenue ¥${((metrics.revenue?.netCents || 0) / 100).toFixed(2)}</span>
      <span>AI ${metrics.aiCoach.provider}/${metrics.aiCoach.mode}</span>
      <span>Top mistakes ${topMistakes}</span>
    `;
    if (nodes.activationFunnelList) {
      const queue = activation.interventionQueue || [];
      const nextQueue = activation.nextLearningQueue || [];
      const nextQueueHtml = nextQueue.length
        ? `
          <div class="section-head compact-head">
            <div>
              <p class="eyebrow">Next Learning Queue</p>
              <h3>Opened next-step education leads</h3>
            </div>
          </div>
          ${nextQueue.map((learner) => `
            <div class="attempt-row">
              <div>
                <strong>${escapeHtml(learner.name || learner.email || learner.userId)} <span class="muted-inline">${escapeHtml(learner.email || learner.userId)}</span></strong>
                <span>${escapeHtml(learner.plan || "Starter")} / ${escapeHtml(learner.status || "unread")} / ${escapeHtml(learner.reason || "learning_progress")}</span>
                <span>${escapeHtml(learner.title || "Education step")} / ${escapeHtml(learner.action || "Continue education-only practice.")}</span>
                <span>Focus: ${escapeHtml(learner.focus || "Build the next structured practice step.")}</span>
                <span>${escapeHtml(learner.constraints?.[1] || "No stock recommendation, live signal, return promise, or real-money trading instruction.")}</span>
              </div>
              <div class="billing-actions">
                <span class="tag ${learner.status === "opened" ? "warn" : "danger"}">${escapeHtml(learner.status || "unread")}</span>
                ${learner.coursePackageId ? `<button type="button" data-activation-action="assign-package" data-user-id="${escapeHtml(learner.userId)}" data-course-package-id="${escapeHtml(learner.coursePackageId)}">Assign package</button>` : ""}
                ${learner.sourceCompletionReportId ? `<button type="button" data-activation-action="completion-followup" data-report-id="${escapeHtml(learner.sourceCompletionReportId)}">Create follow-up</button>` : ""}
              </div>
            </div>
          `).join("")}
        `
        : "";
      const activationQueueHtml = queue.length
        ? queue.map((learner) => `
          <div class="attempt-row">
            <div>
              <strong>${escapeHtml(learner.name || learner.email || learner.userId)} <span class="muted-inline">${escapeHtml(learner.email || learner.userId)}</span></strong>
              <span>${escapeHtml(learner.plan || "Starter")} / ${escapeHtml(learner.currentStepId || "onboarding")} / ${learner.percent || 0}% complete</span>
              <span>Next: ${escapeHtml(learner.currentAction || "Continue education onboarding.")}</span>
              ${learner.recommendedScenario ? `<span>Drill: ${escapeHtml(learner.recommendedScenario.title)} / ${escapeHtml(learner.recommendedScenario.symbol || "")} ${escapeHtml(learner.recommendedScenario.timeframe || "")}</span>` : ""}
              ${learner.nextLearningProduct ? `<span>Next product: ${escapeHtml(learner.nextLearningProduct.title || "Education step")} / ${escapeHtml(learner.nextLearningProduct.action || "Continue education-only practice.")} / ${escapeHtml(learner.nextLearningProduct.status || "unread")}</span>` : ""}
              <span>${escapeHtml(activation.constraints?.[1] || "Not investment advice, live signal, return evidence, broker readiness, or real-money trading readiness.")}</span>
            </div>
            <div class="billing-actions">
              <span class="tag danger">Activation</span>
              ${learner.nextLearningProduct?.coursePackageId ? `<button type="button" data-activation-action="assign-package" data-user-id="${escapeHtml(learner.userId)}" data-course-package-id="${escapeHtml(learner.nextLearningProduct.coursePackageId)}">Assign package</button>` : ""}
              <button type="button" data-activation-action="create-intervention" data-user-id="${escapeHtml(learner.userId)}" data-step-id="${escapeHtml(learner.currentStepId || "onboarding")}">Create intervention</button>
            </div>
          </div>
        `).join("")
        : "<p>No activation intervention queue items.</p>";
      nodes.activationFunnelList.innerHTML = `${nextQueueHtml}${activationQueueHtml}`;
    }
    await refreshActivationInterventions();
  } catch (error) {
    nodes.opsMetrics.innerHTML = `<span>Metrics require admin login: ${error.message}</span>`;
    if (nodes.activationFunnelList) nodes.activationFunnelList.innerHTML = "";
    if (nodes.activationInterventionList) nodes.activationInterventionList.innerHTML = "";
  }
}

async function refreshRevenueOps() {
  if (!nodes.revenueOpsList) return;
  try {
    const result = await api("/api/admin/revenue-ops?limit=40");
    const summary = result.summary || {};
    nodes.revenueOpsStatus.textContent = `Active accounts ${summary.activeAccounts || 0} / subscriptions ${summary.activeSubscriptions || 0} / high risk ${summary.highRisk || 0} / medium risk ${summary.mediumRisk || 0} / net revenue ¥${((summary.netRevenueCents || 0) / 100).toFixed(2)}`;
    nodes.revenueOpsList.innerHTML = result.items?.length
      ? result.items.map((item) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(item.learnerName || "Learner")} <span class="muted-inline">${escapeHtml(item.email || "")}</span></strong>
            <span>Plan ${escapeHtml(item.plan)} / subscription ${item.activeSubscription ? "active" : "none"} / paid orders ${item.paidOrders}</span>
            <span>Training ${item.habit.totalTraining} / active days ${item.habit.activeTrainingDays} / streak ${item.habit.streakDays} / risk discipline ${item.habit.averageRiskDiscipline ?? "--"}</span>
            <span>Service deliveries ${item.service.deliveries} / follow-ups ${item.service.openFollowUps} / needs follow-up ${item.service.needsFollowUp}</span>
            <span>Coach sessions ${item.service.coachSessions?.completed || 0} completed / post drills ${item.service.coachSessions?.completedPostAssignments || 0}/${item.service.coachSessions?.postAssignments || 0}</span>
            <span>Risk reasons: ${(item.riskReasons || []).map(escapeHtml).join(", ") || "none"}</span>
            <span>Next: ${escapeHtml(item.nextAction)}</span>
            <span>${escapeHtml(result.constraints?.[1] || "Education revenue ops only.")}</span>
          </div>
          <div class="profile-tags">
            <span class="tag ${item.renewalRisk === "high" ? "danger" : "warn"}">${escapeHtml(item.renewalRisk)}</span>
            <button type="button" data-revenue-action="send_reminder" data-user-id="${escapeHtml(item.userId)}">Send reminder</button>
            <button type="button" data-revenue-action="assign_practice" data-user-id="${escapeHtml(item.userId)}">Assign drill</button>
            <button type="button" data-revenue-action="create_followup" data-user-id="${escapeHtml(item.userId)}">Create follow-up</button>
          </div>
        </div>
      `).join("")
      : "<p>No revenue ops records match the current filters.</p>";
  } catch (error) {
    nodes.revenueOpsStatus.textContent = `Revenue ops requires admin login: ${error.message}`;
    nodes.revenueOpsList.innerHTML = "";
  }
}

async function refreshRevenueOpsActions() {
  if (!nodes.revenueOpsActionList) return;
  try {
    const result = await api("/api/admin/revenue-ops/actions?limit=40");
    const summary = result.summary || {};
    nodes.revenueOpsActionList.innerHTML = `
      <div class="check-grid">
        <span>Total ${summary.total || 0}</span>
        <span>Reminders ${summary.reminders || 0}</span>
        <span>Assignments ${summary.assignments || 0}</span>
        <span>Follow-ups ${summary.followUps || 0}</span>
        <span>Practice completed ${summary.practiceCompleted || 0}</span>
        <span>Pending ${summary.pending || 0}</span>
      </div>
      ${result.actions?.length ? result.actions.map((item) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(item.learnerName || "Learner")} <span class="muted-inline">${escapeHtml(item.email || "")}</span></strong>
            <span>${escapeHtml(item.type)} / ${formatTime(item.createdAt)} / outcome ${escapeHtml(item.outcome)}</span>
            <span>Training after action ${item.trainingAfterAction} / paid orders after action ${item.paidOrdersAfterAction}</span>
            <span>${item.assignment ? `Assignment ${escapeHtml(item.assignment.scenarioTitle)} / ${escapeHtml(item.assignment.status)}` : item.task ? `Task ${escapeHtml(item.task.focus)} / ${escapeHtml(item.task.status)}` : "Reminder action"}</span>
            <span>${escapeHtml(result.constraints?.[1] || "Education revenue ops only.")}</span>
          </div>
          <span class="tag ${item.outcome === "pending" ? "danger" : "warn"}">${escapeHtml(item.outcome)}</span>
        </div>
      `).join("") : "<p>No revenue ops actions yet.</p>"}
    `;
  } catch (error) {
    nodes.revenueOpsActionList.innerHTML = `<p>Revenue ops action history requires admin login: ${error.message}</p>`;
  }
}

async function runRevenueOpsAction(userId, action) {
  if (!nodes.revenueOpsStatus) return;
  try {
    const result = await api("/api/admin/revenue-ops/actions", {
      method: "POST",
      body: JSON.stringify({ userId, action }),
    });
    const label = result.assignment?.scenarioTitle || result.task?.focus || result.action?.action || action;
    nodes.revenueOpsStatus.textContent = `Revenue ops action processed: ${label}`;
    await refreshRevenueOps();
    await refreshRevenueOpsActions();
    await refreshAssignments();
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.revenueOpsStatus.textContent = `Revenue ops action failed: ${error.message}`;
  }
}

async function createActivationIntervention(userId, stepId) {
  if (!nodes.opsMetrics) return;
  try {
    const result = await api("/api/admin/activation-interventions", {
      method: "POST",
      body: JSON.stringify({
        userId,
        focus: `Activation follow-up: ${stepId || "onboarding"}`,
      }),
    });
    nodes.opsMetrics.insertAdjacentHTML(
      "afterbegin",
      `<span>Activation intervention ${result.reused ? "reused" : "created"}: ${escapeHtml(result.task?.email || userId)}</span>`
    );
    await refreshMetrics();
    await refreshActivationInterventions();
    await refreshAuditLog();
  } catch (error) {
    nodes.opsMetrics.insertAdjacentHTML(
      "afterbegin",
      `<span>Activation intervention failed: ${escapeHtml(error.message)}</span>`
    );
  }
}

async function refreshActivationInterventions() {
  if (!nodes.activationInterventionList) return;
  try {
    const result = await api("/api/admin/activation-interventions?limit=40");
    const totals = result.totals || {};
    nodes.activationInterventionList.innerHTML = `
      <div class="check-grid">
        <span>Open ${totals.open || 0}</span>
        <span>Deferred ${totals.deferred || 0}</span>
        <span>Completed ${totals.completed || 0}</span>
        <span>Canceled ${totals.canceled || 0}</span>
      </div>
      ${result.tasks?.length ? result.tasks.map((task) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(task.learnerName || "Learner")} <span class="muted-inline">${escapeHtml(task.email || "")}</span></strong>
            <span>${escapeHtml(task.status)} / ${escapeHtml(task.currentStepId || "onboarding")} / ${task.activationPercent || 0}% activation / age ${task.ageHours ?? 0}h</span>
            <span>Learner opened: ${task.learnerOpened ? `yes / ${formatTime(task.learnerOpenedAt)}` : "not yet"}</span>
            <span>Focus: ${escapeHtml(task.focus || "Activation follow-up")}</span>
            <span>Next: ${escapeHtml(task.currentAction || "Continue education onboarding.")}</span>
            ${task.recommendedScenario ? `<span>Drill: ${escapeHtml(task.recommendedScenario.title)} / ${escapeHtml(task.recommendedScenario.symbol || "")} ${escapeHtml(task.recommendedScenario.timeframe || "")}</span>` : ""}
            <span>${escapeHtml(result.constraints?.[1] || "No stock recommendation, live signal, return promise, broker connection, or real-money trading instruction.")}</span>
          </div>
          <div class="billing-actions">
            ${task.status === "open" ? `<button type="button" data-activation-task-status="completed" data-task-id="${escapeHtml(task.id)}">Complete</button>` : ""}
            ${task.status === "open" ? `<button type="button" data-activation-task-status="deferred" data-task-id="${escapeHtml(task.id)}">Defer</button>` : ""}
            ${task.status === "open" ? `<button type="button" data-activation-task-status="canceled" data-task-id="${escapeHtml(task.id)}">Cancel</button>` : ""}
            <span class="tag ${task.status === "open" ? "danger" : "warn"}">${escapeHtml(task.status)}</span>
          </div>
        </div>
      `).join("") : "<p>No activation intervention tasks yet.</p>"}
    `;
  } catch (error) {
    nodes.activationInterventionList.innerHTML = `<p>Activation interventions require admin login: ${error.message}</p>`;
  }
}

async function updateActivationIntervention(taskId, status) {
  if (!nodes.activationInterventionList) return;
  try {
    await api("/api/admin/activation-interventions/update", {
      method: "POST",
      body: JSON.stringify({
        taskId,
        status,
        resolutionNote: `Marked ${status} from activation ops console. Education-only operations note with no market advice or real-money instruction.`,
      }),
    });
    await refreshMetrics();
    await refreshActivationInterventions();
    await refreshAuditLog();
  } catch (error) {
    nodes.activationInterventionList.insertAdjacentHTML(
      "afterbegin",
      `<p>Activation intervention update failed: ${escapeHtml(error.message)}</p>`
    );
  }
}

async function refreshReadiness() {
  if (!nodes.readinessGrid) return;
  try {
    const result = await api("/api/system/readiness");
    nodes.readinessStatus.textContent = result.productionReady
      ? "Configured for production readiness checks."
      : "Local/demo mode: production replacement points remain.";
    nodes.readinessGrid.innerHTML = result.checks.map((check) => `
      <span class="${check.ok ? "" : "readiness-warn"}">
        ${check.key}: ${check.mode}
        ${check.productionRequired && !check.ok ? " / production gap" : ""}
      </span>
    `).join("");
  } catch (error) {
    nodes.readinessStatus.textContent = `Readiness check failed: ${error.message}`;
    nodes.readinessGrid.innerHTML = "";
  }
}

async function refreshFriendProviderStatus() {
  if (!nodes.friendProviderStatus) return;
  try {
    const result = await api("/api/system/readiness");
    nodes.friendProviderStatus.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>${result.productionReady ? "外部 AI 检查中" : "本地 demo / mock provider"}</strong>
          <span>没有 API Key 时，这里用本地演示 AI 和演示行情，不会调用真实大模型。</span>
          <span>以后即使接真实 LLM，也只做教育复盘，不允许输出荐股、买卖信号或实盘建议。</span>
        </div>
        <span class="tag danger">非实盘</span>
      </div>
    `;
  } catch (error) {
    nodes.friendProviderStatus.innerHTML = `<p>AI 模式检查失败：${escapeHtml(error.message)}。当前仍按本地 demo / mock provider 试用处理。</p>`;
  }
}

async function refreshDataSources() {
  if (!nodes.dataSourceGrid) return;
  try {
    const result = await api("/api/admin/data-sources");
    nodes.dataSourceStatus.textContent = `Scenarios ${result.summary.scenarios}, demo ${result.summary.demoScenarios}, missing source ${result.summary.missingSource}, needs review ${result.summary.needsSourceReview}, controls ready ${result.summary.controlsReady || 0}, gap ${result.summary.controlsGap || 0}`;
    const providers = result.providers.map((provider) => `
      <div class="attempt-row">
        <div>
          <strong>${provider.key}: ${provider.provider}</strong>
          <span>${provider.mode} / production ${provider.productionReady ? "ready" : "gap"}</span>
          <span>${provider.productionNote || "Provider replacement required before production."}</span>
        </div>
        <span class="tag ${provider.productionReady ? "warn" : "danger"}">${provider.productionReady ? "ready" : "gap"}</span>
      </div>
    `).join("");
    const controls = (result.controls || []).map((control) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(control.title)}</strong>
          <span>${(control.evidence || []).map(escapeHtml).join(" / ")}</span>
          <span>Next: ${escapeHtml(control.next || "")}</span>
        </div>
        <span class="tag ${control.status === "ready" ? "warn" : control.status === "partial" ? "warn" : "danger"}">${escapeHtml(control.status)}</span>
      </div>
    `).join("");
    const scenarios = result.scenarios.slice(0, 10).map((scenario) => `
      <div class="attempt-row">
        <div>
          <strong>${scenario.title}</strong>
          <span>${scenario.symbol} / ${scenario.timeframe} / ${scenario.sourceProvider}/${scenario.sourceMode}</span>
          <span>Market ${scenario.marketDataProvider} / ${scenario.marketDataLicense}; News ${scenario.newsProvider} / ${scenario.newsLicense}</span>
        </div>
        <span class="tag ${scenario.needsSourceReview ? "danger" : "warn"}">${scenario.needsSourceReview ? "review" : "cleared"}</span>
      </div>
    `).join("");
    nodes.dataSourceGrid.innerHTML = `
      ${providers}
      <p class="muted-note">${result.constraints[0]}</p>
      ${controls}
      ${scenarios || "<p>No scenarios available.</p>"}
    `;
    await refreshDataGovernanceQueue();
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Data source governance requires admin login: ${error.message}`;
    nodes.dataSourceGrid.innerHTML = "";
    if (nodes.dataGovernanceQueue) nodes.dataGovernanceQueue.innerHTML = "";
  }
}

async function refreshDatasetManifest() {
  if (!nodes.dataSourceGrid || !nodes.dataSourceStatus) return;
  try {
    const result = await api("/api/admin/historical-training-dataset-manifest");
    nodes.dataSourceStatus.textContent = `Dataset manifest: ${result.summary.total} datasets, ${result.summary.internalDemoOnly} internal-demo-only, ${result.summary.blockers} blocker(s). Education evidence only.`;
    const rows = (result.datasets || []).slice(0, 12).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.datasetId)} / ${escapeHtml(item.symbol)} / ${escapeHtml(item.timeframe)} / ${item.candleCount} candles</span>
          <span>Release ${escapeHtml(item.releaseStatus)} / license ${escapeHtml(item.licenseStatus)} / review ${escapeHtml(item.reviewStatus)}</span>
          <span>Market ${escapeHtml(item.providers?.marketData || "unknown")} (${escapeHtml(item.providers?.marketDataLicense || "unknown")}) / News ${escapeHtml(item.providers?.news || "unknown")} (${escapeHtml(item.providers?.newsLicense || "unknown")})</span>
          <span>${escapeHtml(item.nextAction || "Keep dataset evidence attached.")}</span>
        </div>
        <span class="tag ${item.blockers?.length ? "danger" : "warn"}">${item.blockers?.length || 0} blocker(s)</span>
      </div>
    `).join("");
    nodes.dataSourceGrid.innerHTML = `
      <div class="attempt-row ops-row">
        <div>
          <strong>${escapeHtml(result.schemaVersion)}</strong>
          <span>Release candidates ${result.summary.releaseCandidates}, production ready ${result.summary.productionReady ? "yes" : "no"}</span>
          <span>${escapeHtml(result.constraints?.[2] || "Production use requires licensed provider evidence and visible source labels.")}</span>
        </div>
        <span class="tag danger">not production ready</span>
      </div>
      ${rows || "<p>No historical training datasets available.</p>"}
    `;
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Dataset manifest requires admin login: ${escapeHtml(error.message)}`;
  }
}

async function exportDatasetManifest(format = "md") {
  if (!nodes.dataSourceGrid || !nodes.dataSourceStatus) return;
  try {
    const response = await fetch(`/api/admin/historical-training-dataset-manifest/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Dataset manifest export failed");
    }
    const text = await response.text();
    nodes.dataSourceStatus.textContent = `Dataset manifest export ready: ${format.toUpperCase()} / ${text.length} bytes. Education data-governance evidence only.`;
    nodes.dataSourceGrid.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Historical training dataset manifest (${escapeHtml(format.toUpperCase())})</strong>
            <span>Evidence for source labels, licensing state, review state, and allowed education-only use. No trading-performance or readiness claim.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Dataset manifest export failed: ${escapeHtml(error.message)}`;
  }
}

async function refreshOpenSourceReferenceMap() {
  if (!nodes.dataSourceGrid || !nodes.dataSourceStatus) return;
  try {
    const result = await api("/api/admin/open-source-reference-map");
    nodes.dataSourceStatus.textContent = `Open-source reference map: ${result.summary.total} references, ${result.summary.forbiddenUseCount} forbidden use cases. Education design only.`;
    const rows = (result.references || []).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.category)} / maps to ${(item.productMapping || []).map(escapeHtml).join(", ")}</span>
          <span>Useful for: ${(item.usefulFor || []).map(escapeHtml).join(" / ")}</span>
          <span>Forbidden: ${(item.forbiddenUses || []).map(escapeHtml).join(", ")}</span>
          <span>${escapeHtml(item.boundary || "")}</span>
        </div>
        <span class="tag danger">no execution</span>
      </div>
    `).join("");
    nodes.dataSourceGrid.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(result.schemaVersion)}</strong>
            <span>${escapeHtml(result.constraints?.[1] || "No trading execution or signal use.")}</span>
          </div>
          <span class="tag warn">reference only</span>
        </div>
        ${rows}
      `
    );
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Open-source reference map requires admin login: ${escapeHtml(error.message)}`;
  }
}

async function exportOpenSourceReferenceMap(format = "md") {
  if (!nodes.dataSourceGrid || !nodes.dataSourceStatus) return;
  try {
    const response = await fetch(`/api/admin/open-source-reference-map/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Open-source reference map export failed");
    }
    const text = await response.text();
    nodes.dataSourceStatus.textContent = `Open-source reference map export ready: ${format.toUpperCase()} / ${text.length} bytes. Education governance only.`;
    nodes.dataSourceGrid.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Open-source reference map (${escapeHtml(format.toUpperCase())})</strong>
            <span>Reference governance evidence only. No stock recommendation, live signal, return promise, broker connectivity, auto-trading, or real-money instruction.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Open-source reference map export failed: ${escapeHtml(error.message)}`;
  }
}

async function refreshOpenSourceReferenceReviews() {
  if (!nodes.dataGovernanceQueue || !nodes.dataSourceStatus) return;
  try {
    const result = await api("/api/admin/open-source-reference-reviews");
    nodes.dataSourceStatus.textContent = `Open-source reference reviews: ${result.summary.needsReview} need review, ${result.summary.approvedForDesignReference} approved as design references, ${result.summary.rejectedForForbiddenUse} rejected.`;
    const items = (result.items || []).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.category)} / ${escapeHtml(item.status)} / owner ${escapeHtml(item.ownerEmail || "governance@tradegym.local")}</span>
          <span>Maps to ${(item.productMapping || []).map(escapeHtml).join(", ")}</span>
          <span>Forbidden: ${(item.forbiddenUses || []).map(escapeHtml).join(", ")}</span>
          <span>${escapeHtml(item.nextReviewAction || item.boundary || "")}</span>
        </div>
        <div class="billing-actions">
          <button type="button" data-open-source-review-status="approved_for_design_reference" data-open-source-reference-key="${escapeHtml(item.referenceKey)}">Approve design</button>
          <button type="button" data-open-source-review-status="rejected_for_forbidden_use" data-open-source-reference-key="${escapeHtml(item.referenceKey)}">Reject</button>
        </div>
      </div>
    `).join("");
    nodes.dataGovernanceQueue.innerHTML = `
      <div class="attempt-row ops-row">
        <div>
          <strong>${escapeHtml(result.schemaVersion)}</strong>
          <span>Total ${result.summary.total}, pending ${result.summary.needsReview}, approved ${result.summary.approvedForDesignReference}, rejected ${result.summary.rejectedForForbiddenUse}</span>
          <span>${escapeHtml(result.constraints?.[1] || "Approval is design governance only.")}</span>
        </div>
        <span class="tag warn">education only</span>
      </div>
      ${items || "<p>No open-source references to review.</p>"}
    `;
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Open-source reference reviews require admin login: ${escapeHtml(error.message)}`;
  }
}

async function refreshPilotSuccessActions() {
  await refreshProductReadiness();
}

async function updateOpenSourceReferenceReview(referenceKey, status) {
  if (!nodes.dataSourceStatus) return;
  const approved = status === "approved_for_design_reference";
  try {
    const result = await api("/api/admin/open-source-reference-reviews/update", {
      method: "POST",
      body: JSON.stringify({
        referenceKey,
        status,
        ownerEmail: state.data?.account?.email || "governance@tradegym.local",
        decisionNote: approved
          ? "Approved as education design reference only; no dependency installation, execution workflow, broker connection, automation, or real-money readiness proof."
          : "Rejected for forbidden-use risk; keep as boundary example for education governance only.",
      }),
    });
    nodes.dataSourceStatus.textContent = `${result.review.referenceName} marked ${result.review.status}. Production ready: ${result.productionReady ? "yes" : "no"}.`;
    await refreshOpenSourceReferenceReviews();
    await refreshAuditLog();
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Open-source reference review failed: ${escapeHtml(error.message)}`;
  }
}

async function refreshDataGovernanceQueue() {
  if (!nodes.dataGovernanceQueue) return;
  try {
    const result = await api("/api/admin/data-governance-queue?limit=30");
    const items = (result.items || []).slice(0, 12).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.title || item.sourceKey)}</strong>
          <span>${escapeHtml(item.type)} / ${escapeHtml(item.status || "gap")} / ${escapeHtml(item.priority || "medium")}</span>
          <span>${(item.evidence || []).map(escapeHtml).join(" / ")}</span>
          <span>${escapeHtml(item.nextAction || "Review source governance before release.")}</span>
        </div>
        <div class="billing-actions">
          <button type="button" data-data-governance-action="acknowledge" data-data-governance-id="${escapeHtml(item.id)}">Ack</button>
          <button type="button" data-data-governance-action="assign_owner" data-data-governance-id="${escapeHtml(item.id)}">Assign</button>
          <button type="button" data-data-governance-action="request_legal_review" data-data-governance-id="${escapeHtml(item.id)}">Legal</button>
        </div>
      </div>
    `).join("");
    const recent = (result.recentActions || []).slice(0, 3).map((action) => `
      <span>${escapeHtml(action.action)} ${escapeHtml(action.queueItemId)} by ${escapeHtml(action.createdByEmail || action.ownerEmail || "admin")}</span>
    `).join("");
    nodes.dataGovernanceQueue.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>Data governance queue</strong>
          <span>Total ${result.summary?.total || 0}, high ${result.summary?.highPriority || 0}, production blocking ${result.summary?.productionBlocking || 0}</span>
          <span>${escapeHtml(result.constraints?.[2] || "Demo and source labels must stay visible until licensed evidence is attached.")}</span>
          ${recent || "<span>No recent governance actions.</span>"}
        </div>
        <span class="tag danger">not production ready</span>
      </div>
      ${items || "<p>No data governance queue items.</p>"}
    `;
  } catch (error) {
    nodes.dataGovernanceQueue.innerHTML = `<p>Data governance queue requires admin login: ${escapeHtml(error.message)}</p>`;
  }
}

async function runDataGovernanceAction(queueItemId, action) {
  if (!nodes.dataGovernanceQueue) return;
  try {
    const result = await api("/api/admin/data-governance-queue/actions", {
      method: "POST",
      body: JSON.stringify({
        queueItemId,
        action,
        ownerEmail: state.data?.account?.email || "",
        note: action === "request_legal_review"
          ? "Request source-rights/legal review before production use of this education content."
          : action === "assign_owner"
            ? "Assign owner to collect source labels, provider evidence, and human review proof."
            : "Acknowledged source governance gap for education-only operations.",
      }),
    });
    nodes.dataSourceStatus.textContent = `${result.action.action} recorded for ${result.action.queueItemId}. Production ready: ${result.productionReady ? "yes" : "no"}.`;
    await refreshDataGovernanceQueue();
  } catch (error) {
    nodes.dataSourceStatus.textContent = `Data governance action failed: ${error.message}`;
  }
}

async function refreshTeachingEvolutionLab() {
  if (!nodes.teachingEvolutionLabList || !nodes.teachingEvolutionLabStatus) return;
  try {
    const result = await api(`/api/admin/teaching-evolution-lab?intent=${encodeURIComponent("突破后追涨")}`);
    const lab = result.lab;
    const parsed = lab.semanticGuardrail?.parsedForClassroom || {};
    const sampleRows = (lab.teachingSamples || []).slice(0, 4).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.status)} / quality ${item.qualityScore} / misconception yield ${item.misconceptionYield}</span>
          <span>${escapeHtml(item.suggestedUse)}</span>
          <span>${escapeHtml(item.forbiddenUse)}</span>
        </div>
        <span class="tag warn">teaching sample</span>
      </div>
    `).join("");
    const courseRows = (lab.courseQualityQueue || []).slice(0, 4).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.status)} / blockers ${(item.blockers || []).map(escapeHtml).join(", ") || "none"}</span>
          <span>${escapeHtml(item.evolutionUse)}</span>
          <span>${escapeHtml(item.nextAction)}</span>
        </div>
        <span class="tag ${item.status === "reviewable" ? "warn" : "danger"}">${escapeHtml(item.status)}</span>
      </div>
    `).join("");
    nodes.teachingEvolutionLabStatus.textContent = `Teaching lab loaded: samples ${lab.summary.teachingSamples}, keep ${lab.summary.keepSamples}, drift risks ${lab.summary.driftRisks}. Education only; production ready remains no.`;
    nodes.teachingEvolutionLabList.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>Semantic guardrail: ${escapeHtml(lab.semanticGuardrail.rawIntent)}</strong>
          <span>Hypothesis: ${escapeHtml(parsed.marketHypothesis || "")}</span>
          <span>Evidence: ${(parsed.visibleEvidenceNeeded || []).map(escapeHtml).join(" / ")}</span>
          <span>Counter-evidence: ${(parsed.counterEvidence || []).map(escapeHtml).join(" / ")}</span>
          <span>Risk plan: ${(parsed.riskPlan || []).map(escapeHtml).join(" / ")}</span>
        </div>
        <span class="tag danger">not a signal</span>
      </div>
      <div class="attempt-row">
        <div>
          <strong>Backtest anti-hallucination</strong>
          <span>Sample size ${lab.backtestAntiHallucination.metrics?.sampleSize || 0}; reliability ${escapeHtml(lab.backtestAntiHallucination.reliabilityAudit?.grade || "unreviewed")}</span>
          <span>${(lab.backtestAntiHallucination.explanationPrompts || []).map(escapeHtml).join(" / ")}</span>
        </div>
        <span class="tag danger">no performance claim</span>
      </div>
      ${sampleRows || "<p>No teaching sample candidates yet.</p>"}
      ${courseRows || "<p>No course package quality items yet.</p>"}
    `;
  } catch (error) {
    nodes.teachingEvolutionLabStatus.textContent = `Teaching evolution lab requires admin login: ${escapeHtml(error.message)}`;
    nodes.teachingEvolutionLabList.innerHTML = "";
  }
}

async function refreshScenarioReviews() {
  if (!nodes.scenarioReviewList) return;
  try {
    const result = await api("/api/admin/scenario-reviews");
    nodes.scenarioReviewStatus.textContent = `Pending ${result.summary.pending}, changes requested ${result.summary.changesRequested}, learner available ${result.summary.learnerAvailable}`;
    nodes.scenarioReviewList.innerHTML = result.items.length
      ? result.items.map((item) => `
        <div class="attempt-row">
          <div>
            <strong>${item.title}</strong>
            <span>${item.symbol} / ${item.timeframe} / ${item.reviewStatus}</span>
            <span>Data ${item.source.marketDataProvider}/${item.source.marketDataLicense}; News ${item.source.newsProvider}/${item.source.newsLicense}</span>
            <span>${item.reviewNote || "Awaiting data source, compliance, and education review."}</span>
          </div>
          <div class="billing-actions">
            <button type="button" data-scenario-review="approve" data-scenario-id="${item.id}">Approve</button>
            <button type="button" data-scenario-review="request_changes" data-scenario-id="${item.id}">Request changes</button>
          </div>
        </div>
      `).join("")
      : "<p>No scenarios waiting for approval.</p>";
  } catch (error) {
    nodes.scenarioReviewStatus.textContent = `Scenario review requires admin login: ${error.message}`;
    nodes.scenarioReviewList.innerHTML = "";
  }
}

async function reviewScenario(scenarioId, action) {
  if (!nodes.scenarioReviewStatus) return;
  try {
    const result = await api("/api/admin/scenarios/review", {
      method: "POST",
      body: JSON.stringify({
        scenarioId,
        action,
        dataSourceReview: action === "approve" ? "approved" : "changes_requested",
        complianceReview: action === "approve" ? "approved" : "changes_requested",
        educationReview: action === "approve" ? "approved" : "changes_requested",
        note: action === "approve"
          ? "Approved for education-only learner training."
          : "Needs source, compliance, or education edits before learner training.",
      }),
    });
    state.data.scenarios = result.scenarios || state.data.scenarios;
    nodes.scenarioReviewStatus.textContent = `${result.scenario.title}: ${result.scenario.reviewStatus}`;
    renderTrainer();
    renderReplay();
    await refreshScenarioReviews();
    await refreshDataSources();
  } catch (error) {
    nodes.scenarioReviewStatus.textContent = `Scenario review failed: ${error.message}`;
  }
}

async function refreshContentSources() {
  if (!nodes.contentSourceList) return;
  try {
    const result = await api("/api/admin/content-sources");
    nodes.contentSourceStatus.textContent = `Sources ${result.summary.total}, needs review ${result.summary.needsReview}, demo reviewed ${result.summary.reviewedDemo || 0}, licensed reviewed ${result.summary.licensedReviewed || 0}, internal demo ${result.summary.internalDemo}`;
    nodes.contentSourceList.innerHTML = result.items.length
      ? result.items.slice(0, 8).map((item) => `
        <div class="attempt-row">
          <div>
            <strong>${item.title}</strong>
            <span>${item.sourceType} / ${item.status} / ${item.reviewStatus} / ${item.extraction.method}</span>
            <span>${item.textLength} chars / ${item.extraction.alignmentStatus} / evidence ${item.alignmentEvidenceCount || 0}</span>
            ${item.chartScreenshot ? `<span>Chart screenshot ${escapeHtml(item.chartScreenshot.extractionStatus)} / ${escapeHtml(item.chartScreenshot.symbol)} ${escapeHtml(item.chartScreenshot.timeframe)} / missing ${item.chartScreenshot.missingFields?.length || 0} / review ${escapeHtml(item.chartScreenshot.reviewStatus || "pending")}</span>` : ""}
            <span>${item.sourceRightsReview?.checklist?.sourceRights || item.licenseStatus} / ${item.sourceRightsReview?.note || "Source rights not reviewed yet."}</span>
            <span>Release readiness: ${escapeHtml(item.releaseReadiness?.status || "blocked")} ${item.releaseReadiness?.blockers?.length ? `/ blockers ${escapeHtml(item.releaseReadiness.blockers.join(", "))}` : "/ no blockers"}</span>
            <span>${item.lastProcessingJobId ? `Processed ${item.lastProcessingJobId} / ${item.lastProcessingStatus}` : "No processing job yet"}</span>
            <span>${item.lastDistilledKnowledgePointId ? `Distilled ${item.lastDistilledKnowledgePointId}` : "Not distilled yet"}</span>
            <span>${item.knowledgeCandidates?.[0]?.excerpt || "No candidate excerpt."}</span>
          </div>
          <div class="billing-actions">
            <button type="button" data-content-source-id="${item.id}">Use for distill</button>
            <button type="button" data-content-process-id="${item.id}">Run processing</button>
            <button type="button" data-content-align-id="${item.id}">Add alignment</button>
            <button type="button" data-content-release-packet="json" data-content-release-packet-id="${item.id}">Release Packet</button>
            <button type="button" data-content-release-packet="md" data-content-release-packet-id="${item.id}">Packet MD</button>
            ${item.chartScreenshot ? `<button type="button" data-chart-screenshot-review="aligned_for_demo" data-chart-screenshot-review-id="${item.id}">Review chart alignment</button>` : ""}
            ${item.chartScreenshot ? `<button type="button" data-chart-screenshot-review="needs_revision" data-chart-screenshot-review-id="${item.id}">Request chart revision</button>` : ""}
            ${item.chartScreenshot?.approvedForDemo ? `<button type="button" data-chart-screenshot-submit-scenario="${item.id}">Submit chart drill</button>` : ""}
            ${item.chartScreenshot?.submittedScenarioId ? `<button type="button" data-chart-screenshot-create-package="${item.id}">Create chart package</button>` : ""}
            ${item.chartScreenshot?.coursePackageId ? `<button type="button" data-chart-screenshot-publish-assign="${item.id}">Publish & assign</button>` : ""}
            ${item.chartScreenshot?.assignedCoursePackageId ? `<button type="button" data-chart-screenshot-evidence-followup="${item.id}">Coach evidence</button>` : ""}
            <button type="button" data-content-source-review="approve_demo" data-content-source-review-id="${item.id}">Approve demo</button>
            <button type="button" data-content-source-review="request_changes" data-content-source-review-id="${item.id}">Request changes</button>
          </div>
        </div>
      `).join("")
      : "<p>No content sources yet.</p>";
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Content source library requires admin login: ${error.message}`;
    nodes.contentSourceList.innerHTML = "";
  }
}

async function reviewContentSource(contentSourceId, action) {
  if (!nodes.contentSourceStatus) return;
  try {
    const result = await api("/api/admin/content-sources/review", {
      method: "POST",
      body: JSON.stringify({
        contentSourceId,
        action,
        transcriptAccuracy: action === "approve_demo" ? "reviewed_for_demo" : "needs_revision",
        chartContext: action === "approve_demo" ? "reviewed_for_demo" : "needs_revision",
        compliance: action === "approve_demo" ? "education_boundary_reviewed" : "needs_revision",
        pedagogy: action === "approve_demo" ? "usable_for_training" : "needs_revision",
        note: action === "approve_demo"
          ? "Reviewed for internal education demo use only. Not production-cleared licensed market/news data."
          : "Needs source-rights, alignment, or compliance revisions before use.",
      }),
    });
    nodes.contentSourceStatus.textContent = `Content source reviewed: ${result.contentSource.title} / ${result.contentSource.reviewStatus}`;
    await refreshContentSources();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Content source review failed: ${error.message}`;
  }
}

async function addContentAlignmentEvidence(contentSourceId) {
  if (!nodes.contentSourceStatus) return;
  try {
    const result = await api("/api/admin/content-sources/alignment-evidence", {
      method: "POST",
      body: JSON.stringify({
        contentSourceId,
        frameRef: "demo-frame-001",
        timecode: "00:00:12",
        ocrText: "Failed breakout returns into the prior range; learner should identify invalidation before any next practice step.",
        alignedText: "Video transcript demo: when a failed breakout returns into the prior range, the learner identifies invalidation, reduces risk, and waits.",
        confidence: 0.82,
        reviewStatus: "aligned_for_demo",
        reviewNote: "Manual demo alignment evidence for OCR/frame-to-transcript fallback review.",
      }),
    });
    nodes.contentSourceStatus.textContent = `Alignment evidence added: ${result.contentSource.title} / ${result.contentSource.alignmentEvidenceCount}`;
    await refreshContentSources();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Alignment evidence failed: ${error.message}`;
  }
}

async function exportContentSourceReleasePacket(contentSourceId, format = "json") {
  if (!nodes.contentSourceStatus || !nodes.contentSourceList || !contentSourceId) return;
  try {
    const response = await fetch(`/api/admin/content-sources/release-packet?contentSourceId=${encodeURIComponent(contentSourceId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Content source release packet export failed");
    }
    const text = await response.text();
    nodes.contentSourceStatus.textContent = `Release packet ready: ${format.toUpperCase()} / ${text.length} bytes. Curriculum evidence only.`;
    nodes.contentSourceList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Content source release packet (${escapeHtml(format.toUpperCase())})</strong>
            <span>Curriculum operations evidence for source rights, OCR/transcript alignment, human review, drafts, and release blockers. Not investment advice, trading-performance evidence, live signal quality, broker readiness, auto-trading, or real-money readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Release packet export failed: ${escapeHtml(error.message)}`;
  }
}

async function reviewChartScreenshotIntake(contentSourceId, reviewStatus) {
  if (!nodes.contentSourceStatus) return;
  try {
    const approved = reviewStatus === "aligned_for_demo";
    const result = await api("/api/admin/chart-screenshot-intakes/review", {
      method: "POST",
      body: JSON.stringify({
        contentSourceId,
        reviewStatus,
        reviewedStructure: approved
          ? "Human reviewed: failed breakout returns into the prior range; learner labels structure before any outcome feedback."
          : "Needs clearer structure label before demo use.",
        reviewedInvalidation: approved
          ? "Human reviewed: breakout thesis is invalid when price returns into the prior range; learner reduces risk and waits."
          : "Needs clearer invalidation label before demo use.",
        confidence: approved ? 0.86 : 0.42,
        reviewNote: approved
          ? "Chart screenshot OCR/fallback alignment reviewed for internal education demo only. Not a live signal or trading recommendation."
          : "Chart screenshot needs OCR/fallback revision before curriculum use.",
      }),
    });
    nodes.contentSourceStatus.textContent = `Chart screenshot reviewed: ${result.contentSource.title} / ${result.chartScreenshot.reviewStatus}`;
    await refreshContentSources();
    await refreshContentJobs();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Chart screenshot review failed: ${error.message}`;
  }
}

async function submitChartScreenshotScenario(contentSourceId) {
  if (!nodes.contentSourceStatus) return;
  try {
    const result = await api("/api/admin/chart-screenshot-intakes/submit-scenario", {
      method: "POST",
      body: JSON.stringify({ contentSourceId }),
    });
    nodes.contentSourceStatus.textContent = `Chart drill submitted for review: ${result.scenario.title} / ${result.scenario.reviewStatus}`;
    await refreshContentSources();
    await refreshScenarioReviews();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Chart drill submission failed: ${error.message}`;
  }
}

async function createChartScreenshotCoursePackage(contentSourceId) {
  if (!nodes.contentSourceStatus) return;
  try {
    const result = await api("/api/admin/chart-screenshot-intakes/create-course-package", {
      method: "POST",
      body: JSON.stringify({
        contentSourceId,
        title: `${nodes.contentSourceTitle?.value?.trim() || "Reviewed chart drill"} package`,
        priceCents: Number(nodes.coursePackagePrice?.value || 0),
        plan: "Pro",
      }),
    });
    nodes.contentSourceStatus.textContent = `Chart package draft created: ${result.coursePackage.title} / ${result.coursePackage.status}`;
    await refreshContentSources();
    await refreshCoursePackages();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Chart package creation failed: ${error.message}`;
  }
}

async function publishAndAssignChartScreenshotPackage(contentSourceId) {
  if (!nodes.contentSourceStatus) return;
  try {
    const result = await api("/api/admin/chart-screenshot-intakes/publish-and-assign", {
      method: "POST",
      body: JSON.stringify({
        contentSourceId,
        email: nodes.loginEmail?.value?.trim() || "student@tradegym.local",
        instructions: "Complete this reviewed chart screenshot package as education-only practice. Write structure, invalidation, risk boundary, and no-trade condition before outcome feedback.",
      }),
    });
    nodes.contentSourceStatus.textContent = `Chart package ${result.published ? "published and " : ""}assigned: ${result.coursePackage.title} / practice ${result.practiceAssignments.length}`;
    await refreshContentSources();
    await refreshCoursePackages();
    await refreshCoachConsole();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Chart package publish/assign failed: ${error.message}`;
  }
}

async function createChartScreenshotEvidenceFollowup(contentSourceId) {
  if (!nodes.contentSourceStatus) return;
  try {
    const result = await api("/api/admin/chart-screenshot-intakes/create-evidence-followup", {
      method: "POST",
      body: JSON.stringify({
        contentSourceId,
        focus: "chart screenshot drill evidence review",
      }),
    });
    nodes.contentSourceStatus.textContent = `Chart evidence follow-up ${result.reused ? "reused" : "created"}: ${result.task.learnerName} / ${result.task.priority}`;
    await refreshContentSources();
    await refreshCoachConsole();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Chart evidence follow-up failed: ${error.message}`;
  }
}

async function createContentSource() {
  if (!nodes.contentSourceStatus) return;
  nodes.createContentSource.disabled = true;
  try {
    const result = await api("/api/admin/content-sources", {
      method: "POST",
      body: JSON.stringify({
        title: nodes.contentSourceTitle.value.trim(),
        sourceType: nodes.contentSourceType.value,
        rawText: nodes.contentSourceText.value.trim(),
        licenseStatus: "internal_demo",
      }),
    });
    state.selectedContentSourceId = result.contentSource.id;
    nodes.knowledgeTitle.value = result.contentSource.title;
    nodes.knowledgeSource.value = result.contentSource.knowledgeCandidates?.[0]?.excerpt || nodes.contentSourceText.value.trim();
    nodes.contentSourceStatus.textContent = `Content source created: ${result.contentSource.title}`;
    await refreshContentSources();
    await refreshContentJobs();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Content source creation failed: ${error.message}`;
  } finally {
    nodes.createContentSource.disabled = false;
  }
}

async function createChartScreenshotIntake() {
  if (!nodes.contentSourceStatus) return;
  if (nodes.createChartScreenshotIntake) nodes.createChartScreenshotIntake.disabled = true;
  try {
    const rawText = nodes.contentSourceText.value.trim();
    const result = await api("/api/admin/chart-screenshot-intakes", {
      method: "POST",
      body: JSON.stringify({
        title: nodes.contentSourceTitle.value.trim() || "Chart screenshot OCR intake",
        screenshotRef: "demo-chart-frame-001",
        symbol: "DEMO-PRICE",
        timeframe: "15m",
        ocrText: rawText,
        fallbackText: `${rawText} Human fallback alignment: learner should label structure, invalidation, risk boundary, and no-trade condition before any outcome review.`,
        observedStructure: "Failed breakout returns into the prior range; learner practices invalidation before continuing.",
        invalidation: "Breakout thesis is invalid when price returns into the prior range; learner reduces risk and waits.",
        learnerQuestion: "What structure, invalidation, and no-trade condition should be written before outcome feedback?",
        licenseStatus: "internal_demo",
      }),
    });
    state.selectedContentSourceId = result.contentSource.id;
    nodes.knowledgeTitle.value = result.contentSource.title;
    nodes.knowledgeSource.value = result.contentSource.knowledgeCandidates?.[0]?.excerpt || rawText;
    nodes.contentSourceStatus.textContent = `Chart screenshot intake created: ${result.contentSource.title} / missing ${result.intake.missingFields.length}`;
    await refreshContentSources();
    await refreshContentJobs();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Chart screenshot intake failed: ${error.message}`;
  } finally {
    if (nodes.createChartScreenshotIntake) nodes.createChartScreenshotIntake.disabled = false;
  }
}

async function refreshContentJobs() {
  if (!nodes.contentJobList) return;
  try {
    const result = await api("/api/admin/content-processing-jobs");
    nodes.contentJobStatus.textContent = `Jobs ${result.summary.total}, ready for review ${result.summary.readyForReview}, needs human review ${result.summary.needsHumanReview}`;
    nodes.contentJobList.innerHTML = result.jobs.length
      ? result.jobs.slice(0, 8).map(renderContentJob).join("")
      : "<p>No content processing jobs yet.</p>";
  } catch (error) {
    nodes.contentJobStatus.textContent = `Content processing jobs require admin login: ${error.message}`;
    nodes.contentJobList.innerHTML = "";
  }
}

function renderContentJob(job) {
  const pipeline = job.pipeline || {};
  const concepts = job.reviewItems?.concepts || (job.firstConcept ? [job.firstConcept] : []);
  const prompts = job.reviewItems?.scenarioPrompts || (job.firstScenarioPrompt ? [job.firstScenarioPrompt] : []);
  const conceptRows = concepts.slice(0, 3).map((item) => `
    <div class="mini-row">
      <span>${escapeHtml(item.title || item.id)} / ${escapeHtml(item.reviewStatus || "needs_human_review")}</span>
      ${item.reviewStatus === "approved"
        ? `<span class="tag warn">Knowledge ${escapeHtml(item.approvedKnowledgePointId || "approved")}</span>`
        : `<button type="button" data-content-job-review="concept" data-job-id="${escapeHtml(job.id)}" data-item-id="${escapeHtml(item.id)}">Approve concept</button>`}
    </div>
  `).join("");
  const promptRows = prompts.slice(0, 3).map((item) => `
    <div class="mini-row">
      <span>${escapeHtml(item.title || item.id)} / ${escapeHtml(item.reviewStatus || "needs_human_review")}</span>
      ${item.submittedScenarioId
        ? `<span class="tag warn">Scenario ${escapeHtml(item.submittedScenarioId)}</span>`
        : `<button type="button" data-content-job-review="scenario_prompt" data-job-id="${escapeHtml(job.id)}" data-item-id="${escapeHtml(item.id)}">Submit scenario</button>`}
    </div>
  `).join("");
  return `
    <div class="attempt-row content-pipeline-row">
      <div>
        <strong>${escapeHtml(job.contentSourceTitle)}</strong>
        <span>${escapeHtml(job.sourceType)} / ${escapeHtml(job.status)} / ${escapeHtml(job.mode)}</span>
        <span>Pipeline: ${escapeHtml(pipeline.stage || "human_review_required")} / ${escapeHtml(pipeline.nextAction || "Review source before learner release.")}</span>
        <span>Segments ${job.segmentCount} / concepts ${job.extractedConceptCount} / prompts ${job.scenarioPromptCount}</span>
        <span>Alignment ${escapeHtml(job.alignmentStatus)}${job.warnings?.length ? ` / ${escapeHtml(job.warnings[0])}` : ""}</span>
        <span>${escapeHtml(job.firstConcept?.excerpt || "No extracted concept yet")}</span>
        <div class="mini-list">
          <strong>Concept review</strong>
          ${conceptRows || "<span>No concept candidates.</span>"}
        </div>
        <div class="mini-list">
          <strong>Training draft review</strong>
          ${promptRows || "<span>No scenario prompts.</span>"}
        </div>
      </div>
      <div class="billing-actions">
        <span class="tag warn">${escapeHtml(pipeline.pendingConcepts || 0)} concepts pending</span>
        <span class="tag ${pipeline.submittedScenarioPrompts ? "warn" : "danger"}">${escapeHtml(pipeline.submittedScenarioPrompts || 0)} submitted</span>
      </div>
    </div>
  `;
}

async function reviewContentJobItem(jobId, itemType, itemId) {
  if (!nodes.contentJobStatus) return;
  try {
    const result = await api("/api/admin/content-processing-jobs/review", {
      method: "POST",
      body: JSON.stringify({
        jobId,
        itemType,
        itemId,
        action: "approve",
        note: "Approved from local curriculum operations workbench for education-only draft production.",
      }),
    });
    nodes.contentJobStatus.textContent = itemType === "concept"
      ? `Approved concept into knowledge point ${result.knowledgePoint?.id || result.item.approvedKnowledgePointId}`
      : `Submitted scenario ${result.scenario?.id || result.item.submittedScenarioId} for review`;
    if (result.knowledgePoints) {
      state.data.knowledgePoints = result.knowledgePoints;
      renderKnowledgePoints();
    }
    await refreshContentJobs();
    await refreshContentSources();
    await refreshScenarioReviews();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentJobStatus.textContent = `Content review failed: ${error.message}`;
  }
}

async function processContentSource(contentSourceId = state.selectedContentSourceId) {
  if (!nodes.contentSourceStatus) return;
  if (!contentSourceId) {
    nodes.contentSourceStatus.textContent = "Select or create a content source before processing.";
    return;
  }
  if (nodes.processContentSource) nodes.processContentSource.disabled = true;
  try {
    const result = await api("/api/admin/content-processing-jobs", {
      method: "POST",
      body: JSON.stringify({
        contentSourceId,
        mode: "fallback_alignment",
      }),
    });
    state.selectedContentSourceId = result.contentSource.id;
    nodes.knowledgeTitle.value = result.job.firstConcept?.title || result.contentSource.title;
    nodes.knowledgeSource.value = result.job.firstConcept?.excerpt || result.contentSource.knowledgeCandidates?.[0]?.excerpt || nodes.knowledgeSource.value;
    nodes.contentSourceStatus.textContent = `Processing ready for review: ${result.job.segmentCount} segments, ${result.job.scenarioPromptCount} scenario prompts`;
    await refreshContentSources();
    await refreshContentJobs();
    await refreshAuditLog();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Content processing failed: ${error.message}`;
  } finally {
    if (nodes.processContentSource) nodes.processContentSource.disabled = false;
  }
}

async function runContentPipelineDemo() {
  if (!nodes.contentSourceStatus) return;
  if (nodes.runContentPipelineDemo) nodes.runContentPipelineDemo.disabled = true;
  try {
    const result = await api("/api/admin/content-pipeline/demo-run", {
      method: "POST",
      body: JSON.stringify({
        title: nodes.contentSourceTitle?.value?.trim(),
        sourceType: nodes.contentSourceType?.value,
        rawText: nodes.contentSourceText?.value?.trim(),
      }),
    });
    state.selectedContentSourceId = result.contentSource.id;
    if (result.knowledgePoint) {
      state.data.knowledgePoints = [result.knowledgePoint, ...(state.data.knowledgePoints || [])]
        .filter((item, index, arr) => arr.findIndex((other) => other.id === item.id) === index);
      renderKnowledgePoints();
    }
    nodes.contentSourceStatus.textContent = `Demo pipeline created source ${result.contentSource.title}; scenario ${result.scenario.id} is waiting for release review.`;
    nodes.contentJobStatus.textContent = `Demo pipeline stopped before learner release: ${result.job.pipeline.stage}.`;
    await refreshContentSources();
    await refreshContentJobs();
    await refreshScenarioReviews();
    await refreshAuditLog();
    await refreshProductReadiness();
  } catch (error) {
    nodes.contentSourceStatus.textContent = `Demo pipeline failed: ${error.message}`;
  } finally {
    if (nodes.runContentPipelineDemo) nodes.runContentPipelineDemo.disabled = false;
  }
}

function selectContentSource(sourceId) {
  state.selectedContentSourceId = sourceId;
  nodes.contentSourceStatus.textContent = `Selected source for distillation: ${sourceId}`;
}

function renderKnowledgePoints() {
  if (!nodes.knowledgeList) return;
  const items = state.data.knowledgePoints || [];
  nodes.knowledgeList.innerHTML = items.length
    ? items.slice(0, 5).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${item.title}</strong>
          <span>${item.concept} / ${item.module} / ${item.source?.provider || "unknown"}</span>
          <span>${item.learningObjective}</span>
        </div>
        <span class="tag warn">${item.status || "draft"}</span>
      </div>
    `).join("")
    : "<p>No knowledge points yet.</p>";
}

async function distillKnowledge() {
  if (!nodes.knowledgeStatus) return;
  try {
    const result = await api("/api/admin/knowledge/distill", {
      method: "POST",
      body: JSON.stringify({
        title: nodes.knowledgeTitle?.value.trim(),
        sourceText: nodes.knowledgeSource?.value.trim(),
        contentSourceId: state.selectedContentSourceId,
        module: "Price Action",
      }),
    });
    state.data.knowledgePoints = result.knowledgePoints;
    nodes.knowledgeStatus.textContent = `Knowledge point distilled: ${result.knowledgePoint.title} / ${result.knowledgePoint.concept}`;
    renderKnowledgePoints();
    await refreshContentSources();
    await refreshReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.knowledgeStatus.textContent = `Knowledge distillation failed: ${error.message}`;
  }
}

async function refreshCoursePackages() {
  if (!nodes.coursePackageList) return;
  try {
    const result = await api("/api/admin/course-packages");
    state.adminCoursePackages = result.packages;
    nodes.coursePackageStatus.textContent = `Packages ${result.summary.total}, draft ${result.summary.draft}, published ${result.summary.published}`;
    nodes.coursePackageList.innerHTML = result.packages.length
      ? result.packages.map((item) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${item.title}</strong>
            <span>${item.status} / v${item.version} / ${item.plan} / ¥${((item.priceCents || 0) / 100).toFixed(2)}</span>
            <span>Knowledge ${item.knowledgePointCount} / scenarios ${item.approvedScenarioCount}/${item.scenarioCount} approved / metric drills ${item.backtestDrillCount || 0} / context drills ${item.contextDrillCount || 0}</span>
            <span>Enrollments ${item.enrollmentCount || 0} / package assignments ${item.assignmentCount || 0} / completion reports ${item.completionReportCount || 0}</span>
            <span>Checklist content ${item.releaseChecklist.contentRights}, scenario ${item.releaseChecklist.scenarioReview}, compliance ${item.releaseChecklist.compliance}, pedagogy ${item.releaseChecklist.pedagogy}</span>
          </div>
          ${item.status === "published"
            ? '<span class="tag warn">Published</span>'
            : `<button type="button" data-course-package-action="publish" data-course-package-id="${item.id}">Publish package</button>`}
        </div>
      `).join("")
      : "<p>No course packages yet.</p>";
  } catch (error) {
    nodes.coursePackageStatus.textContent = `Course packages require admin login: ${error.message}`;
    nodes.coursePackageList.innerHTML = "";
  }
}

async function createCoursePackage() {
  if (!nodes.coursePackageStatus) return;
  try {
    const result = await api("/api/admin/course-packages", {
      method: "POST",
      body: JSON.stringify({
        title: nodes.coursePackageTitle.value.trim(),
        priceCents: Number(nodes.coursePackagePrice.value || 0),
        plan: "Pro",
      }),
    });
    nodes.coursePackageStatus.textContent = `Created package: ${result.coursePackage.title}`;
    await refreshCoursePackages();
    await refreshAuditLog();
  } catch (error) {
    nodes.coursePackageStatus.textContent = `Create package failed: ${error.message}`;
  }
}

async function publishCoursePackage(coursePackageId) {
  if (!nodes.coursePackageStatus) return;
  try {
    const result = await api("/api/admin/course-packages/publish", {
      method: "POST",
      body: JSON.stringify({ coursePackageId }),
    });
    nodes.coursePackageStatus.textContent = `Published ${result.coursePackage.title} v${result.coursePackage.version}`;
    await refreshCoursePackages();
    await refreshAuditLog();
  } catch (error) {
    nodes.coursePackageStatus.textContent = `Publish package failed: ${error.message}`;
  }
}

function adminUserQuery() {
  const params = new URLSearchParams({ limit: "50" });
  const q = nodes.adminUserSearch?.value.trim();
  const status = nodes.adminUserStatusFilter?.value;
  const role = nodes.adminUserRoleFilter?.value;
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (role) params.set("role", role);
  return params;
}

async function refreshAdminUsers() {
  if (!nodes.adminUserList) return;
  try {
    const result = await api(`/api/admin/users?${adminUserQuery().toString()}`);
    nodes.adminUserStatus.textContent = `Users: ${result.totals.all}, active: ${result.totals.active}, disabled: ${result.totals.disabled}, deleted: ${result.totals.deleted}`;
    nodes.adminUserList.innerHTML = result.items.length
      ? result.items.map((account) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${account.name} <span class="muted-inline">${account.email}</span></strong>
            <span>${account.id} / ${account.role} / ${account.accountStatus} / plan ${account.plan}</span>
            <span>Email ${account.emailVerified ? "verified" : "unverified"} / compliance ${account.complianceRequired ? "required" : "acknowledged"} / legal ${account.legalAcceptanceAt ? "accepted" : "missing"}</span>
            <span>Training ${account.trainingCount} / replay ${account.replayNoteCount} / subscription ${account.activeSubscription?.plan || "none"}</span>
            ${account.disabledReason ? `<span>Disabled reason: ${account.disabledReason}</span>` : ""}
          </div>
          <div class="billing-actions">
            <button type="button" data-user-action="role" data-next-role="${account.role === "admin" ? "student" : "admin"}" data-user-id="${account.id}">${account.role === "admin" ? "Make student" : "Make admin"}</button>
            ${account.accountStatus === "active"
              ? `<button type="button" data-user-action="disable" data-user-id="${account.id}">Disable</button>`
              : `<button type="button" data-user-action="reactivate" data-user-id="${account.id}">Reactivate</button>`}
          </div>
        </div>
      `).join("")
      : "<p>No users match the current filters.</p>";
  } catch (error) {
    nodes.adminUserStatus.textContent = `User governance requires admin login: ${error.message}`;
    nodes.adminUserList.innerHTML = "";
  }
}

async function updateAdminUser(userId, action, nextRole) {
  if (!nodes.adminUserStatus) return;
  try {
    const result = await api("/api/admin/users/update", {
      method: "POST",
      body: JSON.stringify({
        userId,
        action,
        role: nextRole,
        reason: "Disabled from local ops console for education-platform governance review",
      }),
    });
    nodes.adminUserStatus.textContent = `${result.account.email}: ${result.audit.action} processed`;
    await refreshAdminUsers();
    await refreshMetrics();
    await refreshAuditLog();
  } catch (error) {
    nodes.adminUserStatus.textContent = `User update failed: ${error.message}`;
  }
}

function coachConsoleQuery() {
  const params = new URLSearchParams({ limit: "30" });
  const q = nodes.coachConsoleSearch?.value.trim();
  if (q) params.set("q", q);
  return params;
}

async function refreshEducationServiceHealth() {
  if (!nodes.educationServiceHealthPanel) return;
  try {
    const health = await api("/api/admin/education-service-health");
    const summary = health.summary || {};
    const sections = health.sections || {};
    const trend = health.trend || {};
    const latestTrend = trend.latest || {};
    nodes.educationServiceHealthPanel.innerHTML = `
      <div class="score-grid">
        <div><span>Health</span><strong>${health.healthScore ?? 0}</strong></div>
        <div><span>Open coach</span><strong>${summary.openCoachTasks ?? 0}</strong></div>
        <div><span>Session req</span><strong>${summary.coachSessionRequests ?? 0}</strong></div>
        <div><span>Context open</span><strong>${summary.openContextRiskFollowups ?? 0}</strong></div>
      </div>
      <div class="attempt-row ops-row">
        <div>
          <strong>Education service health: ${escapeHtml(health.status || "watch")}</strong>
          <span>Context completion ${summary.contextCompletionRatePct ?? 0}% / evidence ready ${summary.evidenceLoopReadyToApply ?? 0} / closure ${summary.evidenceLoopReadyForClosure ?? 0}</span>
          <span>Chart evidence open ${summary.chartEvidenceOpen ?? 0} / ready apply ${summary.chartEvidenceReadyToApply ?? 0} / ready closure ${summary.chartEvidenceReadyForClosure ?? 0}</span>
          <span>SLA high ${summary.slaHighPriority ?? 0} / overdue coach ${summary.overdueOpen ?? 0} / model review rate ${summary.modelReviewRatePct ?? 0}%</span>
          <span>Coach sessions requested ${summary.coachSessionRequests ?? 0} / confirmed ${summary.confirmedCoachSessions ?? 0} / overdue requests ${summary.overdueCoachSessionRequests ?? 0}</span>
          <span>Trend ${trend.days || 14}d: coach created ${trend.totals?.coachTasksCreated ?? 0}, completed ${trend.totals?.coachTasksCompleted ?? 0}, evidence responses ${trend.totals?.evidenceFollowupsResponded ?? 0}, model reviews ${trend.totals?.educationModelRunsReviewed ?? 0}</span>
          <span>Today snapshot: open coach ${latestTrend.openCoachTasksSnapshot ?? 0}, overdue ${latestTrend.overdueCoachTasksSnapshot ?? 0}</span>
          <ol class="clean-list">${(health.nextOperations || ["No urgent education service operation."]).slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
          <span>${escapeHtml(health.constraints?.[1] || "Not trading performance, signal, return, broker, or real-money readiness metrics.")}</span>
        </div>
        <div class="profile-tags">
          <span class="tag ${health.status === "needs_attention" ? "danger" : "warn"}">${escapeHtml(health.status || "watch")}</span>
          <span class="tag">Evidence ${sections.evidenceLoop?.responseRatePct ?? 0}% response</span>
          <span class="tag">Workload ${sections.coachWorkload?.totalOpen ?? 0}</span>
          <button type="button" data-health-action="export-health-json">Export health JSON</button>
          <button type="button" data-health-action="export-health-csv">Export health CSV</button>
          ${summary.educationModelNeedsReview ? '<button type="button" data-health-action="open-model-review">Open model review</button>' : ""}
          ${summary.overdueOpen ? '<button type="button" data-health-action="open-overdue-coach-tasks">Open overdue tasks</button>' : ""}
          ${summary.chartEvidenceOpen ? '<button type="button" data-health-action="open-chart-evidence">Open chart evidence</button>' : ""}
          ${summary.evidenceLoopReadyToApply ? '<button type="button" data-health-action="open-evidence-ready-apply">Open ready apply</button>' : ""}
          ${sections.evidenceLoop?.backlog?.awaitingAssignmentCompletion ? '<button type="button" data-health-action="open-evidence-awaiting-assignment">Open awaiting assignment</button>' : ""}
          ${summary.evidenceLoopReadyForClosure ? '<button type="button" data-health-action="open-evidence-closure">Open evidence closure</button>' : ""}
        </div>
      </div>
    `;
  } catch (error) {
    nodes.educationServiceHealthPanel.innerHTML = `<p>Education service health requires admin login: ${escapeHtml(error.message)}</p>`;
  }
}

async function refreshCoachConsole() {
  if (!nodes.coachConsoleList) return;
  try {
    await refreshEducationServiceHealth();
    await refreshLearningActionOutcomes();
    await refreshLearningActionQueue();
    const result = await api(`/api/admin/coach-reports?${coachConsoleQuery().toString()}`);
    nodes.coachConsoleStatus.textContent = `Active learners: ${result.totals.activeLearners}, ready for coach: ${result.totals.needsHumanCoach}, risk flagged: ${result.totals.riskFlagged}, context repair: ${result.totals.contextBoundaryRepair || 0}, metric blocked: ${result.totals.metricDrillBlocked || 0}`;
    nodes.coachConsoleList.innerHTML = result.reports.length
      ? result.reports.map((report) => {
        const contextRisk = report.marketContextClassroom?.riskSummary || {};
        const dominantContextRisk = contextRisk.dominantRisk;
        return `
        <div class="attempt-row ops-row">
          <div>
            <strong>${report.learner.name} <span class="muted-inline">${report.learner.email}</span></strong>
            <span>Plan ${report.learner.plan} / training ${report.activity.trainingAttempts} / replay ${report.activity.replayNotes} / paper ${report.activity.paperTrades}</span>
            <span>Risk discipline ${report.discipline.averageRiskDiscipline ?? "--"} / paper discipline ${report.discipline.averagePaperDiscipline ?? "--"} / latest sim R ${report.discipline.latestPaperTradeR ?? "--"}</span>
            <span>Context risk ${escapeHtml(contextRisk.operatingStatus || "needs_context_evidence")} / wrong context drills ${contextRisk.wrongMisconceptionAttempts ?? 0}${dominantContextRisk ? ` / ${escapeHtml(dominantContextRisk.label)} x${dominantContextRisk.count}` : ""}</span>
            <span>${escapeHtml(contextRisk.constraints?.[1] || "Context risk is not sentiment scoring, market prediction, signal, or recommendation.")}</span>
            <span>Focus ${report.coachReview.suggestedReviewFocus} / ${report.coachReview.readyForHumanCoach ? "human review ready" : "needs more practice data"}</span>
            <span>${(report.metricDrillBlockers || []).length ? `Metric drill blocker: ${escapeHtml(report.metricDrillBlockers[0].coursePackageTitle)} ${report.metricDrillBlockers[0].progressPercent}%` : "No metric drill blocker"}</span>
            <span>Human review entitlement: ${report.entitlement?.coachReviewIncluded ? `included / ${report.entitlement.usedCoachReviews}/${report.entitlement.monthlyCoachReviews} used / ${report.entitlement.remaining?.coachReview ?? 0} left` : "Coach plan required"}</span>
            <span>${report.constraints[0]}</span>
          </div>
          <div class="profile-tags">
            ${(report.topMistakes || []).slice(0, 3).map((item) => `<span class="tag danger">${item.tag} x${item.count}</span>`).join("") || '<span class="tag">No mistakes</span>'}
            ${(report.riskFlags || []).slice(0, 2).map((item) => `<span class="tag warn">${item}</span>`).join("")}
            ${report.entitlement?.coachReviewIncluded && (report.entitlement.remaining?.coachReview ?? 0) > 0
              ? `<button type="button" data-coach-action="create-task" data-user-id="${report.learner.id}" data-focus="${encodeURIComponent(report.coachReview.suggestedReviewFocus)}">Create review task</button>`
              : `<span class="tag warn">${report.entitlement?.coachReviewIncluded ? "Quota used" : "Coach required"}</span>`}
            ${report.learningPath?.recommendedScenario?.id
              ? `<button type="button" data-coach-action="assign-practice" data-user-id="${report.learner.id}" data-scenario-id="${report.learningPath.recommendedScenario.id}" data-focus="${encodeURIComponent(report.learningPath.focus || "practice")}">Assign practice</button>`
              : '<span class="tag warn">No scenario</span>'}
            <button type="button" data-coach-action="view-progress-report" data-user-id="${report.learner.id}">View progress report</button>
            <button type="button" data-coach-action="evidence-followup" data-user-id="${report.learner.id}">Evidence follow-up</button>
            ${contextRisk.operatingStatus === "needs_boundary_repair" || dominantContextRisk
              ? `<button type="button" data-coach-action="context-followup" data-user-id="${report.learner.id}">Context follow-up</button>`
              : ""}
            <button type="button" data-coach-action="assign-course-package" data-user-id="${report.learner.id}">Assign package</button>
            ${(report.metricDrillBlockers || []).length
              ? `<button type="button" data-coach-action="metric-followup" data-user-id="${report.learner.id}" data-course-package-id="${escapeHtml(report.metricDrillBlockers[0].coursePackageId)}">Metric follow-up</button>`
              : ""}
          </div>
        </div>
      `;
      }).join("")
      : "<p>No learner reports match the current filters.</p>";
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Coach console requires admin login: ${error.message}`;
    nodes.coachConsoleList.innerHTML = "";
  }
}

async function refreshLearningActionOutcomes() {
  if (!nodes.learningActionOutcomePanel) return;
  try {
    const result = await api(`/api/admin/learning-action-outcomes?${coachConsoleQuery().toString()}`);
    const sla = await api(`/api/admin/learning-action-sla-queue?${coachConsoleQuery().toString()}`);
    const summary = result.summary || {};
    const breakdowns = result.breakdowns || {};
    const slaSummary = sla.summary || {};
    const renderBreakdown = (title, rows = []) => rows.length
      ? `
        <div class="attempt-row">
          <div>
            <strong>${escapeHtml(title)}</strong>
            ${rows.slice(0, 4).map((item) => `
              <span>${escapeHtml(item.key)}: ${item.completed}/${item.total} completed / stuck ${item.stuck} / ${item.completionRatePct}%</span>
            `).join("")}
          </div>
          <span class="tag warn">Breakdown</span>
        </div>
      `
      : "";
    nodes.learningActionOutcomePanel.innerHTML = `
      <div class="score-grid">
        <div><span>Action outcomes</span><strong>${summary.total || 0}</strong></div>
        <div><span>Completed</span><strong>${summary.completed || 0}</strong></div>
        <div><span>In progress</span><strong>${summary.inProgress || 0}</strong></div>
        <div><span>Stuck</span><strong>${summary.stuck || 0}</strong></div>
      </div>
      <div class="attempt-row ops-row">
        <div>
          <strong>Learning action outcome feedback</strong>
          <span>Completion ${summary.completionRatePct || 0}% / assignments completed ${summary.assignmentsCompleted || 0} / learner responses ${summary.learnerResponses || 0}</span>
          <span>SLA groups ${slaSummary.total || 0} / high ${slaSummary.highPriority || 0} / watch ${slaSummary.watch || 0} / stuck groups ${slaSummary.stuckGroups || 0}</span>
          <span>${escapeHtml(result.constraints?.[1] || "This does not measure returns, win rate, live signals, or real-money readiness.")}</span>
        </div>
        <span class="tag warn">Effect check</span>
      </div>
      ${(sla.queue || []).slice(0, 4).map((item) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(item.type)} / ${escapeHtml(item.owner)}</strong>
            <span>${escapeHtml(item.status)} / ${escapeHtml(item.priority)} / stuck ${item.stuck}/${item.total} / completion ${item.completionRatePct}%</span>
            <span>${escapeHtml(item.nextAction)}</span>
          </div>
          <div class="billing-actions">
            <button type="button" data-sla-action="acknowledge" data-sla-type="${escapeHtml(item.type)}" data-sla-owner="${escapeHtml(item.owner)}">Acknowledge</button>
            <button type="button" data-sla-action="assign_owner" data-sla-type="${escapeHtml(item.type)}" data-sla-owner="${escapeHtml(item.owner)}">Assign owner</button>
            <button type="button" data-sla-action="create_followup" data-sla-type="${escapeHtml(item.type)}" data-sla-owner="${escapeHtml(item.owner)}">Follow-up intent</button>
            <span class="tag ${item.priority === "high" ? "danger" : "warn"}">SLA</span>
          </div>
        </div>
      `).join("")}
      ${(sla.recentActions || []).length ? `
        <div class="attempt-row ops-row">
          <div>
            <strong>Recent SLA actions</strong>
            ${(sla.recentActions || []).slice(0, 3).map((item) => `
              <span>${escapeHtml(item.action)} / ${escapeHtml(item.groupType)}:${escapeHtml(item.owner)} / ${formatTime(item.createdAt)}</span>
            `).join("")}
          </div>
          <span class="tag warn">Audit</span>
        </div>
      ` : ""}
      ${renderBreakdown("By action type", breakdowns.byActionType)}
      ${renderBreakdown("By coach", breakdowns.byCoach)}
      ${renderBreakdown("By segment", breakdowns.bySegment)}
      ${(result.items || []).slice(0, 8).map((item) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(item.email || item.userId || "learner")} <span class="muted-inline">${escapeHtml(item.actionType || item.type)}</span></strong>
            <span>Outcome ${escapeHtml(item.outcome)} / created ${formatTime(item.createdAt)}</span>
            <span>Coach ${escapeHtml(item.coach || "unassigned")} / segment ${escapeHtml(item.segment || "unknown")}</span>
            <span>${escapeHtml(item.evidence || "Education action is still being tracked.")}</span>
          </div>
          <span class="tag ${item.outcome === "completed" ? "warn" : item.outcome === "stuck" ? "danger" : "tag"}">${escapeHtml(item.outcome)}</span>
        </div>
      `).join("")}
    `;
  } catch (error) {
    nodes.learningActionOutcomePanel.innerHTML = `<p>Learning action outcomes require admin login: ${escapeHtml(error.message)}</p>`;
  }
}

async function refreshLearningActionQueue() {
  if (!nodes.learningActionQueueList) return;
  try {
    const result = await api(`/api/admin/learning-action-queue?${coachConsoleQuery().toString()}`);
    const summary = result.totals || {};
    const summaryHtml = `
      <div class="attempt-row ops-row">
        <div>
          <strong>Learning Action Queue</strong>
          <span>${summary.returned || 0} returned / metric ${summary.metricFollowups || 0} / context ${summary.contextFollowups || 0} / evidence ${summary.evidenceFollowups || 0} / package ${summary.packageAssignments || 0}</span>
          <span>${escapeHtml(result.constraints?.[1] || "No stock recommendation, live signal, guaranteed return, or real-money trading instruction.")}</span>
        </div>
        <span class="tag warn">Education ops</span>
      </div>
    `;
    const rows = result.actions?.length
      ? result.actions.map((item) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(item.learner?.name || "Learner")} <span class="muted-inline">${escapeHtml(item.learner?.email || "")}</span></strong>
            <span>${escapeHtml(item.label)} / priority ${item.priorityScore}</span>
            <span>${escapeHtml(item.rationale)}</span>
            <span>Evidence: ${escapeHtml((item.evidence || []).join(" / "))}</span>
            <span>${escapeHtml(item.constraints?.[0] || "Education workflow suggestion only.")}</span>
          </div>
          <div class="billing-actions">
            ${item.actionType === "metric_followup" ? `<button type="button" data-coach-action="metric-followup" data-user-id="${escapeHtml(item.learner?.id || "")}" data-course-package-id="${escapeHtml(item.coursePackageId || "")}">Metric follow-up</button>` : ""}
            ${item.actionType === "context_followup" ? `<button type="button" data-coach-action="context-followup" data-user-id="${escapeHtml(item.learner?.id || "")}">Context follow-up</button>` : ""}
            ${item.actionType === "evidence_followup" ? `<button type="button" data-coach-action="evidence-followup" data-user-id="${escapeHtml(item.learner?.id || "")}">Evidence follow-up</button>` : ""}
            ${item.actionType === "assign_course_package" ? `<button type="button" data-coach-action="assign-course-package" data-user-id="${escapeHtml(item.learner?.id || "")}" data-course-package-id="${escapeHtml(item.coursePackageId || "")}">Assign package</button>` : ""}
            ${item.actionType === "coach_review" ? `<button type="button" data-coach-action="create-task" data-user-id="${escapeHtml(item.learner?.id || "")}" data-focus="${encodeURIComponent(item.focus || "decision process")}">Create review task</button>` : ""}
            <button type="button" data-coach-action="view-progress-report" data-user-id="${escapeHtml(item.learner?.id || "")}">View report</button>
          </div>
        </div>
      `).join("")
      : "<p>No learning action queue items match the current filters.</p>";
    nodes.learningActionQueueList.innerHTML = `${summaryHtml}${rows}`;
  } catch (error) {
    nodes.learningActionQueueList.innerHTML = `<p>Learning action queue requires admin login: ${escapeHtml(error.message)}</p>`;
  }
}

async function processBulkLearningActionQueue() {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/learning-action-queue/bulk", {
      method: "POST",
      body: JSON.stringify({ maxCreate: 10, q: nodes.coachConsoleSearch?.value.trim() || "" }),
    });
    nodes.coachConsoleStatus.textContent = `Learning actions processed: ${result.summary.created} created, ${result.summary.reused} reused, ${result.summary.skipped} skipped from ${result.summary.candidates} candidate(s).`;
    await refreshLearningActionOutcomes();
    await refreshLearningActionQueue();
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Bulk learning actions failed: ${error.message}`;
  }
}

async function handleLearningActionSlaAction(action, type, owner) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const assignedCoachEmail = action === "assign_owner" ? "coach-a@tradegym.local" : "";
    const note = action === "create_followup"
      ? `Create an education-service follow-up plan for ${type}:${owner}. No trading advice or live signal.`
      : action === "assign_owner"
        ? `Assign education-service SLA owner for ${type}:${owner}.`
        : `Acknowledge education-service SLA group ${type}:${owner}.`;
    const result = await api("/api/admin/learning-action-sla-queue/actions", {
      method: "POST",
      body: JSON.stringify({ action, type, owner, assignedCoachEmail, note }),
    });
    nodes.coachConsoleStatus.textContent = `Learning action SLA ${result.action.action} recorded for ${result.action.groupType}:${result.action.owner}.`;
    await refreshLearningActionOutcomes();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Learning action SLA action failed: ${error.message}`;
  }
}

function renderCoachProgressReport(report) {
  if (!nodes.coachProgressReportPanel) return;
  if (!report) {
    nodes.coachProgressReportPanel.innerHTML = "";
    return;
  }
  const topMistakes = report.topMistakes?.length
    ? report.topMistakes.slice(0, 5).map((item) => `<span class="tag danger">${escapeHtml(item.tag)} x${item.count}</span>`).join("")
    : '<span class="tag">No repeated mistake yet</span>';
  const achievements = report.achievements?.achievements?.filter((item) => item.unlocked).slice(0, 5) || [];
  const achievementHtml = achievements.length
    ? achievements.map((item) => `<span class="tag warn">${escapeHtml(item.title)}</span>`).join("")
    : '<span class="tag">No milestone unlocked yet</span>';
  const courseHtml = report.coursePackages?.length
    ? report.coursePackages.slice(0, 5).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${item.progress.percent}% complete / ${item.progress.completedItems} of ${item.progress.totalItems}</span>
          <span>${item.completionReport ? "Completion issued" : "No completion report yet"}</span>
        </div>
        <span class="tag ${item.completionReport ? "warn" : "danger"}">${item.enrolled ? "enrolled" : item.access}</span>
      </div>
    `).join("")
    : "<p>No course package progress yet.</p>";
  const completionReportHtml = report.completionReports?.length
    ? report.completionReports.slice(0, 5).map((item) => `
      <div class="attempt-row completion-report-card">
        <div>
          <strong>${escapeHtml(item.coursePackageTitle)} / completion report</strong>
          <span>Issued ${formatTime(item.issuedAt)} / progress ${item.progress?.percent ?? 0}% / ${item.progress?.completedItems ?? 0} of ${item.progress?.totalItems ?? 0}</span>
          <span>Attempts ${item.practiceSummary?.trainingAttempts ?? 0} / average risk discipline ${item.practiceSummary?.averageRiskDiscipline ?? "--"}</span>
          <span>${escapeHtml(item.statements?.[1] || "Completion does not certify trading skill, returns, or real-money readiness.")}</span>
        </div>
        <div class="billing-actions">
          <button type="button" data-coach-action="export-certificate-json" data-report-id="${escapeHtml(item.id)}">Certificate JSON</button>
          <button type="button" data-coach-action="export-certificate-csv" data-report-id="${escapeHtml(item.id)}">Certificate CSV</button>
          <button type="button" data-coach-action="export-certificate-md" data-report-id="${escapeHtml(item.id)}">Certificate Brief</button>
          <button type="button" data-coach-action="completion-followup" data-report-id="${escapeHtml(item.id)}">Create completion follow-up</button>
          <span class="tag warn">Education proof</span>
        </div>
      </div>
    `).join("")
    : "<p>No completion report issued yet.</p>";
  const completionEvidenceHtml = report.courseCompletionEvidence?.length
    ? report.courseCompletionEvidence.slice(0, 5).map((item) => {
      const requiredItems = item.requiredItems?.length
        ? item.requiredItems.map((required) => `
          <span class="tag ${required.completed ? "warn" : "danger"}">${escapeHtml(required.itemType)}: ${escapeHtml(required.title)}${required.completed ? "" : " pending"}</span>
        `).join("")
        : '<span class="tag">No required items</span>';
      return `
        <div class="attempt-row completion-report-card">
          <div>
            <strong>${escapeHtml(item.coursePackageTitle)} / completion evidence</strong>
            <span>${item.progress?.percent ?? 0}% complete / ${item.progress?.completedItems ?? 0} of ${item.progress?.totalItems ?? 0} / blockers ${item.blockers?.length || 0}</span>
            <span>${item.completionReportId ? `Completion report ${escapeHtml(item.completionReportId)}` : "Completion report not issued"}</span>
            <span>${escapeHtml(item.constraints?.[1] || "Not trading skill certification, signal, return evidence, or real-money readiness.")}</span>
          </div>
          <div class="profile-tags">${requiredItems}</div>
        </div>
      `;
    }).join("")
    : "<p>No course completion evidence yet.</p>";
  const deliveryHtml = report.reportDeliveries?.length
    ? report.reportDeliveries.slice(0, 5).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>Delivered ${formatTime(item.createdAt)}</strong>
          <span>${escapeHtml(item.coachNote)}</span>
          <span>Next step: ${escapeHtml(item.nextStep)}</span>
          <span>${item.assignment ? `Linked assignment: ${escapeHtml(item.assignment.scenarioTitle)} / ${escapeHtml(item.assignment.status)}` : "No linked assignment"}</span>
          <span>${escapeHtml(item.constraints?.[1] || "Education-only service record.")}</span>
        </div>
        <span class="tag warn">${escapeHtml(item.createdByEmail || "coach")}</span>
      </div>
    `).join("")
    : "<p>No delivered coach report yet.</p>";
  const coachSessionFollowupHtml = report.coachSessionFollowups?.length
    ? report.coachSessionFollowups.slice(0, 5).map((item) => `
      <div class="attempt-row">
        <div>
          <strong>${escapeHtml(item.topic || "Coach session follow-up")}</strong>
          <span>${escapeHtml(item.status)} / outcome ${escapeHtml(item.postSessionOutcomeStatus || "session_completed")}${item.completedAt ? ` / completed ${formatTime(item.completedAt)}` : ""}</span>
          <span>Assignments ${item.assignments?.length || 0} / completed ${(item.assignments || []).filter((assignment) => assignment.status === "completed").length}</span>
          <span>${escapeHtml(item.constraints?.[1] || "Education service continuity only.")}</span>
        </div>
        <span class="tag ${item.postSessionOutcomeStatus === "practice_completed" ? "warn" : "danger"}">${escapeHtml(item.postSessionOutcomeStatus || "session_completed")}</span>
      </div>
    `).join("")
    : "<p>No coach session follow-up evidence yet.</p>";
  const nextProductHtml = renderNextLearningProduct(report.nextLearningProduct, { userId: report.learner?.id || "" });
  const approvedEducationModelRunHtml = renderApprovedEducationModelRun(report.approvedEducationModelRun);
  const learningEvidencePacketHtml = renderLearningEvidencePacket(report.learningEvidencePacket);
  nodes.coachProgressReportPanel.innerHTML = `
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(report.learner?.name || "Learner")} <span class="muted-inline">${escapeHtml(report.learner?.email || "")}</span></strong>
        <span>Training ${report.activity.trainingAttempts} / replay ${report.activity.replayNotes} / paper ${report.activity.paperTrades} / completions ${report.activity.completionReports}</span>
        <span>Habit ${report.habit?.todayDone ?? 0}/${report.habit?.dailyGoal ?? 3} today / streak ${report.habit?.streakDays ?? 0} days / milestones ${report.achievements?.unlockedCount ?? 0}/${report.achievements?.totalCount ?? 0}</span>
        <span>${escapeHtml(report.constraints?.[1] || "No investment advice, signals, returns, or real-money instruction.")}</span>
      </div>
      <span class="tag warn">Admin view</span>
    </div>
    <div class="profile-tags">${achievementHtml}</div>
    <div class="profile-tags">${topMistakes}</div>
    ${learningEvidencePacketHtml}
    ${courseHtml}
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Completion Evidence</p>
        <h3>Required learning proof</h3>
      </div>
    </div>
    ${completionEvidenceHtml}
    ${renderEducationModelContext(report.educationModelContext)}
    ${renderEducationTutoringPlan(report.educationTutoringPlan)}
    ${approvedEducationModelRunHtml}
    ${nextProductHtml}
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Completion Follow-up</p>
        <h3>Reports needing coach next step</h3>
      </div>
    </div>
    ${completionReportHtml}
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Session Follow-up</p>
        <h3>Post-session practice evidence</h3>
      </div>
    </div>
    ${coachSessionFollowupHtml}
    <label for="coachProgressReportExport">Coach share/export text</label>
    <textarea id="coachProgressReportExport" rows="9" readonly>${escapeHtml(report.exportText || report.shareText || "")}</textarea>
    <div class="cms-form">
      <label for="coachProgressReportNote">Coach note</label>
      <textarea id="coachProgressReportNote" rows="4" placeholder="Write one education-only summary. No stock picks, live signals, return promises, or real-money instructions."></textarea>
      <label for="coachProgressReportNextStep">Next learning step</label>
      <input id="coachProgressReportNextStep" type="text" value="${escapeHtml(report.nextActions?.[0] || "Complete the next education-only drill and rewrite the risk plan.")}" />
      <button type="button" data-coach-action="deliver-progress-report" data-user-id="${escapeHtml(report.learner?.id || "")}">Deliver and archive report</button>
    </div>
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Delivery History</p>
        <h3>Archived coach notes</h3>
      </div>
    </div>
    ${deliveryHtml}
  `;
}

async function viewCoachProgressReport(userId) {
  if (!nodes.coachProgressReportPanel) return;
  nodes.coachProgressReportPanel.innerHTML = "<p>Loading learner progress report...</p>";
  try {
    const result = await api(`/api/admin/learner-progress-report?userId=${encodeURIComponent(userId)}`);
    renderCoachProgressReport(result.report);
    nodes.coachConsoleStatus.textContent = `Loaded progress report for ${result.report.learner?.email || userId}`;
  } catch (error) {
    nodes.coachProgressReportPanel.innerHTML = `<p>Progress report failed: ${escapeHtml(error.message)}</p>`;
  }
}

async function deliverCoachProgressReport(userId) {
  if (!nodes.coachProgressReportPanel) return;
  const coachNote = document.querySelector("#coachProgressReportNote")?.value.trim() || "";
  const nextStep = document.querySelector("#coachProgressReportNextStep")?.value.trim() || "";
  try {
    const result = await api("/api/admin/learner-report-deliveries", {
      method: "POST",
      body: JSON.stringify({ userId, coachNote, nextStep }),
    });
    renderCoachProgressReport(result.report);
    nodes.coachConsoleStatus.textContent = result.assignment
      ? `Delivered progress report for ${result.delivery.email} and assigned ${result.assignment.scenarioTitle}`
      : `Delivered progress report for ${result.delivery.email}`;
    await refreshMetrics();
    await refreshServiceDelivery();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Deliver progress report failed: ${error.message}`;
  }
}

async function createCompletionReportFollowup(reportId) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/completion-report-followups", {
      method: "POST",
      body: JSON.stringify({ reportId }),
    });
    nodes.coachConsoleStatus.textContent = `${result.reused ? "Reused" : "Created"} completion follow-up for ${result.task.email}: ${result.task.focus}`;
    await refreshCoachTasks();
    await refreshMetrics();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Completion follow-up failed: ${error.message}`;
  }
}

async function refreshServiceDelivery() {
  if (!nodes.serviceDeliveryList) return;
  try {
    const result = await api("/api/admin/service-delivery-dashboard?limit=40");
    const sla = await api("/api/admin/service-sla-queue?limit=40");
    const summary = result.summary || {};
    const slaSummary = sla.summary || {};
    nodes.serviceDeliveryStatus.textContent = `Delivered ${summary.delivered || 0} / waiting read ${summary.waitingForRead || 0} / waiting next step ${summary.waitingForNextStep || 0} / needs follow-up ${summary.needsFollowUp || 0} / SLA queue ${slaSummary.returned || 0} / open coach tasks ${slaSummary.openCoachTasks || 0}/${slaSummary.openLimit || 8}`;
    nodes.serviceDeliveryList.innerHTML = result.items?.length
      ? result.items.map((item) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(item.learnerName || "Learner")} <span class="muted-inline">${escapeHtml(item.email || "")}</span></strong>
            <span>${escapeHtml(item.learnerStatus || "unread")} / delivered ${formatTime(item.createdAt)}${item.learnerReadAt ? ` / read ${formatTime(item.learnerReadAt)}` : ""}${item.learnerCompletedAt ? ` / next step ${formatTime(item.learnerCompletedAt)}` : ""}</span>
            <span>Follow-up: ${escapeHtml(item.followUpStatus || "resolved")} / ${escapeHtml(item.followUpReason || "")}</span>
            <span>Next: ${escapeHtml(item.nextStep || "")}</span>
            <span>${item.assignment ? `Assignment ${escapeHtml(item.assignment.scenarioTitle)} / ${escapeHtml(item.assignment.status)}` : "No linked assignment"}</span>
            <span>${escapeHtml(result.constraints?.[1] || "Education service delivery only.")}</span>
          </div>
          <div class="profile-tags">
            <span class="tag ${item.followUpStatus === "resolved" ? "warn" : "danger"}">${escapeHtml(item.followUpStatus || "pending")}</span>
            ${item.followUpStatus !== "resolved" ? `<button type="button" data-service-action="create-followup" data-delivery-id="${escapeHtml(item.id)}">Create follow-up task</button>` : ""}
          </div>
        </div>
      `).join("")
      : "<p>No delivered reports yet.</p>";
  } catch (error) {
    nodes.serviceDeliveryStatus.textContent = `Service delivery dashboard requires admin login: ${error.message}`;
    nodes.serviceDeliveryList.innerHTML = "";
  }
}

function adminCoachSessionQuery() {
  const params = new URLSearchParams({ limit: "40" });
  const q = nodes.adminCoachSessionSearch?.value.trim();
  const status = nodes.adminCoachSessionStatus?.value || "all";
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  return params;
}

async function refreshAdminCoachSessions() {
  if (!nodes.adminCoachSessionList) return;
  try {
    const result = await api(`/api/admin/coach-session-bookings?${adminCoachSessionQuery().toString()}`);
    const summary = result.summary || {};
    nodes.adminCoachSessionStatusText.textContent = `Coach sessions ${summary.total || 0}: requested ${summary.requested || 0}, confirmed ${summary.confirmed || 0}, overdue ${summary.overdueRequests || 0}.`;
    nodes.adminCoachSessionList.innerHTML = result.bookings?.length
      ? result.bookings.map((booking) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(booking.learnerName || "Learner")} <span class="muted-inline">${escapeHtml(booking.email || "")}</span></strong>
            <span>${escapeHtml(booking.status)} / ${escapeHtml(booking.topic)} / requested ${formatTime(booking.createdAt)}${booking.overdue ? " / overdue" : ""}</span>
            <span>Preferred ${escapeHtml(booking.preferredWindow || "not set")}${booking.scheduledAt ? ` / scheduled ${formatTime(booking.scheduledAt)}` : ""}</span>
            <span>Coach ${escapeHtml(booking.assignedCoachEmail || "unassigned")} / provider ${escapeHtml(booking.provider?.calendar || "local_manual")}</span>
            <span>${escapeHtml(booking.learnerGoal || "")}</span>
            <span>${escapeHtml(booking.adminNote || "No scheduling note yet.")}</span>
            <span>${escapeHtml(booking.constraints?.[1] || "No stock recommendation, live signal, returns, broker workflow, or real-money instruction.")}</span>
          </div>
          <div class="billing-actions">
            <button type="button" data-session-action="confirm" data-booking-id="${escapeHtml(booking.id)}">Confirm</button>
            <button type="button" data-session-action="remind" data-booking-id="${escapeHtml(booking.id)}">Remind</button>
            <button type="button" data-session-action="completed" data-booking-id="${escapeHtml(booking.id)}">Complete</button>
            ${booking.status === "completed" ? `<button type="button" data-session-action="assign-practice" data-booking-id="${escapeHtml(booking.id)}">Assign drill</button>` : ""}
            <button type="button" data-session-action="canceled" data-booking-id="${escapeHtml(booking.id)}">Cancel</button>
          </div>
        </div>
      `).join("")
      : "<p>No coach session bookings match the current filter.</p>";
  } catch (error) {
    nodes.adminCoachSessionStatusText.textContent = `Coach session queue requires admin login: ${escapeHtml(error.message)}`;
    nodes.adminCoachSessionList.innerHTML = "";
  }
}

async function updateAdminCoachSession(bookingId, action) {
  if (!nodes.adminCoachSessionStatusText) return;
  if (action === "remind") {
    try {
      const result = await api("/api/admin/coach-session-bookings/remind", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          message: "Education session reminder: prepare replay notes, evidence questions, and risk-plan writing before the appointment.",
        }),
      });
      nodes.adminCoachSessionStatusText.textContent = `Coach session reminder ${result.reminder.id} sent locally.`;
      await refreshAdminCoachSessions();
      await refreshEducationServiceHealth();
      await refreshAuditLog();
    } catch (error) {
      nodes.adminCoachSessionStatusText.textContent = `Send coach session reminder failed: ${escapeHtml(error.message)}`;
    }
    return;
  }
  if (action === "assign-practice") {
    try {
      const result = await api("/api/admin/coach-session-bookings/assign-practice", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          instructions: "Complete this post-session education drill and write one evidence note plus one risk-plan improvement.",
        }),
      });
      nodes.adminCoachSessionStatusText.textContent = `Assigned post-session drill ${result.assignment.scenarioTitle}.`;
      state.data.practiceAssignments = result.assignments || state.data.practiceAssignments;
      state.data.notifications = result.notifications || state.data.notifications;
      await refreshAdminCoachSessions();
      await refreshEducationServiceHealth();
      await refreshAssignments();
      renderNotifications(state.data.notifications);
      await refreshAuditLog();
    } catch (error) {
      nodes.adminCoachSessionStatusText.textContent = `Assign post-session drill failed: ${escapeHtml(error.message)}`;
    }
    return;
  }
  const nextStatus = action === "confirm" ? "confirmed" : action;
  const body = {
    bookingId,
    status: nextStatus,
    assignedCoachEmail: "coach-a@tradegym.local",
    adminNote: "Education-only session scheduling update for learning evidence, replay notes, and risk-plan writing.",
  };
  if (nextStatus === "confirmed") {
    body.scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    body.meetingLink = "manual-scheduling-required";
  }
  try {
    const result = await api("/api/admin/coach-session-bookings/update", {
      method: "POST",
      body: JSON.stringify(body),
    });
    nodes.adminCoachSessionStatusText.textContent = `Coach session ${result.booking.id}: ${result.booking.status}`;
    await refreshAdminCoachSessions();
    await refreshEducationServiceHealth();
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.adminCoachSessionStatusText.textContent = `Update coach session failed: ${escapeHtml(error.message)}`;
  }
}

async function createServiceFollowup(deliveryId) {
  if (!nodes.serviceDeliveryStatus) return;
  try {
    const result = await api("/api/admin/service-delivery-followups", {
      method: "POST",
      body: JSON.stringify({ deliveryId }),
    });
    nodes.serviceDeliveryStatus.textContent = `Created follow-up task for ${result.task.email}: ${result.task.focus}`;
    await refreshServiceDelivery();
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.serviceDeliveryStatus.textContent = `Create follow-up failed: ${error.message}`;
  }
}

async function createBulkServiceFollowups() {
  if (!nodes.serviceDeliveryStatus) return;
  try {
    const result = await api("/api/admin/service-delivery-followups/bulk", {
      method: "POST",
      body: JSON.stringify({ includeWaiting: true }),
    });
    nodes.serviceDeliveryStatus.textContent = `Batch follow-ups: ${result.summary.created} created, ${result.summary.reused} reused, ${result.summary.skipped} skipped from ${result.summary.candidates} candidate(s). Open coach tasks ${result.slaQueue?.summary?.openCoachTasks ?? "-"} / limit ${result.slaQueue?.summary?.openLimit ?? "-"}.`;
    await refreshServiceDelivery();
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.serviceDeliveryStatus.textContent = `Batch follow-up failed: ${error.message}`;
  }
}

async function createServiceSlaActions() {
  if (!nodes.serviceDeliveryStatus) return;
  try {
    const result = await api("/api/admin/service-sla-actions/create", {
      method: "POST",
      body: JSON.stringify({
        ownerEmail: "success@tradegym.local",
        limit: 12,
        openLimit: 8,
      }),
    });
    nodes.serviceDeliveryStatus.textContent = `Service SLA actions: ${result.created || 0} created, ${result.reused || 0} reused. Queue ${result.slaQueue?.summary?.returned ?? 0}/${result.slaQueue?.summary?.total ?? 0}; productionReady ${result.productionReady}.`;
    await refreshServiceDelivery();
    await refreshPilotSuccessActions?.();
    await refreshAuditLog();
  } catch (error) {
    nodes.serviceDeliveryStatus.textContent = `Create SLA actions failed: ${escapeHtml(error.message)}`;
  }
}

async function createBulkContextRiskFollowups() {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/context-risk-followups/bulk", {
      method: "POST",
      body: JSON.stringify({ maxCreate: 20, q: nodes.coachConsoleSearch?.value.trim() || "" }),
    });
    nodes.coachConsoleStatus.textContent = `Context follow-ups: ${result.summary.created} created, ${result.summary.reused} reused, ${result.summary.skipped} skipped from ${result.summary.candidates} candidate(s).`;
    await refreshCoachConsole();
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Bulk context follow-ups failed: ${error.message}`;
  }
}

async function createBulkChartEvidenceFollowups() {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/chart-screenshot-intakes/evidence-followups/bulk", {
      method: "POST",
      body: JSON.stringify({ maxCreate: 20, q: nodes.coachConsoleSearch?.value.trim() || "" }),
    });
    nodes.coachConsoleStatus.textContent = `Chart evidence follow-ups: ${result.summary.created} created, ${result.summary.reused} reused, ${result.summary.skipped} skipped from ${result.summary.candidates} candidate(s).`;
    await refreshEducationServiceHealth();
    await refreshCoachTasks("", { chartEvidenceOnly: true });
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Bulk chart evidence follow-ups failed: ${error.message}`;
  }
}

function renderAdminSupportTickets(tickets = []) {
  if (!nodes.adminSupportTicketList) return;
  nodes.adminSupportTicketList.innerHTML = tickets.length
    ? tickets.slice(0, 30).map((ticket) => `
      <div class="attempt-row ops-row">
        <div>
          <strong>${escapeHtml(ticket.subject)} <span class="muted-inline">${escapeHtml(ticket.email || "")}</span></strong>
          <span>${escapeHtml(ticket.category)} / ${escapeHtml(ticket.status)} / ${escapeHtml(ticket.priority || "normal")} / age ${ticket.ageHours ?? 0}h / SLA ${formatTime(ticket.slaDueAt)}</span>
          <span>${escapeHtml(ticket.message)}</span>
          <span>Admin note: ${escapeHtml(ticket.adminNote || "No admin reply yet.")}</span>
          <span>${escapeHtml(ticket.constraints?.[1] || "Education support only.")}</span>
        </div>
        <div class="billing-actions">
          <button type="button" data-support-action="triaged" data-ticket-id="${escapeHtml(ticket.id)}">Triage</button>
          <button type="button" data-support-action="waiting_on_learner" data-ticket-id="${escapeHtml(ticket.id)}">Ask learner</button>
          <button type="button" data-support-action="resolved" data-ticket-id="${escapeHtml(ticket.id)}">Resolve</button>
          ${ticket.refundOrderId && ticket.refundStatus !== "approved" ? `<button type="button" data-refund-action="approve" data-ticket-id="${escapeHtml(ticket.id)}">Approve refund</button>` : ""}
          ${ticket.refundOrderId && !ticket.refundStatus ? `<button type="button" data-refund-action="reject" data-ticket-id="${escapeHtml(ticket.id)}">Reject refund</button>` : ""}
          <span class="tag ${ticket.overdue ? "danger" : "warn"}">${ticket.overdue ? "overdue" : escapeHtml(ticket.status)}</span>
        </div>
      </div>
    `).join("")
    : "<p>No support tickets match the current filters.</p>";
}

async function refreshAdminSupportTickets() {
  if (!nodes.adminSupportTicketList) return;
  try {
    const params = new URLSearchParams({
      limit: "50",
      q: nodes.adminSupportSearch?.value || "",
      status: nodes.adminSupportStatus?.value || "all",
    });
    const result = await api(`/api/admin/support-tickets?${params.toString()}`);
    const summary = result.summary || {};
    nodes.adminSupportStatusText.textContent = `Support tickets ${summary.total || 0} / open ${summary.open || 0} / waiting ${summary.waitingOnLearner || 0} / overdue ${summary.overdue || 0}`;
    renderAdminSupportTickets(result.tickets || []);
  } catch (error) {
    nodes.adminSupportStatusText.textContent = `Support queue requires admin login: ${escapeHtml(error.message)}`;
    nodes.adminSupportTicketList.innerHTML = "";
  }
}

async function exportSupportSlaReport(format) {
  if (!nodes.adminSupportStatusText || !nodes.adminSupportTicketList) return;
  try {
    const params = new URLSearchParams({
      format,
      limit: "100",
      q: nodes.adminSupportSearch?.value || "",
      status: nodes.adminSupportStatus?.value || "all",
      openLimit: "8",
    });
    const response = await fetch(`/api/admin/support-sla-report/export?${params.toString()}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Support/SLA report export failed");
    }
    const text = await response.text();
    nodes.adminSupportStatusText.textContent = `Support/SLA operations export ready: ${format.toUpperCase()} / ${text.length} bytes. Education service only.`;
    nodes.adminSupportTicketList.insertAdjacentHTML("afterbegin", `
      <div class="attempt-row ops-row">
        <div>
          <strong>Support/SLA operations report (${format.toUpperCase()})</strong>
          <span>Customer support, SLA, refund, and coach workload handoff only. No stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money instruction.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `);
    await refreshAuditLog();
  } catch (error) {
    nodes.adminSupportStatusText.textContent = `Support/SLA report export failed: ${escapeHtml(error.message)}`;
  }
}

async function updateSupportTicket(ticketId, status) {
  if (!nodes.adminSupportStatusText) return;
  try {
    const result = await api("/api/admin/support-tickets/update", {
      method: "POST",
      body: JSON.stringify({
        ticketId,
        status,
        adminNote: status === "triaged"
          ? "Support team triaged this education-service request and will route it to the right owner."
          : "Support response: this is handled as product education support only, without stock recommendations, live signals, return promises, or real-money trading instructions.",
      }),
    });
    nodes.adminSupportStatusText.textContent = `Updated support ticket ${result.ticket.id}: ${result.ticket.status}`;
    renderAdminSupportTickets(result.dashboard?.tickets || [result.ticket]);
    await refreshAuditLog();
  } catch (error) {
    nodes.adminSupportStatusText.textContent = `Update support ticket failed: ${escapeHtml(error.message)}`;
  }
}

async function processRefundRequest(ticketId, action) {
  if (!nodes.adminSupportStatusText) return;
  try {
    const result = await api("/api/admin/refund-requests/process", {
      method: "POST",
      body: JSON.stringify({
        ticketId,
        action,
        adminNote: action === "approve"
          ? "Approved refund review for this education SaaS billing request. No trading advice, signal, return promise, or real-money trading instruction was provided."
          : "Rejected refund review after billing policy check. This response is limited to education SaaS billing support.",
      }),
    });
    nodes.adminSupportStatusText.textContent = `${action === "approve" ? "Approved" : "Rejected"} refund request ${result.ticket.id}`;
    renderAdminSupportTickets(result.support?.tickets || [result.ticket]);
    await refreshRevenueLedger();
    await refreshAuditLog();
  } catch (error) {
    nodes.adminSupportStatusText.textContent = `Process refund failed: ${escapeHtml(error.message)}`;
  }
}

async function refreshCoachTasks(evidenceLoopStatus = "", options = {}) {
  if (!nodes.coachTaskList) return;
  try {
    const params = new URLSearchParams({ limit: "40" });
    if (evidenceLoopStatus) params.set("evidenceLoopStatus", evidenceLoopStatus);
    if (options.overdue !== undefined) params.set("overdue", options.overdue ? "true" : "false");
    if (options.chartEvidenceOnly) params.set("chartEvidenceOnly", "true");
    if (options.replayDebriefOnly) params.set("replayDebriefOnly", "true");
    const result = await api(`/api/admin/coach-review-tasks?${params.toString()}`);
    const totals = result.totals || {};
    const evidenceLoop = result.evidenceLoop || {};
    const workload = result.slaQueue?.workload || result.workload || {};
    const loopBacklog = evidenceLoop.backlog || {};
    const chartEvidence = evidenceLoop.chartEvidence || {};
    const replayDebrief = evidenceLoop.replayDebrief || {};
    const loopNextOperations = evidenceLoop.nextOperations?.length
      ? evidenceLoop.nextOperations.slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")
      : "<span>No evidence-loop backlog requiring action.</span>";
    const coachBreakdown = evidenceLoop.coachBreakdown?.length
      ? evidenceLoop.coachBreakdown.slice(0, 3).map((item) => `
        <span>${escapeHtml(item.coach || "unassigned")} / open ${item.open ?? 0} / ready apply ${item.readyToApply ?? 0} / ready closure ${item.readyForCoachCompletion ?? 0} / overdue ${item.overdue ?? 0}</span>
      `).join("")
      : "<span>No coach workload yet.</span>";
    const workloadRecommendations = workload.recommendations?.length
      ? workload.recommendations.slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")
      : "<span>No coach capacity recommendation yet.</span>";
    const recommendedAssignee = workload.recommendedAssignee
      ? `${workload.recommendedAssignee.assignedCoachEmail || workload.recommendedAssignee.coach} / capacity ${workload.recommendedAssignee.capacityRemaining ?? 0} / utilization ${workload.recommendedAssignee.utilizationPct ?? 0}%`
      : "No available coach below limit";
    const queueSummary = `
      <div class="attempt-row ops-row">
        <div>
          <strong>Coach task queue</strong>
          <span>${totals.open ?? 0} open / ${totals.respondedOpen ?? 0} learner responded / ${totals.overdueOpen ?? 0} overdue / ${totals.highPriorityOpen ?? 0} high priority</span>
          <span>Evidence loop ${evidenceLoop.assigned ?? 0} assigned / ${evidenceLoop.learnerResponded ?? 0} responded / ${evidenceLoop.nextActionApplied ?? 0} applied / ${evidenceLoop.nextActionAssignmentsCompleted ?? 0} assignment completed / response ${evidenceLoop.responseRatePct ?? 0}%</span>
          <span>Backlog ${loopBacklog.awaitingLearnerResponse ?? 0} awaiting learner / ${loopBacklog.readyToApply ?? 0} ready to apply / ${loopBacklog.awaitingAssignmentCompletion ?? 0} awaiting assignment / ${loopBacklog.readyForCoachCompletion ?? 0} ready for coach closure</span>
          <span>Chart evidence ${chartEvidence.open ?? 0} open / ${chartEvidence.readyToApply ?? 0} ready apply / ${chartEvidence.readyForCoachCompletion ?? 0} ready closure / ${chartEvidence.coachCompleted ?? 0} completed</span>
          <span>Replay debrief ${replayDebrief.open ?? 0} open / ${replayDebrief.readyToApply ?? 0} ready apply / ${replayDebrief.readyForCoachCompletion ?? 0} ready closure / ${replayDebrief.assignmentsCompleted ?? 0} assignment completed</span>
          <span>Capacity ${workload.totalOpen ?? 0} open / limit ${workload.openLimit ?? "--"} / over limit ${workload.overLimitCount ?? 0} / next ${escapeHtml(recommendedAssignee)}</span>
          <div class="clean-list">${loopNextOperations}</div>
          <div class="clean-list">${coachBreakdown}</div>
          <div class="clean-list">${workloadRecommendations}</div>
          <span>${escapeHtml(result.constraints?.[1] || "No stock recommendation, live signal, return promise, or real-money trading instruction.")}</span>
        </div>
        <div class="billing-actions">
          <button type="button" data-coach-action="filter-evidence-loop" data-evidence-loop-status="">All loop tasks</button>
          <button type="button" data-coach-action="filter-chart-evidence">Chart evidence</button>
          <button type="button" data-coach-action="filter-replay-debrief">Replay debrief</button>
          <button type="button" data-coach-action="filter-overdue-tasks">Overdue tasks</button>
          <button type="button" data-coach-action="filter-evidence-loop" data-evidence-loop-status="ready_to_apply">Ready to apply</button>
          <button type="button" data-coach-action="filter-evidence-loop" data-evidence-loop-status="awaiting_assignment_completion">Awaiting assignment</button>
          <button type="button" data-coach-action="filter-evidence-loop" data-evidence-loop-status="ready_for_coach_closure">Ready closure</button>
          <button type="button" data-coach-action="export-evidence-loop-json">Export loop JSON</button>
          <button type="button" data-coach-action="export-evidence-loop-csv">Export loop CSV</button>
        </div>
      </div>
    `;
    const taskRows = result.tasks.length
      ? result.tasks.map((task) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${task.learnerName} <span class="muted-inline">${task.email}</span></strong>
            <span>${task.status} / ${escapeHtml(task.priority || "normal")} priority / due ${formatTime(task.dueAt)}${task.overdue ? " / overdue" : ""}</span>
            <span>Learner ${escapeHtml(task.learnerStatus || "unread")}${task.learnerRespondedAt ? ` / responded ${formatTime(task.learnerRespondedAt)}` : task.learnerOpenedAt ? ` / opened ${formatTime(task.learnerOpenedAt)}` : ""}</span>
            <span>Assigned coach ${escapeHtml(task.assignedCoachEmail || "unassigned")}</span>
            <span>Focus ${escapeHtml(task.focus)} / created ${formatTime(task.createdAt)} / age ${task.ageHours ?? 0}h</span>
            ${task.learnerResponse ? `<span>Learner reflection: ${escapeHtml(task.learnerResponse)}</span>` : ""}
            ${task.nextEducationAction?.label ? `<span>Next education action: ${escapeHtml(task.nextEducationAction.label)} / ${escapeHtml(task.nextEducationAction.rationale || "Education workflow only.")}${task.nextEducationActionAppliedAt ? ` / applied ${formatTime(task.nextEducationActionAppliedAt)}` : ""}</span>` : ""}
            ${task.nextEducationActionAssignment ? `<span>Applied assignment: ${escapeHtml(task.nextEducationActionAssignment.scenarioTitle || "practice")} / ${escapeHtml(task.nextEducationActionAssignment.status || "assigned")}${task.nextEducationActionAssignment.completedAt ? ` / completed ${formatTime(task.nextEducationActionAssignment.completedAt)}` : ""}${task.nextEducationActionAssignment.completedAttemptId ? ` / attempt ${escapeHtml(task.nextEducationActionAssignment.completedAttemptId)}` : ""}</span>` : ""}
            <span>${task.coachNote || task.requestNote || "No coach note yet."}</span>
            <textarea data-coach-task-note="${task.id}" rows="3" placeholder="Education note for this learner. No stock picks, signals, or return promises.">${task.coachNote || ""}</textarea>
          </div>
          <div class="billing-actions">
            ${task.nextEducationAction?.label && !task.nextEducationActionAppliedAt ? `<button type="button" data-coach-action="apply-evidence-next-action" data-task-id="${task.id}">Apply next action</button>` : ""}
            ${task.status === "open" ? `<button type="button" data-coach-action="assign-recommended" data-task-id="${task.id}">Assign recommended</button>` : ""}
            <button type="button" data-coach-action="complete-task" data-task-id="${task.id}">Complete</button>
            <button type="button" data-coach-action="cancel-task" data-task-id="${task.id}">Cancel</button>
          </div>
        </div>
      `).join("")
      : "<p>No coach review tasks yet.</p>";
    nodes.coachTaskList.innerHTML = `${queueSummary}${taskRows}`;
  } catch (error) {
    nodes.coachTaskList.innerHTML = `<p>Coach review tasks require admin login: ${error.message}</p>`;
  }
}

async function assignRecommendedCoachTask(taskId) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/coach-review-tasks/assign-recommended", {
      method: "POST",
      body: JSON.stringify({ taskId }),
    });
    nodes.coachConsoleStatus.textContent = `Assigned recommended coach ${result.assignment.assignedCoachEmail}: ${result.assignment.reason}`;
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Recommended coach assignment failed: ${error.message}`;
  }
}

async function createCoachReviewTask(userId, focus) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/coach-review-tasks", {
      method: "POST",
      body: JSON.stringify({
        userId,
        focus,
        requestNote: "Review this learner's recent education practice report and provide one discipline-focused next step.",
        priority: "normal",
        assignedCoachEmail: "admin@tradegym.local",
      }),
    });
    nodes.coachConsoleStatus.textContent = `Created review task for ${result.task.email}: ${result.task.focus}`;
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Create review task failed: ${error.message}`;
  }
}

async function createLearningEvidenceFollowup(userId) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/learning-evidence-followups", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    nodes.coachConsoleStatus.textContent = `${result.reused ? "Reused" : "Created"} evidence follow-up for ${result.task.email}: ${result.task.focus}`;
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Evidence follow-up failed: ${error.message}`;
  }
}

async function createContextRiskFollowup(userId) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/context-risk-followups", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    nodes.coachConsoleStatus.textContent = `${result.reused ? "Reused" : "Created"} context follow-up for ${result.task.email}: ${result.task.focus}`;
    await refreshCoachConsole();
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Context follow-up failed: ${error.message}`;
  }
}

async function applyEvidenceNextAction(taskId) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/learning-evidence-next-actions/apply", {
      method: "POST",
      body: JSON.stringify({ taskId }),
    });
    nodes.coachConsoleStatus.textContent = `${result.reused ? "Reused" : "Created"} next-action assignment: ${result.assignment.scenarioTitle} for ${result.assignment.email}`;
    await refreshCoachTasks();
    await refreshAssignments();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Apply next action failed: ${error.message}`;
  }
}

async function createPracticeAssignment(userId, scenarioId, focus) {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/assignments", {
      method: "POST",
      body: JSON.stringify({
        userId,
        scenarioId,
        focus,
        instructions: "Complete this education-only chart decision drill and write a plan with structure, invalidation, and risk limit.",
      }),
    });
    nodes.coachConsoleStatus.textContent = `Assigned ${result.assignment.scenarioTitle} to ${result.assignment.email}`;
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Create assignment failed: ${error.message}`;
  }
}

function firstPublishedAdminPackage() {
  return (state.adminCoursePackages || []).find((item) => item.status === "published")
    || (state.data?.coursePackages || []).find((item) => item.status === "published");
}

async function assignCoursePackageToLearner(userId, coursePackageId = "") {
  if (!nodes.coachConsoleStatus) return;
  const coursePackage = coursePackageId
    ? (state.adminCoursePackages || []).find((item) => item.id === coursePackageId)
      || (state.data?.coursePackages || []).find((item) => item.id === coursePackageId)
      || { id: coursePackageId, title: "recommended package" }
    : firstPublishedAdminPackage();
  if (!coursePackage) {
    nodes.coachConsoleStatus.textContent = "No published course package is available for assignment.";
    return;
  }
  try {
    const result = await api("/api/admin/course-package-assignments", {
      method: "POST",
      body: JSON.stringify({
        userId,
        coursePackageId: coursePackage.id,
        instructions: coursePackageId
          ? "Complete this recommended education-only course package from the progress report. Review concepts, finish chart drills, and read the completion report."
          : "Complete this education-only course package: review concepts, finish chart drills, and read the completion report.",
      }),
    });
    nodes.coachConsoleStatus.textContent = `Assigned package ${result.coursePackage.title} to ${result.enrollments.length} learner(s), with ${result.practiceAssignments.length} practice drills`;
    await refreshCoursePackages();
    await refreshCoachConsole();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Assign package failed: ${error.message}`;
  }
}

async function createMetricFollowup(userId, coursePackageId = "") {
  if (!nodes.coachConsoleStatus) return;
  try {
    const result = await api("/api/admin/backtest-metric-followups", {
      method: "POST",
      body: JSON.stringify({ userId, coursePackageId }),
    });
    nodes.coachConsoleStatus.textContent = `${result.reused ? "Reused" : "Created"} metric follow-up for ${result.task.email}: ${result.task.coursePackageTitle}`;
    await refreshCoachConsole();
    await refreshCoachTasks();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Metric follow-up failed: ${error.message}`;
  }
}

async function refreshCohorts() {
  if (!nodes.cohortList) return;
  try {
    const result = await api("/api/admin/cohorts");
    nodes.cohortStatus.textContent = `Cohorts ${result.summary.cohorts}, members ${result.summary.members}, completed ${result.summary.completedAssignments}, needs coach ${result.summary.needsCoachReview}`;
    nodes.cohortList.innerHTML = result.cohorts.length
      ? result.cohorts.map((cohort) => `
        <div class="attempt-row ops-row">
          <div>
            <strong>${cohort.name}</strong>
            <span>${cohort.status} / members ${cohort.memberCount} / assignments ${cohort.assignmentSummary.total} / completion ${cohort.assignmentSummary.completionRate}%</span>
            <span>Course packages ${cohort.coursePackageSummary.total} / package completion ${cohort.coursePackageSummary.completionRate}%</span>
            <span>Risk discipline ${cohort.averageRiskDiscipline ?? "--"} / needs coach ${cohort.needsCoachReview.length}</span>
            <span>${cohort.topMistakes.length ? cohort.topMistakes.map((item) => `${item.tag} x${item.count}`).join(" / ") : "No class mistake profile yet"}</span>
            <span>${cohort.memberProgress.map((member) => `${member.email}: drills ${member.completionRate}% / package ${member.coursePackageCompletionRate}%${member.needsCoachReview ? " / coach" : ""}`).join(" | ")}</span>
          </div>
          <div class="billing-actions">
            <button type="button" data-cohort-action="view-report" data-cohort-id="${cohort.id}">View report</button>
            <button type="button" data-cohort-action="success-brief" data-cohort-id="${cohort.id}">Success</button>
            <button type="button" data-cohort-action="success-csv" data-cohort-id="${cohort.id}">Success CSV</button>
            <button type="button" data-cohort-action="success-md" data-cohort-id="${cohort.id}">Success Brief</button>
            <button type="button" data-cohort-action="compliance-pack" data-cohort-id="${cohort.id}">Compliance</button>
            <button type="button" data-cohort-action="compliance-csv" data-cohort-id="${cohort.id}">Compliance CSV</button>
            <button type="button" data-cohort-action="compliance-md" data-cohort-id="${cohort.id}">Compliance Brief</button>
            <button type="button" data-cohort-action="procurement-packet" data-cohort-id="${cohort.id}">Procurement</button>
            <button type="button" data-cohort-action="renewal-review" data-cohort-id="${cohort.id}">Renewal</button>
            <button type="button" data-cohort-action="renewal-csv" data-cohort-id="${cohort.id}">Renewal CSV</button>
            <button type="button" data-cohort-action="renewal-md" data-cohort-id="${cohort.id}">Renewal Brief</button>
            <button type="button" data-cohort-action="renewal-actions" data-cohort-id="${cohort.id}">Renewal Actions</button>
            <button type="button" data-cohort-action="procurement-deliver" data-cohort-id="${cohort.id}">Send packet</button>
            <button type="button" data-cohort-action="procurement-followup" data-cohort-id="${cohort.id}">Create follow-up</button>
            <button type="button" data-cohort-action="procurement-progress" data-cohort-id="${cohort.id}">Progress</button>
            <button type="button" data-cohort-action="procurement-progress-csv" data-cohort-id="${cohort.id}">Progress CSV</button>
            <button type="button" data-cohort-action="procurement-progress-md" data-cohort-id="${cohort.id}">Progress Brief</button>
            <button type="button" data-cohort-action="procurement-progress-meeting" data-cohort-id="${cohort.id}">Progress Meeting</button>
            <button type="button" data-cohort-action="procurement-meeting-actions" data-cohort-id="${cohort.id}">Meeting Actions</button>
            <button type="button" data-cohort-action="procurement-csv" data-cohort-id="${cohort.id}">Procurement CSV</button>
            <button type="button" data-cohort-action="procurement-md" data-cohort-id="${cohort.id}">Procurement Brief</button>
            <button type="button" data-cohort-action="export-json" data-cohort-id="${cohort.id}">Export JSON</button>
            <button type="button" data-cohort-action="export-csv" data-cohort-id="${cohort.id}">Export CSV</button>
            <button type="button" data-cohort-action="export-md" data-cohort-id="${cohort.id}">Brief</button>
            <button type="button" data-cohort-action="learning-records" data-cohort-id="${cohort.id}">Learning records</button>
            <button type="button" data-cohort-action="assign" data-cohort-id="${cohort.id}">Assign reviewed practice</button>
            <button type="button" data-cohort-action="assign-course-package" data-cohort-id="${cohort.id}">Assign package</button>
          </div>
        </div>
      `).join("")
      : "<p>No cohorts yet.</p>";
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohorts require admin login: ${error.message}`;
    nodes.cohortList.innerHTML = "";
  }
}

function renderCohortCompliancePack(pack) {
  if (!pack) return "";
  const summary = pack.summary || {};
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Cohort Compliance Pack</p>
        <h3>${escapeHtml(pack.cohort?.name || "Cohort")}</h3>
      </div>
      <span class="tag ${summary.gaps ? "danger" : "ok"}">${summary.complianceRate || 0}% compliant</span>
    </div>
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(pack.schemaVersion || "cohort-compliance-pack")}</strong>
        <span>Learners ${summary.learners || 0} / legal ${summary.legalAccepted || 0} / risk ack ${summary.educationRiskAcknowledged || 0} / email verified ${summary.emailVerified || 0}</span>
        <span>Open deletion requests ${summary.openDeletionRequests || 0} / support tickets ${summary.openSupportTickets || 0} / gaps ${summary.gaps || 0}</span>
        <span>Current versions: terms ${escapeHtml(pack.currentLegalVersions?.terms || "")} / privacy ${escapeHtml(pack.currentLegalVersions?.privacy || "")} / risk ${escapeHtml(pack.currentLegalVersions?.risk || "")} / education ${escapeHtml(pack.currentLegalVersions?.educationRisk || "")}</span>
        <ol class="clean-list">${(pack.nextComplianceActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>No compliance action required for this cohort.</li>"}</ol>
        <span>${escapeHtml(pack.constraints?.[1] || "Compliance pack is education-boundary evidence only, not trading-performance evidence.")}</span>
      </div>
      <div class="profile-tags">
        <span class="tag warn">Legal draft</span>
        <span class="tag warn">Prototype</span>
      </div>
    </div>
  `;
}

async function viewCohortCompliancePack(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api(`/api/admin/cohort-compliance-pack?cohortId=${encodeURIComponent(cohortId)}`);
    nodes.cohortStatus.textContent = `Loaded cohort compliance pack: ${result.pack.summary.complianceRate}% compliant. Education boundary evidence only.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortCompliancePack(result.pack));
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort compliance pack failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCohortCompliancePack(cohortId, format) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const response = await fetch(`/api/admin/cohort-compliance-pack/export?cohortId=${encodeURIComponent(cohortId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Cohort compliance pack export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Cohort compliance pack export ready: ${format.toUpperCase()} / ${text.length} bytes. Education boundary evidence only.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort compliance pack (${format.toUpperCase()})</strong>
            <span>Institution evidence for terms, privacy, risk disclosure, education-risk acknowledgement, support, and data-rights workflow. Not trading-performance evidence or investment advice.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort compliance pack export failed: ${escapeHtml(error.message)}`;
  }
}

function renderCohortSuccessBrief(brief) {
  if (!brief) return "";
  const summary = brief.summary || {};
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Cohort Success Brief</p>
        <h3>${escapeHtml(brief.cohort?.name || "Cohort")}</h3>
      </div>
      <span class="tag ${brief.status === "healthy" ? "ok" : brief.status === "needs_attention" ? "danger" : "warn"}">${escapeHtml(brief.status || "watch")} / ${brief.healthScore ?? 0}</span>
    </div>
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(brief.schemaVersion || "cohort-success-brief")}</strong>
        <span>Members ${summary.members || 0} / practice ${summary.practiceCompletionRate || 0}% / package ${summary.packageCompletionRate || 0}% / learning statements ${summary.learningRecordStatements || 0}</span>
        <span>Roster attention ${summary.rosterNeedsAttention || 0} / activation follow-ups ${summary.openActivationTasks || 0} / support tickets ${summary.openSupportTickets || 0} / coach review ${summary.needsCoachReview || 0}</span>
        <ol class="clean-list">${(brief.nextCustomerSuccessActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <span>${escapeHtml(brief.constraints?.[1] || "Health score is education customer-success operations only, not trading performance.")}</span>
      </div>
      <div class="profile-tags">
        <span class="tag warn">Education</span>
        <span class="tag warn">Prototype</span>
      </div>
    </div>
  `;
}

async function viewCohortSuccessBrief(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api(`/api/admin/cohort-success-brief?cohortId=${encodeURIComponent(cohortId)}`);
    nodes.cohortStatus.textContent = `Loaded cohort success brief: ${result.brief.status} / ${result.brief.healthScore}. Education customer-success only.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortSuccessBrief(result.brief));
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort success brief failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCohortSuccessBrief(cohortId, format) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const response = await fetch(`/api/admin/cohort-success-brief/export?cohortId=${encodeURIComponent(cohortId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Cohort success brief export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Cohort success brief export ready: ${format.toUpperCase()} / ${text.length} bytes. Education customer-success only.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort success brief (${format.toUpperCase()})</strong>
            <span>Customer-success operating evidence only. Not trading-performance evidence, investment advice, live signal quality, broker readiness, auto-trading, or real-money trading readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort success brief export failed: ${escapeHtml(error.message)}`;
  }
}

function renderCohortProcurementPacket(packet) {
  if (!packet) return "";
  const summary = packet.summary || {};
  const curriculum = packet.evidence?.curriculumSourceEvidence || {};
  const blockerTags = (packet.blockerCategories || []).slice(0, 6).map((item) => (
    `<span class="tag ${["blocked", "needs_action", "prototype_only"].includes(item.status) ? "warn" : "ok"}">${escapeHtml(item.label || item.category || item.key)} ${escapeHtml(item.status || "")} ${item.count || 0}</span>`
  )).join("");
  const curriculumRows = (curriculum.packages || []).slice(0, 4).map((item) => (
    `${escapeHtml(item.coursePackageTitle || "Package")} / source ${escapeHtml(item.contentSourceTitle || item.contentSourceId || "missing")} / blockers ${(item.blockers || []).map(escapeHtml).join(", ") || "none"}`
  ));
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Cohort Procurement Packet</p>
        <h3>${escapeHtml(packet.cohort?.name || "Cohort")}</h3>
      </div>
      <span class="tag ${summary.blockers ? "warn" : "ok"}">${escapeHtml(packet.readiness || "review")}</span>
    </div>
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(packet.schemaVersion || "cohort-procurement-packet")}</strong>
        <span>Health ${summary.healthScore || 0}/100 / compliance ${summary.complianceRate || 0}% / learning statements ${summary.learningRecordStatements || 0} / completions ${summary.completionReports || 0}</span>
        <span>Compliance gaps ${summary.complianceGaps || 0} / support tickets ${summary.openSupportTickets || 0} / activation follow-ups ${summary.openActivationTasks || 0} / coach review ${summary.needsCoachReview || 0}</span>
        <span>Service SLA actions open ${summary.serviceSlaActionsOpen || 0} / in progress ${summary.serviceSlaActionsInProgress || 0} / done ${summary.serviceSlaActionsDone || 0}</span>
        <span>Curriculum packages ${summary.curriculumPackages || 0} / sources attached ${summary.curriculumSourcesAttached || 0} / source blockers ${summary.curriculumSourceBlockers || 0}</span>
        <ol class="clean-list">${curriculumRows.map((item) => `<li>${item}</li>`).join("") || "<li>No curriculum source evidence attached yet.</li>"}</ol>
        <div class="profile-tags">${blockerTags || '<span class="tag ok">No structured blocker</span>'}</div>
        <ol class="clean-list">${(packet.executiveSummary || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <span>${escapeHtml(packet.constraints?.[2] || "Procurement packet is education SaaS evidence only, not trading-performance evidence.")}</span>
      </div>
      <div class="profile-tags">
        <span class="tag warn">Procurement</span>
        <span class="tag warn">Prototype</span>
      </div>
    </div>
  `;
}

async function viewCohortProcurementPacket(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api(`/api/admin/cohort-procurement-packet?cohortId=${encodeURIComponent(cohortId)}`);
    nodes.cohortStatus.textContent = `Loaded cohort procurement packet: ${result.packet.readiness}. Education SaaS institution evidence only.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortProcurementPacket(result.packet));
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement packet failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCohortProcurementPacket(cohortId, format) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const response = await fetch(`/api/admin/cohort-procurement-packet/export?cohortId=${encodeURIComponent(cohortId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Cohort procurement packet export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Cohort procurement packet export ready: ${format.toUpperCase()} / ${text.length} bytes. Education SaaS institution evidence only.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort procurement packet (${format.toUpperCase()})</strong>
            <span>Institution procurement and renewal evidence for learning adoption, legal/risk acknowledgements, onboarding, support, and coach follow-through. Not trading-performance evidence or investment advice.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement packet export failed: ${escapeHtml(error.message)}`;
  }
}

function renderCohortRenewalReview(packet) {
  if (!packet) return "";
  const summary = packet.summary || {};
  const blockerTags = (packet.renewalBlockers || []).slice(0, 6).map((item) => (
    `<span class="tag ${["blocked", "needs_action", "prototype_only"].includes(item.status) ? "warn" : "ok"}">${escapeHtml(item.label || item.category)} ${escapeHtml(item.status || "")}</span>`
  )).join("");
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Cohort Renewal Review</p>
        <h3>${escapeHtml(packet.cohort?.name || "Cohort")}</h3>
      </div>
      <span class="tag ${summary.renewalBlockers ? "warn" : "ok"}">${escapeHtml(packet.renewalStatus || "renewal_review")}</span>
    </div>
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(packet.schemaVersion || "cohort-renewal-review")}</strong>
        <span>Health ${summary.healthScore || 0}/100 / compliance ${summary.complianceRate || 0}% / learning statements ${summary.learningRecordStatements || 0} / completions ${summary.completionReports || 0}</span>
        <span>Procurement deliveries ${summary.procurementDeliveries || 0} / ready ${summary.procurementReady || 0} / feedback needs action ${summary.procurementFeedbackNeedsAction || 0} / actions done ${summary.procurementActionsDone || 0}</span>
        <span>Buyer evidence requests ${summary.buyerEvidenceRequests || 0} / evidence loop ${summary.evidenceLoopTasks || 0} task(s) / assignments completed ${summary.evidenceLoopAssignmentsCompleted || 0} / ready closure ${summary.evidenceLoopReadyForCoachClosure || 0}</span>
        <div class="profile-tags">${blockerTags || '<span class="tag ok">No renewal blocker</span>'}</div>
        <ol class="clean-list">${(packet.executiveSummary || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <ol class="clean-list">${(packet.nextRenewalActions || []).slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Keep cohort in weekly education customer-success review.</li>"}</ol>
        <span>${escapeHtml(packet.constraints?.[2] || "Renewal review is education SaaS evidence only, not trading-performance evidence.")}</span>
      </div>
      <div class="profile-tags">
        <span class="tag warn">Renewal</span>
        <span class="tag warn">Prototype</span>
      </div>
    </div>
  `;
}

async function viewCohortRenewalReview(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api(`/api/admin/cohort-renewal-review?cohortId=${encodeURIComponent(cohortId)}`);
    nodes.cohortStatus.textContent = `Loaded cohort renewal review: ${result.packet.renewalStatus}. Education SaaS customer-success only.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortRenewalReview(result.packet));
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort renewal review failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCohortRenewalReview(cohortId, format) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const response = await fetch(`/api/admin/cohort-renewal-review/export?cohortId=${encodeURIComponent(cohortId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Cohort renewal review export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Cohort renewal review export ready: ${format.toUpperCase()} / ${text.length} bytes. Education SaaS customer-success only.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort renewal review (${format.toUpperCase()})</strong>
            <span>Institution renewal/QBR evidence for learning adoption, compliance, buyer evidence requests, procurement follow-through, and coach workflow. Not trading-performance evidence or investment advice.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort renewal review export failed: ${escapeHtml(error.message)}`;
  }
}

async function createCohortRenewalReviewActions(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const result = await api("/api/admin/cohort-renewal-review/create-actions", {
      method: "POST",
      body: JSON.stringify({
        cohortId,
        ownerEmail: "success@tradegym.local",
        maxCreate: 6,
      }),
    });
    nodes.cohortStatus.textContent = `Cohort renewal actions: ${result.created} created / ${result.reused} reused. Production ready remains no.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort renewal review actions</strong>
            <span>${result.created} created / ${result.reused} reused / ${result.skipped || 0} skipped / status ${escapeHtml(result.packet?.renewalStatus || "renewal_review")}</span>
            <ol class="clean-list">${(result.actions || []).slice(0, 5).map((item) => `<li>${escapeHtml(item.title || "Renewal action")} / ${escapeHtml(item.priority || "medium")} / owner ${escapeHtml(item.ownerEmail || "unassigned")}</li>`).join("") || "<li>No renewal action candidate.</li>"}</ol>
            <span>${escapeHtml(result.constraints?.[1] || "Renewal actions are education customer-success tasks only, not trading-performance evidence.")}</span>
          </div>
          <span class="tag warn">CS actions</span>
        </div>
      `
    );
    await refreshPilotSuccessActions();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort renewal actions failed: ${escapeHtml(error.message)}`;
  }
}

async function createCohortProcurementFollowup(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const result = await api("/api/admin/cohort-procurement-followups", {
      method: "POST",
      body: JSON.stringify({ cohortId }),
    });
    nodes.cohortStatus.textContent = `Cohort procurement follow-up ${result.reused ? "reused" : "created"}: ${result.task.focus}. Education customer-success only.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(result.task.focus || "Cohort procurement follow-up")}</strong>
            <span>${escapeHtml(result.task.priority || "normal")} / due ${escapeHtml(result.task.dueAt || "")} / readiness ${escapeHtml(result.task.packetReadiness || result.packet?.readiness || "review")}</span>
            <span>${escapeHtml(result.task.requestNote || "").slice(0, 420)}</span>
            <span>${escapeHtml(result.constraints?.[2] || "No stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money instruction.")}</span>
          </div>
          <span class="tag warn">${result.reused ? "reused" : "created"}</span>
        </div>
      `
    );
    await refreshActivationInterventions();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement follow-up failed: ${escapeHtml(error.message)}`;
  }
}

async function deliverCohortProcurementPacket(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const result = await api("/api/admin/cohort-procurement-deliveries", {
      method: "POST",
      body: JSON.stringify({
        cohortId,
        recipientEmail: "success@tradegym.local",
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.cohortStatus.textContent = `Cohort procurement packet delivery recorded: ${result.delivery.recipientEmail} / ${result.delivery.providerMode}. Production ready remains no.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort procurement delivery</strong>
            <span>${escapeHtml(result.delivery.cohortName || result.delivery.cohortId)} / ${escapeHtml(result.delivery.recipientEmail || "")} / ${escapeHtml(result.delivery.providerMode || "local-simulated")} / feedback ${escapeHtml(result.delivery.feedbackStatus || "pending_feedback")}</span>
            <span>${escapeHtml(result.delivery.subject || "")}</span>
            <span>${escapeHtml(result.constraints?.[1] || "Local provider mode is simulated and does not prove production email delivery.")}</span>
            <div class="billing-actions">
              <button type="button" data-cohort-procurement-feedback="objections" data-cohort-procurement-delivery-id="${escapeHtml(result.delivery.id)}">Objection</button>
              <button type="button" data-cohort-procurement-feedback="needs_more_evidence" data-cohort-procurement-delivery-id="${escapeHtml(result.delivery.id)}">More evidence</button>
              <button type="button" data-cohort-procurement-feedback="procurement_ready" data-cohort-procurement-delivery-id="${escapeHtml(result.delivery.id)}">Procurement ready</button>
              <button type="button" data-cohort-procurement-feedback="no_fit" data-cohort-procurement-delivery-id="${escapeHtml(result.delivery.id)}">No fit</button>
            </div>
          </div>
          <span class="tag warn">sent</span>
        </div>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement delivery failed: ${escapeHtml(error.message)}`;
  }
}

async function recordCohortProcurementFeedback(deliveryId, feedbackStatus) {
  if (!nodes.cohortStatus || !nodes.cohortList || !deliveryId) return;
  const nextByStatus = {
    objections: "Schedule an education customer-success call to resolve institution procurement objections.",
    needs_more_evidence: "Collect additional learning adoption, compliance, support, or coach follow-through evidence before procurement review.",
    procurement_ready: "Prepare education SaaS procurement paperwork around learning adoption and compliance evidence.",
    no_fit: "Close this institution procurement path and document education product fit gaps.",
  };
  try {
    const result = await api("/api/admin/cohort-procurement-deliveries/feedback", {
      method: "POST",
      body: JSON.stringify({
        deliveryId,
        feedbackStatus,
        feedbackNote: `Recorded institution procurement feedback status ${feedbackStatus} for an education-only cohort packet.`,
        nextCustomerSuccessAction: nextByStatus[feedbackStatus] || "Plan the next education customer-success follow-up.",
        institutionOwnerEmail: "success@tradegym.local",
        targetReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        decisionNote: `Education-only procurement decision context for ${feedbackStatus}; not production readiness, trading readiness, broker readiness, or real-money readiness.`,
      }),
    });
    nodes.cohortStatus.textContent = `Cohort procurement feedback recorded: ${result.delivery.feedbackStatus}. Production ready remains no.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort procurement feedback</strong>
            <span>${escapeHtml(result.delivery.cohortName || result.delivery.cohortId)} / ${escapeHtml(result.delivery.feedbackStatus || feedbackStatus)} / ${escapeHtml(result.delivery.recipientEmail || "")}</span>
            <span>Owner ${escapeHtml(result.delivery.institutionOwnerEmail || "not set")} / target review ${escapeHtml(result.delivery.targetReviewAt || "not set")}</span>
            <span>${escapeHtml(result.delivery.nextCustomerSuccessAction || "")}</span>
            <span>${escapeHtml(result.constraints?.[1] || "Feedback status is not trading performance or real-money readiness.")}</span>
          </div>
          <button type="button" data-cohort-procurement-action="${escapeHtml(result.delivery.id)}">Create action</button>
        </div>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement feedback failed: ${escapeHtml(error.message)}`;
  }
}

async function createCohortProcurementFeedbackAction(deliveryId) {
  if (!nodes.cohortStatus || !nodes.cohortList || !deliveryId) return;
  try {
    const result = await api("/api/admin/cohort-procurement-deliveries/create-action", {
      method: "POST",
      body: JSON.stringify({
        deliveryId,
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.cohortStatus.textContent = `Cohort procurement feedback action ${result.reused ? "reused" : "created"}: ${result.action.title}. Production ready remains no.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>${escapeHtml(result.action.title || "Cohort procurement feedback action")}</strong>
            <span>${escapeHtml(result.action.priority || "medium")} / ${escapeHtml(result.action.status || "open")} / owner ${escapeHtml(result.action.ownerEmail || "unassigned")}</span>
            <span>${escapeHtml(result.action.next || "")}</span>
            <span>${escapeHtml(result.constraints?.[1] || "Action is education customer-success only, not trading performance evidence.")}</span>
          </div>
          <span class="tag warn">${result.reused ? "reused" : "created"}</span>
        </div>
      `
    );
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement feedback action failed: ${escapeHtml(error.message)}`;
  }
}

function renderCohortProcurementProgress(report) {
  if (!report) return "";
  const summary = report.summary || {};
  const deliveries = report.deliveries || [];
  const actionRollup = summary.institutionCsActionRollup || {};
  const serviceRollup = summary.serviceSlaActionRollup || {};
  const blockerTags = (summary.blockerCategoryCounts || []).slice(0, 6).map((item) => (
    `<span class="tag ${item.blocked || item.needsAction || item.prototypeOnly ? "warn" : "ok"}">${escapeHtml(item.label || item.key)} ${item.blocked || item.needsAction || item.prototypeOnly || item.total || 0}</span>`
  )).join("");
  const rollupRows = [
    ...(actionRollup.byOwner || []).slice(0, 3).map((item) => `Owner ${escapeHtml(item.ownerEmail)} open ${item.open || 0} / high ${item.high || 0}`),
    ...(actionRollup.byBlockerCategory || []).slice(0, 3).map((item) => `${escapeHtml(item.label || item.category)} actions ${item.totalActions || 0} / open ${item.open || 0}`),
  ].map((item) => `<li>${item}</li>`).join("");
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Cohort Procurement Progress</p>
        <h3>Institution follow-through</h3>
      </div>
      <span class="tag warn">${summary.total || 0} delivery records</span>
    </div>
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(report.schemaVersion || "cohort-procurement-progress")}</strong>
        <span>Waiting feedback ${summary.waitingForFeedback || 0} / needs action ${summary.feedbackNeedsAction || 0} / ready ${summary.procurementReady || 0} / objections ${summary.objections || 0} / more evidence ${summary.needsMoreEvidence || 0}</span>
        <span>Actions open ${summary.feedbackActionsOpen || 0} / in progress ${summary.feedbackActionsInProgress || 0} / done ${summary.feedbackActionsDone || 0} / deferred ${summary.feedbackActionsDeferred || 0}</span>
        <span>Provider local simulated ${summary.localSimulated || 0}. Production ready remains ${String(report.productionReady)}.</span>
        <span>Institution CS actions ${actionRollup.totalActions || 0} / open ${actionRollup.open || 0} / in progress ${actionRollup.inProgress || 0} / high ${actionRollup.high || 0}</span>
        <span>Service SLA actions ${serviceRollup.totalActions || 0} / open ${serviceRollup.open || 0} / in progress ${serviceRollup.inProgress || 0} / done ${serviceRollup.done || 0}</span>
        <div class="profile-tags">${blockerTags || '<span class="tag ok">No blocker category yet</span>'}</div>
        <ol class="clean-list">${rollupRows || "<li>No institution CS action rollup yet.</li>"}</ol>
        <ol class="clean-list">
          ${deliveries.slice(0, 6).map((item) => `
            <li>
              ${escapeHtml(item.cohortName || item.cohortId || "Cohort")} / blocker ${escapeHtml(item.dominantBlockerLabel || item.dominantBlockerCategory || "none")} / owner ${escapeHtml(item.institutionOwnerEmail || "not set")} / target ${escapeHtml(item.targetReviewAt || "not set")} / ${escapeHtml(item.feedbackStatus || "pending_feedback")} / action ${escapeHtml(item.nextActionStatus || "none")} / ${escapeHtml(item.nextCustomerSuccessAction || "")}
              <div class="billing-actions">
                <button type="button" data-cohort-procurement-buyer-review="${escapeHtml(item.id)}">Buyer review</button>
                <button type="button" data-cohort-procurement-buyer-objection="${escapeHtml(item.id)}">Log objection</button>
              </div>
            </li>
          `).join("") || "<li>No procurement handoff record yet.</li>"}
        </ol>
        <span>${escapeHtml(report.constraints?.[1] || "Progress is education customer-success evidence only, not trading performance or production readiness.")}</span>
      </div>
      <div class="profile-tags">
        <span class="tag warn">CS ops</span>
        <span class="tag warn">Education</span>
      </div>
    </div>
  `;
}

async function viewCohortProcurementProgress(cohortId = "", q = "") {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api(`/api/admin/cohort-procurement-progress?cohortId=${encodeURIComponent(cohortId || "")}&q=${encodeURIComponent(q || "")}`);
    nodes.cohortStatus.textContent = `Loaded cohort procurement progress: ${result.report.summary.total || 0} deliveries, ${result.report.summary.feedbackActionsDone || 0} done action(s). Education customer-success only.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortProcurementProgress(result.report));
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement progress failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCohortProcurementProgress(cohortId = "", q = "", format = "csv") {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const response = await fetch(`/api/admin/cohort-procurement-progress/export?cohortId=${encodeURIComponent(cohortId || "")}&q=${encodeURIComponent(q || "")}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Cohort procurement progress export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Cohort procurement progress export ready: ${format.toUpperCase()} / ${text.length} bytes. Education customer-success only.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort procurement progress (${format.toUpperCase()})</strong>
            <span>Institution customer-success follow-through for packet handoff, feedback, and linked actions. Not trading-performance evidence, investment advice, live signal quality, broker readiness, auto-trading, or real-money trading readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort procurement progress export failed: ${escapeHtml(error.message)}`;
  }
}

function renderCohortProcurementBuyerReview(reviewPackage) {
  if (!reviewPackage) return "";
  const summary = reviewPackage.packetSummary || {};
  const checklist = (reviewPackage.checklist || []).slice(0, 8).map((item) => `
    <li>${escapeHtml(item.label || item.category)} / ${escapeHtml(item.status)} / ${item.count || 0}: ${escapeHtml(item.buyerQuestion || "")}</li>
  `).join("");
  const learners = (reviewPackage.redactedLearnerSample || []).slice(0, 6).map((item) => `
    <li>${escapeHtml(item.email)} / legal ${item.legalAccepted ? "yes" : "no"} / risk ${item.educationRiskAcknowledged ? "yes" : "no"} / email ${item.emailVerified ? "yes" : "no"} / gaps ${(item.gaps || []).map(escapeHtml).join(", ") || "none"}</li>
  `).join("");
  const objections = (reviewPackage.objectionHistory || []).slice(0, 4).map((item) => `
    <li>${escapeHtml(item.reviewStatus)} / ${escapeHtml(item.objectionType)} / ${escapeHtml(item.reviewerEmail || "")}: ${escapeHtml(item.requestedEvidence || item.reviewNote || "")}</li>
  `).join("");
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Buyer Review Package</p>
        <h3>${escapeHtml(reviewPackage.cohortName || reviewPackage.cohortId || "Cohort")}</h3>
      </div>
      <span class="tag warn">${escapeHtml(reviewPackage.buyerReviewStatus || "awaiting_buyer_review")}</span>
    </div>
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(reviewPackage.schemaVersion || "buyer-review-package")}</strong>
        <span>Delivery ${escapeHtml(reviewPackage.deliveryId)} / recipient ${escapeHtml(reviewPackage.recipientEmail || "")} / owner ${escapeHtml(reviewPackage.institutionOwnerEmail || "")} / target ${escapeHtml(reviewPackage.targetReviewAt || "not set")}</span>
        <span>Readiness ${escapeHtml(reviewPackage.readiness || "review")} / compliance ${summary.complianceRate || 0}% / health ${summary.healthScore || 0} / blockers ${summary.blockers || 0}</span>
        <strong>Checklist</strong>
        <ol class="clean-list">${checklist || "<li>No checklist item available.</li>"}</ol>
        <strong>Redacted learner sample</strong>
        <ol class="clean-list">${learners || "<li>No learner sample available.</li>"}</ol>
        <strong>Buyer notes</strong>
        <ol class="clean-list">${objections || "<li>No buyer objection recorded yet.</li>"}</ol>
        <div class="billing-actions">
          <button type="button" data-cohort-procurement-action="${escapeHtml(reviewPackage.deliveryId)}">Create evidence task</button>
        </div>
        <span>${escapeHtml(reviewPackage.constraints?.[2] || "Buyer review is procurement evidence only, not trading or production readiness.")}</span>
      </div>
      <span class="tag warn">buyer view</span>
    </div>
  `;
}

async function viewCohortProcurementBuyerReview(deliveryId) {
  if (!nodes.cohortStatus || !nodes.cohortList || !deliveryId) return;
  try {
    const result = await api(`/api/admin/cohort-procurement-buyer-review?deliveryId=${encodeURIComponent(deliveryId)}`);
    nodes.cohortStatus.textContent = `Loaded buyer review package: ${result.package.buyerReviewStatus}. Education procurement evidence only.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortProcurementBuyerReview(result.package));
  } catch (error) {
    nodes.cohortStatus.textContent = `Buyer review package failed: ${escapeHtml(error.message)}`;
  }
}

async function recordCohortProcurementBuyerObjection(deliveryId) {
  if (!nodes.cohortStatus || !nodes.cohortList || !deliveryId) return;
  try {
    const result = await api("/api/admin/cohort-procurement-buyer-review/objection", {
      method: "POST",
      body: JSON.stringify({
        deliveryId,
        reviewStatus: "needs_more_evidence",
        objectionType: "evidence_gap",
        reviewerEmail: "buyer@institution.local",
        requestedEvidence: "Buyer requested additional education adoption, compliance, and curriculum source evidence before sign-off.",
        reviewNote: "Institution buyer needs clearer education SaaS evidence and redacted learner sample follow-through before procurement review can continue.",
        targetReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      }),
    });
    nodes.cohortStatus.textContent = `Buyer objection recorded: ${result.review.reviewStatus}. Production ready remains ${result.productionReady ? "yes" : "no"}.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortProcurementBuyerReview(result.package));
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Buyer objection failed: ${escapeHtml(error.message)}`;
  }
}

async function createCohortProcurementMeetingActions(cohortId = "", q = "") {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api("/api/admin/cohort-procurement-progress/create-meeting-actions", {
      method: "POST",
      body: JSON.stringify({
        cohortId,
        q,
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.cohortStatus.textContent = `Procurement meeting actions ${result.created} created / ${result.reused} reused. Production ready remains no.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Procurement meeting actions</strong>
            <span>${Number(result.created || 0)} created / ${Number(result.reused || 0)} reused / ${Number(result.skipped || 0)} skipped. Education customer-success only.</span>
            <ol class="clean-list">
              ${(result.actions || []).slice(0, 6).map((item) => `<li>${escapeHtml(item.title || "Meeting action")} / ${escapeHtml(item.priority || "medium")} / owner ${escapeHtml(item.ownerEmail || "unassigned")} / ${escapeHtml(item.status || "open")}</li>`).join("") || "<li>No meeting actions were needed for the current filter.</li>"}
            </ol>
            <span>${escapeHtml(result.constraints?.[1] || "Actions are not investment advice or real-money trading readiness.")}</span>
          </div>
          <span class="tag warn">CS ops</span>
        </div>
      `
    );
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Procurement meeting actions failed: ${escapeHtml(error.message)}`;
  }
}

function renderCohortEducationReport(report) {
  if (!report) return "";
  const summary = report.summary || {};
  const members = report.memberHighlights || [];
  return `
    <div class="section-head compact-head">
      <div>
        <p class="eyebrow">Cohort Education Report</p>
        <h3>${escapeHtml(report.cohort?.name || "Cohort")}</h3>
      </div>
    </div>
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(report.schemaVersion || "cohort-education-report")}</strong>
        <span>Practice ${summary.practiceCompletionRate ?? 0}% / package ${summary.packageCompletionRate ?? 0}% / risk discipline ${summary.averageRiskDiscipline ?? "--"}</span>
        <span>Coach review ${summary.needsCoachReview || 0} / low progress ${summary.lowProgress || 0} / package lag ${summary.packageLag || 0}</span>
        <span>${(summary.topMistakes || []).map((item) => `${escapeHtml(item.tag)} x${item.count}`).join(" / ") || "No class mistake profile yet"}</span>
        <ol class="clean-list">${(report.nextTeachingActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <textarea rows="7" readonly>${escapeHtml(report.exportText || "")}</textarea>
        <span>${escapeHtml(report.constraints?.[1] || "No stock recommendation, live signal, return promise, or real-money instruction.")}</span>
      </div>
      <div class="profile-tags">
        <span class="tag warn">${members.length} member(s)</span>
        <span class="tag ${summary.needsCoachReview ? "danger" : "warn"}">${summary.needsCoachReview || 0} coach</span>
      </div>
    </div>
  `;
}

async function viewCohortEducationReport(cohortId) {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api(`/api/admin/cohort-education-report?cohortId=${encodeURIComponent(cohortId)}`);
    nodes.cohortStatus.textContent = `Loaded cohort education report for ${result.report.cohort.name}`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", renderCohortEducationReport(result.report));
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort report failed: ${error.message}`;
  }
}

async function exportCohortEducationReport(cohortId, format) {
  if (!nodes.cohortStatus || !nodes.cohortList || !cohortId) return;
  try {
    const response = await fetch(`/api/admin/cohort-education-report/export?cohortId=${encodeURIComponent(cohortId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Cohort education report export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Cohort education report export ready: ${format.toUpperCase()} / ${text.length} bytes. Education service delivery only.`;
    nodes.cohortList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row ops-row">
          <div>
            <strong>Cohort education report (${format.toUpperCase()})</strong>
            <span>Teaching operations evidence only. No trading-skill certification, win-rate claim, return evidence, stock recommendation, live signal, broker connection, auto-trading, or real-money instruction.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Cohort report export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportLearningRecords(format, cohortId = "") {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const params = new URLSearchParams({
      format,
      limit: "500",
    });
    if (cohortId) params.set("cohortId", cohortId);
    const response = await fetch(`/api/admin/learning-records/export?${params.toString()}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Learning records export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Learning records export ready: ${format.toUpperCase()} / ${text.length} bytes. Education evidence only.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", `
      <div class="attempt-row ops-row">
        <div>
          <strong>Learning records export (${format.toUpperCase()})</strong>
          <span>xAPI-like local learning evidence for course progress, completion, practice, and reflection. Not a production LRS, trading-skill certification, signal report, win-rate claim, return evidence, broker readiness, auto-trading, or real-money instruction.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `);
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Learning records export failed: ${escapeHtml(error.message)}`;
  }
}

function renderRosterHandoffs(handoffs = []) {
  if (!nodes.rosterHandoffList) return;
  nodes.rosterHandoffList.innerHTML = handoffs.length
    ? handoffs.slice(0, 20).map((handoff) => `
      <div class="attempt-row ops-row">
        <div>
          <strong>${escapeHtml(handoff.cohort?.name || "Roster handoff")}</strong>
          <span>${escapeHtml(handoff.schemaVersion || "roster-import-handoff")} / learners ${handoff.summary?.learners || 0} / created ${handoff.summary?.createdAccounts || 0} / reused ${handoff.summary?.reusedAccounts || 0}</span>
          <span>Created ${formatTime(handoff.createdAt)} by ${escapeHtml(handoff.createdByEmail || "admin")}</span>
          <span>${escapeHtml(handoff.constraints?.[2] || "Learners must complete compliance acknowledgement before training.")}</span>
        </div>
        <div class="billing-actions">
          <button type="button" data-roster-onboarding-format="json" data-handoff-id="${escapeHtml(handoff.id)}">Onboarding</button>
          <button type="button" data-roster-onboarding-format="csv" data-handoff-id="${escapeHtml(handoff.id)}">Onboard CSV</button>
          <button type="button" data-roster-onboarding-format="md" data-handoff-id="${escapeHtml(handoff.id)}">Onboard Brief</button>
          <button type="button" data-roster-onboarding-followups="${escapeHtml(handoff.id)}">Create follow-ups</button>
          <button type="button" data-roster-handoff-format="json" data-handoff-id="${escapeHtml(handoff.id)}">JSON</button>
          <button type="button" data-roster-handoff-format="csv" data-handoff-id="${escapeHtml(handoff.id)}">CSV</button>
          <button type="button" data-roster-handoff-format="md" data-handoff-id="${escapeHtml(handoff.id)}">Brief</button>
          <span class="tag warn">${handoff.productionReady === false ? "Prototype" : "Review"}</span>
        </div>
      </div>
    `).join("")
    : "<p>No roster handoffs yet.</p>";
}

async function refreshRosterHandoffs() {
  if (!nodes.rosterHandoffList || !nodes.cohortStatus) return;
  try {
    const result = await api("/api/admin/roster-import-handoffs?limit=20");
    nodes.cohortStatus.textContent = `Roster handoffs ${result.summary.total}, learners ${result.summary.learners}, created accounts ${result.summary.createdAccounts}`;
    renderRosterHandoffs(result.handoffs || []);
  } catch (error) {
    nodes.cohortStatus.textContent = `Roster handoffs require admin login: ${escapeHtml(error.message)}`;
    nodes.rosterHandoffList.innerHTML = "";
  }
}

function renderRosterOnboardingProgress(report) {
  const summary = report.summary || {};
  const blockerRows = (summary.blockerCounts || []).slice(0, 6).map((item) => `${escapeHtml(item.label || item.key)} ${item.count || 0} / attention ${item.needsAttention || 0}`);
  const learners = (report.learners || []).filter((item) => item.status === "needs_followup").slice(0, 8);
  return `
    <div class="attempt-row ops-row">
      <div>
        <strong>${escapeHtml(report.schemaVersion || "roster-onboarding-progress")}</strong>
        <span>Handoffs ${summary.handoffs || 0} / cohorts ${summary.cohorts || 0} / learners ${summary.learners || 0} / needs attention ${summary.needsAttention || 0} / on track ${summary.onTrack || 0}</span>
        <span>Logged in ${summary.loggedIn || 0} / email verified ${summary.emailVerified || 0} / education-risk acknowledged ${summary.complianceAcknowledged || 0} / started training ${summary.startedTraining || 0}</span>
        <span>${blockerRows.join(" | ") || "No blocker category yet"}</span>
        <ol class="clean-list">
          ${learners.map((item) => `<li>${escapeHtml(item.email)} / ${escapeHtml(item.cohortName || "cohort")} / ${escapeHtml(item.blockerCategory)} / owner ${escapeHtml(item.ownerEmail)} / target ${escapeHtml(item.targetReviewAt)} / ${escapeHtml(item.nextOpsAction || "")}</li>`).join("") || "<li>No roster onboarding exception needs meeting review in the current filter.</li>"}
        </ol>
        <span>${escapeHtml(report.constraints?.[1] || "Roster onboarding progress is education customer-success only.")}</span>
      </div>
      <span class="tag warn">CS ops</span>
    </div>
  `;
}

async function viewRosterOnboardingProgress(cohortId = "", q = "") {
  if (!nodes.cohortStatus || !nodes.rosterHandoffList) return;
  try {
    const result = await api(`/api/admin/roster-onboarding-progress?cohortId=${encodeURIComponent(cohortId || "")}&q=${encodeURIComponent(q || "")}`);
    nodes.cohortStatus.textContent = `Loaded roster onboarding progress: ${result.report.summary.learners || 0} learners, ${result.report.summary.needsAttention || 0} need attention. Education customer-success only.`;
    nodes.rosterHandoffList.insertAdjacentHTML("afterbegin", renderRosterOnboardingProgress(result.report));
  } catch (error) {
    nodes.cohortStatus.textContent = `Roster onboarding progress failed: ${escapeHtml(error.message)}`;
  }
}

async function exportRosterOnboardingProgress(cohortId = "", q = "", format = "md") {
  if (!nodes.cohortStatus || !nodes.rosterHandoffList) return;
  try {
    const response = await fetch(`/api/admin/roster-onboarding-progress/export?cohortId=${encodeURIComponent(cohortId || "")}&q=${encodeURIComponent(q || "")}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Roster onboarding progress export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Roster onboarding progress export ready: ${format.toUpperCase()} / ${text.length} bytes. Education customer-success only.`;
    nodes.rosterHandoffList.insertAdjacentHTML("afterbegin", `
      <div class="attempt-row ops-row">
        <div>
          <strong>Roster onboarding progress (${format.toUpperCase()})</strong>
          <span>Institution customer-success meeting evidence only. Not investment advice, live signal, win-rate evidence, broker readiness, auto-trading, or real-money trading readiness.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `);
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Roster onboarding progress export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportRosterHandoff(handoffId, format) {
  if (!nodes.cohortStatus || !nodes.rosterHandoffList) return;
  try {
    const response = await fetch(`/api/admin/roster-import-handoffs/export?handoffId=${encodeURIComponent(handoffId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Roster handoff export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Roster handoff export ready: ${format.toUpperCase()} / ${text.length} bytes. Education onboarding only.`;
    nodes.rosterHandoffList.insertAdjacentHTML("afterbegin", `
      <div class="attempt-row ops-row">
        <div>
          <strong>Roster handoff export (${format.toUpperCase()})</strong>
          <span>Education cohort onboarding handoff only. Not production identity delivery, investment advice, live signal, broker readiness, auto-trading, or real-money trading readiness.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `);
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Roster handoff export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportRosterOnboardingReport(handoffId, format) {
  if (!nodes.cohortStatus || !nodes.rosterHandoffList) return;
  try {
    const response = await fetch(`/api/admin/roster-onboarding-report/export?handoffId=${encodeURIComponent(handoffId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Roster onboarding report export failed");
    }
    const text = await response.text();
    nodes.cohortStatus.textContent = `Roster onboarding report ready: ${format.toUpperCase()} / ${text.length} bytes. Education activation only.`;
    nodes.rosterHandoffList.insertAdjacentHTML("afterbegin", `
      <div class="attempt-row ops-row">
        <div>
          <strong>Roster onboarding report (${format.toUpperCase()})</strong>
          <span>Customer-success activation follow-up for login, email verification, compliance acknowledgement, training start, enrollments, and completions. Not trading-performance evidence, investment advice, live signals, win-rate proof, broker readiness, auto-trading, or real-money instruction.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `);
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Roster onboarding report failed: ${escapeHtml(error.message)}`;
  }
}

async function createRosterOnboardingFollowups(handoffId) {
  if (!nodes.cohortStatus || !nodes.rosterHandoffList) return;
  try {
    const result = await api("/api/admin/roster-onboarding-followups", {
      method: "POST",
      body: JSON.stringify({ handoffId }),
    });
    const summary = result.summary || {};
    nodes.cohortStatus.textContent = `Roster onboarding follow-ups: created ${summary.created || 0}, reused ${summary.reused || 0}, skipped ${summary.skipped || 0}. Education activation only.`;
    nodes.rosterHandoffList.insertAdjacentHTML("afterbegin", `
      <div class="attempt-row ops-row">
        <div>
          <strong>Roster onboarding follow-ups</strong>
          <span>Created ${summary.created || 0}, reused ${summary.reused || 0}, skipped ${summary.skipped || 0} from ${summary.needsAttention || 0} learner(s) needing attention.</span>
          <span>Tasks are education customer-success activation work, not investment advice, live signals, win-rate evidence, broker readiness, auto-trading, or real-money instruction.</span>
        </div>
        <span class="tag warn">Prototype</span>
      </div>
    `);
    await refreshActivationInterventions();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Roster onboarding follow-ups failed: ${escapeHtml(error.message)}`;
  }
}

async function createCohort() {
  if (!nodes.cohortStatus) return;
  try {
    const result = await api("/api/admin/cohorts", {
      method: "POST",
      body: JSON.stringify({
        name: nodes.cohortName.value.trim(),
        members: nodes.cohortMembers.value,
      }),
    });
    nodes.cohortStatus.textContent = `Created cohort ${result.cohort.name} with ${result.cohort.memberCount} members`;
    await refreshCohorts();
    await refreshRosterHandoffs();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Create cohort failed: ${error.message}`;
  }
}

async function importRoster() {
  if (!nodes.cohortStatus || !nodes.cohortList) return;
  try {
    const result = await api("/api/admin/roster-imports", {
      method: "POST",
      body: JSON.stringify({
        cohortName: nodes.cohortName?.value.trim() || "Imported learner cohort",
        rows: nodes.rosterImportRows?.value || "",
        defaultPlan: "Starter",
      }),
    });
    nodes.cohortStatus.textContent = `Imported roster into ${result.cohort.name}: ${result.summary.createdAccounts} created, ${result.summary.reusedAccounts} reused, ${result.summary.skipped} skipped.`;
    nodes.cohortList.insertAdjacentHTML("afterbegin", `
      <div class="attempt-row ops-row">
        <div>
          <strong>Roster import handoff</strong>
          <span>Imported ${result.summary.imported} learner(s). Created ${result.summary.createdAccounts}, reused ${result.summary.reusedAccounts}, skipped ${result.summary.skipped}.</span>
          <span>Temporary passwords and verification tokens are local prototype handoff artifacts; production requires real email delivery and school identity controls.</span>
          <span>${escapeHtml(result.constraints?.[3] || "No stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money instruction.")}</span>
        </div>
        <span class="tag warn">${result.educationOnly ? "Education only" : "Review"}</span>
      </div>
    `);
    await refreshCohorts();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Roster import failed: ${escapeHtml(error.message)}`;
  }
}

async function assignCohortPractice(cohortId) {
  if (!nodes.cohortStatus) return;
  const scenario = state.data.scenarios?.[0];
  if (!scenario) {
    nodes.cohortStatus.textContent = "No approved learner scenario is available for cohort assignment.";
    return;
  }
  try {
    const result = await api("/api/admin/cohorts/assign", {
      method: "POST",
      body: JSON.stringify({
        cohortId,
        scenarioId: scenario.id,
        focus: scenario.tag || "cohort practice",
        instructions: "Complete this cohort education-only chart drill and write structure, invalidation, and risk limit.",
      }),
    });
    nodes.cohortStatus.textContent = `Assigned ${result.assignments.length} learners in ${result.cohort.name}`;
    await refreshCohorts();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Assign cohort failed: ${error.message}`;
  }
}

async function assignCohortCoursePackage(cohortId) {
  if (!nodes.cohortStatus) return;
  const coursePackage = firstPublishedAdminPackage();
  if (!coursePackage) {
    nodes.cohortStatus.textContent = "No published course package is available for cohort assignment.";
    return;
  }
  try {
    const result = await api("/api/admin/course-package-assignments", {
      method: "POST",
      body: JSON.stringify({
        cohortId,
        coursePackageId: coursePackage.id,
        instructions: "Cohort package delivery: review concepts, complete all education-only chart drills, then discuss the completion report.",
      }),
    });
    nodes.cohortStatus.textContent = `Assigned package ${result.coursePackage.title} to ${result.enrollments.length} cohort learner(s)`;
    await refreshCohorts();
    await refreshCoursePackages();
    await refreshAuditLog();
  } catch (error) {
    nodes.cohortStatus.textContent = `Assign cohort package failed: ${error.message}`;
  }
}

async function updateCoachReviewTask(taskId, status) {
  if (!nodes.coachConsoleStatus) return;
  const note = document.querySelector(`[data-coach-task-note="${taskId}"]`)?.value.trim()
    || "Education review completed. Keep practicing process, invalidation, and risk discipline before increasing difficulty.";
  try {
    const result = await api("/api/admin/coach-review-tasks/update", {
      method: "POST",
      body: JSON.stringify({
        taskId,
        status,
        coachNote: note,
      }),
    });
    nodes.coachConsoleStatus.textContent = `Review task ${result.task.id}: ${result.task.status}`;
    await refreshCoachTasks();
    await refreshCoachConsole();
    await refreshAuditLog();
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Update review task failed: ${error.message}`;
  }
}

function auditQuery(format) {
  const params = new URLSearchParams({ limit: "30" });
  const type = nodes.auditTypeFilter?.value;
  const user = nodes.auditUserFilter?.value.trim();
  const moderationStatus = nodes.auditStatusFilter?.value;
  const from = nodes.auditFromFilter?.value;
  const to = nodes.auditToFilter?.value;
  if (type) params.set("type", type);
  if (user) params.set("user", user);
  if (moderationStatus) params.set("moderationStatus", moderationStatus);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (format) params.set("format", format);
  return params;
}

async function refreshReviewQueue() {
  if (!nodes.reviewQueue) return;
  try {
    const result = await api("/api/admin/review-queue");
    nodes.aiCoachStatus.textContent = `Provider: ${result.aiCoach.provider} / Mode: ${result.aiCoach.mode} / Prompt: ${result.aiCoach.promptVersion}`;
    nodes.reviewQueue.innerHTML = result.items.length
      ? result.items.map((item) => `
        <div class="attempt-row">
          <div>
            <strong>${item.type}</strong>
            <span>${formatTime(item.createdAt)} / ${item.email || item.provider || "system"} / ${item.promptVersion || item.reason || "n/a"}</span>
          </div>
          ${item.type === "account_deletion_requested" ? `
            <div class="billing-actions">
              <button type="button" data-delete-action="processing" data-request-id="${item.id}">Processing</button>
              <button type="button" data-delete-action="anonymized" data-request-id="${item.id}">Anonymized</button>
              <button type="button" data-delete-action="rejected" data-request-id="${item.id}">Reject</button>
            </div>
          ` : '<span class="tag danger">Review</span>'}
        </div>
      `).join("")
      : "<p>No review items.</p>";
  } catch (error) {
    nodes.aiCoachStatus.textContent = `Review queue requires admin login: ${error.message}`;
    nodes.reviewQueue.innerHTML = "";
  }
}

async function refreshEducationModelRuns(reviewStatus = "") {
  if (!nodes.educationModelRunList) return;
  try {
    const params = new URLSearchParams({ limit: "30" });
    if (reviewStatus) params.set("reviewStatus", reviewStatus);
    const result = await api(`/api/admin/education-model-runs?${params.toString()}`);
    nodes.educationModelRunStatus.textContent = `Runs ${result.summary.total}, shown ${result.summary.filtered}, approved ${result.summary.approved}, needs review ${result.summary.needsReview}, changes ${result.summary.changesRequested || 0}.`;
    nodes.educationModelRunList.innerHTML = result.runs.length
      ? result.runs.map((run) => {
        const focus = run.tutoringPlan?.focusAreas?.length
          ? run.tutoringPlan.focusAreas.slice(0, 4).map((item) => `<span class="tag warn">${escapeHtml(item)}</span>`).join("")
          : '<span class="tag">general education review</span>';
        const blockers = run.contextSummary?.activity?.courseEvidenceBlockers ?? 0;
        return `
          <div class="attempt-row ops-row">
            <div>
              <strong>${escapeHtml(run.learnerName || run.email || run.userId)} <span class="muted-inline">${escapeHtml(run.id)}</span></strong>
              <span>${formatTime(run.createdAt)} / ${escapeHtml(run.type)} / ${escapeHtml(run.provider?.provider || "provider")} / moderation ${escapeHtml(run.moderationStatus || "review")} / review ${escapeHtml(run.reviewStatus || "needs_review")}</span>
              <span>Context ${escapeHtml(run.contextSchemaVersion || "context")} / plan ${escapeHtml(run.planSchemaVersion || "plan")} / blockers ${blockers}</span>
              <span>${escapeHtml(run.reviewNote || "Awaiting education QA review.")}</span>
              <span>${escapeHtml(run.constraints?.[1] || "No stock recommendation, live signal, return promise, or real-money instruction.")}</span>
            </div>
            <div class="profile-tags">
              ${focus}
              <button type="button" data-education-model-review="approve" data-run-id="${escapeHtml(run.id)}">Approve</button>
              <button type="button" data-education-model-review="request_changes" data-run-id="${escapeHtml(run.id)}">Request changes</button>
              <button type="button" data-education-model-review="reject" data-run-id="${escapeHtml(run.id)}">Reject</button>
            </div>
          </div>
        `;
      }).join("")
      : "<p>No education model runs archived yet.</p>";
  } catch (error) {
    nodes.educationModelRunStatus.textContent = `Education model runs require admin login: ${escapeHtml(error.message)}`;
    nodes.educationModelRunList.innerHTML = "";
  }
}

async function openEducationModelReviewQueue() {
  await refreshEducationModelRuns("needs_review");
  if (nodes.educationModelRunStatus) {
    nodes.educationModelRunStatus.textContent = `${nodes.educationModelRunStatus.textContent} Showing needs_review queue from service health.`;
  }
}

async function reviewEducationModelRun(runId, action) {
  if (!nodes.educationModelRunStatus) return;
  try {
    const result = await api("/api/admin/education-model-runs/review", {
      method: "POST",
      body: JSON.stringify({
        runId,
        action,
        note: action === "approve"
          ? "Approved for education-only tutoring workflow review."
          : action === "request_changes"
            ? "Request changes before using this tutoring plan in learner support."
            : "Rejected for education-only tutoring workflow review.",
      }),
    });
    nodes.educationModelRunStatus.textContent = `Education model run ${result.run.id}: ${result.run.reviewStatus}`;
    await refreshEducationModelRuns();
    await refreshAuditLog();
  } catch (error) {
    nodes.educationModelRunStatus.textContent = `Education model run review failed: ${escapeHtml(error.message)}`;
  }
}

async function createPilotSuccessActions() {
  if (!nodes.productReadinessStatus) return;
  if (nodes.createPilotSuccessActions) nodes.createPilotSuccessActions.disabled = true;
  try {
    const result = await api("/api/admin/pilot-success-actions/bulk", {
      method: "POST",
      body: JSON.stringify({ maxCreate: 5, ownerEmail: "success@tradegym.local" }),
    });
    nodes.productReadinessStatus.textContent = `Pilot success actions: ${result.created?.length || 0} created, ${result.summary?.open || 0} open. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot success action creation failed: ${escapeHtml(error.message)}`;
  } finally {
    if (nodes.createPilotSuccessActions) nodes.createPilotSuccessActions.disabled = false;
  }
}

async function createLaunchOpsActions() {
  if (!nodes.productReadinessStatus) return;
  if (nodes.createLaunchOpsActions) nodes.createLaunchOpsActions.disabled = true;
  try {
    const result = await api("/api/admin/launch-ops-board/create-actions", {
      method: "POST",
      body: JSON.stringify({ maxCreate: 8, ownerEmail: "success@tradegym.local" }),
    });
    nodes.productReadinessStatus.textContent = `Launch ops actions: ${result.created || 0} created, ${result.reused || 0} reused, ${result.skipped || 0} skipped. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Launch ops action creation failed: ${escapeHtml(error.message)}`;
  } finally {
    if (nodes.createLaunchOpsActions) nodes.createLaunchOpsActions.disabled = false;
  }
}

async function updatePilotSuccessAction(actionId, status) {
  if (!actionId || !status || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-success-actions/update", {
      method: "POST",
      body: JSON.stringify({
        actionId,
        status,
        ownerEmail: "success@tradegym.local",
        resolutionNote: status === "done"
          ? "Customer-success follow-up completed for this education-only pilot criterion."
          : "Customer-success follow-up updated for this education-only pilot criterion.",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot success action ${result.action.title}: ${result.action.status}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot success action update failed: ${escapeHtml(error.message)}`;
  }
}

async function exportEducationModelRuns(format) {
  if (!nodes.educationModelRunList) return;
  try {
    const response = await fetch(`/api/admin/education-model-runs/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Education model run export failed");
    }
    const text = await response.text();
    nodes.educationModelRunStatus.textContent = `Education model run export ready: ${format.toUpperCase()} / ${text.length} bytes.`;
    nodes.educationModelRunList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Education model run export (${format.toUpperCase()})</strong>
            <span>Preview only. Export contains tutoring QA artifacts and review metadata, not trading advice.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2400))}</pre>
      `
    );
  } catch (error) {
    nodes.educationModelRunStatus.textContent = `Education model run export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportLearningEvidencePackets(format) {
  if (!nodes.coachConsoleStatus || !nodes.coachProgressReportPanel) return;
  try {
    const params = coachConsoleQuery();
    params.set("format", format);
    const response = await fetch(`/api/admin/learning-evidence-packets/export?${params.toString()}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Learning evidence packet export failed");
    }
    const text = await response.text();
    nodes.coachConsoleStatus.textContent = `Learning evidence packet export ready: ${format.toUpperCase()} / ${text.length} bytes.`;
    nodes.coachProgressReportPanel.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>Learning evidence packet export (${format.toUpperCase()})</strong>
          <span>Education service delivery preview only. No stock recommendation, live signal, return promise, or real-money instruction.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `;
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Evidence packet export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportLearningEvidenceLoop(format) {
  if (!nodes.coachConsoleStatus || !nodes.coachProgressReportPanel) return;
  try {
    const params = coachConsoleQuery();
    params.set("format", format);
    const response = await fetch(`/api/admin/learning-evidence-loop/export?${params.toString()}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Learning evidence loop export failed");
    }
    const text = await response.text();
    nodes.coachConsoleStatus.textContent = `Learning evidence loop export ready: ${format.toUpperCase()} / ${text.length} bytes.`;
    nodes.coachProgressReportPanel.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>Learning evidence loop export (${format.toUpperCase()})</strong>
          <span>Education service operations preview only. No stock recommendation, live signal, return promise, or real-money instruction.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `;
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Evidence loop export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportEducationServiceHealth(format) {
  if (!nodes.coachConsoleStatus || !nodes.coachProgressReportPanel) return;
  try {
    const response = await fetch(`/api/admin/education-service-health/export?format=${encodeURIComponent(format)}&days=14`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Education service health export failed");
    }
    const text = await response.text();
    nodes.coachConsoleStatus.textContent = `Education service health export ready: ${format.toUpperCase()} / ${text.length} bytes.`;
    nodes.coachProgressReportPanel.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>Education service health export (${format.toUpperCase()})</strong>
          <span>Learning operations evidence only. No stock recommendation, live signal, return promise, broker connection, or real-money instruction.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `;
  } catch (error) {
    nodes.coachConsoleStatus.textContent = `Education service health export failed: ${escapeHtml(error.message)}`;
  }
}

async function refreshAuditLog() {
  if (!nodes.auditLog) return;
  try {
    const result = await api(`/api/admin/audit-logs?${auditQuery().toString()}`);
    nodes.auditLog.innerHTML = result.items.length
      ? result.items.map((item) => `
        <details class="attempt-row audit-detail">
          <summary>
            <div>
              <strong>${item.type}</strong>
              <span>${formatTime(item.createdAt)} / ${item.email || item.userId || item.createdBy || item.handledBy || item.provider || "system"} / ${item.moderationStatus || item.action || "logged"}</span>
            </div>
            <span class="tag warn">${item.action || item.resolution || item.billingEventType || item.plan || "audit"}</span>
          </summary>
          <pre>${JSON.stringify(item, null, 2)}</pre>
        </details>
      `).join("")
      : "<p>No audit records.</p>";
  } catch (error) {
    nodes.auditLog.innerHTML = `<p>Audit log requires admin login: ${error.message}</p>`;
  }
}

function renderAuditIntegrity(integrity) {
  if (!nodes.auditIntegrityStatus) return;
  const verification = integrity.verification || {};
  nodes.auditIntegrityStatus.textContent = `Audit integrity: ${verification.status || "unknown"} / seals ${integrity.sealCount || 0} / logs ${integrity.current?.totalLogs || 0} / root ${integrity.current?.rootHash || "n/a"}. Local tamper-evidence only; not immutable production ledger.`;
}

async function refreshAuditIntegrity() {
  if (!nodes.auditIntegrityStatus) return;
  try {
    const result = await api("/api/admin/audit-integrity");
    renderAuditIntegrity(result);
  } catch (error) {
    nodes.auditIntegrityStatus.textContent = `Audit integrity requires admin login: ${error.message}`;
  }
}

async function sealAuditIntegrity() {
  if (!nodes.auditIntegrityStatus) return;
  try {
    const result = await api("/api/admin/audit-integrity/seal", {
      method: "POST",
      body: JSON.stringify({}),
    });
    renderAuditIntegrity(result.integrity);
    await refreshAuditLog();
  } catch (error) {
    nodes.auditIntegrityStatus.textContent = `Audit seal failed: ${error.message}`;
  }
}

async function exportReadinessEvidencePacket(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/readiness-evidence-packet/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Readiness evidence packet export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Readiness evidence packet export ready: ${format.toUpperCase()} / ${text.length} bytes. Production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Readiness evidence packet (${format.toUpperCase()})</strong>
            <span>Product operations evidence only. No production launch certification, trading advice, live signal, return promise, broker connection, or auto-trading.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Readiness evidence export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportPilotHandoffReport(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/pilot-handoff-report/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Pilot handoff report export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Pilot handoff report export ready: ${format.toUpperCase()} / ${text.length} bytes. Education-only pilot evidence; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Pilot handoff report (${format.toUpperCase()})</strong>
            <span>Customer success and education operations evidence only. No stock recommendation, live signal, return promise, broker connection, auto-trading, or production launch certification.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot handoff export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportPilotRenewalReview(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/pilot-renewal-review/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Pilot renewal review export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Pilot renewal review export ready: ${format.toUpperCase()} / ${text.length} bytes. Education renewal evidence only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Pilot renewal review (${format.toUpperCase()})</strong>
            <span>Renewal and expansion review evidence only. No win-rate claim, return evidence, stock recommendation, live signal, broker connection, auto-trading, or production launch certification.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot renewal review export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportPilotExpansionLaunchChecklist(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/pilot-expansion-launch-checklist/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Pilot expansion launch checklist export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Pilot expansion launch export ready: ${format.toUpperCase()} / ${text.length} bytes. Education launch coordination only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Pilot expansion launch (${format.toUpperCase()})</strong>
            <span>Customer-success launch coordination only. No win-rate claim, return evidence, stock recommendation, live signal, broker connection, auto-trading, or production launch certification.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot expansion launch export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportLaunchOpsBoard(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/launch-ops-board/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Launch ops board export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Launch ops board export ready: ${format.toUpperCase()} / ${text.length} bytes. Education operations only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Launch ops board (${format.toUpperCase()})</strong>
            <span>Education SaaS operating review only. No production launch certification, trading skill certification, live signal quality, broker readiness, auto-trading, or real-money readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Launch ops board export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCommercialPrototypeScorecard(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/commercial-prototype-scorecard/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Commercial prototype scorecard export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Commercial prototype scorecard export ready: ${format.toUpperCase()} / ${text.length} bytes. Customer trial operations only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Commercial prototype scorecard (${format.toUpperCase()})</strong>
            <span>Education SaaS customer trial operating scorecard only. No investment advice, stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Commercial prototype scorecard export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCustomerTrialKickoffPlan(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/customer-trial-kickoff-plan/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Customer trial kickoff plan export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Customer trial kickoff plan export ready: ${format.toUpperCase()} / ${text.length} bytes. Education trial operations only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Customer trial kickoff plan (${format.toUpperCase()})</strong>
            <span>Bounded education SaaS trial plan only. No investment advice, stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial kickoff plan export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCustomerTrialRoom(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/customer-trial-room/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Customer trial room export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Customer trial room export ready: ${format.toUpperCase()} / ${text.length} bytes. Education trial evidence hub only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Customer trial room (${format.toUpperCase()})</strong>
            <span>Customer-facing education SaaS trial evidence hub only. No investment advice, stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial room export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCustomerTrialRoomShareProgress(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/customer-trial-room-shares/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Customer trial room share progress export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Customer trial room share progress export ready: ${format.toUpperCase()} / ${text.length} bytes. Education customer-success follow-through only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Customer trial room share progress (${format.toUpperCase()})</strong>
            <span>Buyer review, evidence request, and action closure evidence only. No investment advice, stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial room share progress export failed: ${escapeHtml(error.message)}`;
  }
}

async function sendCustomerTrialRoom() {
  if (!nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/customer-trial-room-shares", {
      method: "POST",
      body: JSON.stringify({
        recipientEmail: "buyer@institution.local",
        ownerEmail: "success@tradegym.local",
        subject: "TradeGym education trial room",
      }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial room share recorded: ${escapeHtml(result.share?.recipientEmail || "recipient")} / ${escapeHtml(result.share?.providerMode || "local-simulated")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial room share failed: ${escapeHtml(error.message)}`;
  }
}

async function recordCustomerTrialRoomFeedback(shareId, feedbackStatus) {
  if (!shareId || !feedbackStatus || !nodes.productReadinessStatus) return;
  const noteByStatus = {
    objections: "Buyer raised education trial room objections and wants clearer boundaries before review.",
    needs_more_evidence: "Buyer requested more education trial evidence before accepting the room for review.",
    room_accepted_for_review: "Buyer accepted the education trial room for internal review with local/demo/mock provider labels visible.",
    no_fit: "Buyer is not a fit for the current education trial room scope.",
  };
  try {
    const result = await api("/api/admin/customer-trial-room-shares/feedback", {
      method: "POST",
      body: JSON.stringify({
        shareId,
        feedbackStatus,
        feedbackNote: noteByStatus[feedbackStatus] || "Customer trial room feedback recorded for education customer-success follow-up.",
        nextCustomerSuccessAction: "Prepare the next education customer-success follow-up without trading-performance or production-readiness claims.",
      }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial room feedback recorded: ${escapeHtml(result.share?.feedbackStatus || feedbackStatus)}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial room feedback failed: ${escapeHtml(error.message)}`;
  }
}

async function viewCustomerTrialRoomBuyerReview(shareId) {
  if (!shareId || !nodes.productReadinessStatus) return;
  try {
    const result = await api(`/api/admin/customer-trial-room-buyer-review?shareId=${encodeURIComponent(shareId)}`);
    const reviewPackage = result.package || {};
    nodes.productReadinessStatus.textContent = `Loaded customer trial room buyer review: ${escapeHtml(reviewPackage.buyerReviewStatus || "awaiting_buyer_review")}. Education evidence only.`;
    nodes.productReadinessOutput.innerHTML = `
      <div class="mini-card">
        <strong>Customer trial room buyer review</strong>
        <span>${escapeHtml(reviewPackage.recipientEmail || "buyer")} / ${escapeHtml(reviewPackage.feedbackStatus || "pending_feedback")} / ${escapeHtml(reviewPackage.roomDecision || "review")}</span>
        <span>Checklist ${reviewPackage.checklist?.length || 0} item(s), objection history ${reviewPackage.objectionHistory?.length || 0}.</span>
      </div>
    `;
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial room buyer review failed: ${escapeHtml(error.message)}`;
  }
}

async function recordCustomerTrialRoomBuyerObjection(shareId) {
  if (!shareId || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/customer-trial-room-buyer-review/objection", {
      method: "POST",
      body: JSON.stringify({
        shareId,
        reviewStatus: "needs_more_evidence",
        reviewerEmail: "buyer@institution.local",
        objectionType: "trial_room_evidence_gap",
        reviewNote: "Buyer needs clearer education SaaS evidence and boundary wording before accepting the trial room for review.",
        requestedEvidence: "Prepare a concise education trial evidence note covering learner workflow, coach follow-up, audit evidence, and explicit non-trading boundaries.",
        targetReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial room buyer review recorded: ${escapeHtml(result.package?.buyerReviewStatus || result.review?.reviewStatus || "needs_more_evidence")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial room buyer review failed: ${escapeHtml(error.message)}`;
  }
}

async function createCustomerTrialRoomFeedbackAction(shareId) {
  if (!shareId || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/customer-trial-room-shares/create-action", {
      method: "POST",
      body: JSON.stringify({ shareId, ownerEmail: "success@tradegym.local" }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial room feedback action ${result.reused ? "reused" : "created"}: ${escapeHtml(result.action?.title || "customer-success follow-up")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial room feedback action failed: ${escapeHtml(error.message)}`;
  }
}

async function createCustomerTrialKickoffActions() {
  if (!nodes.productReadinessStatus) return;
  if (nodes.createTrialKickoffActions) nodes.createTrialKickoffActions.disabled = true;
  try {
    const result = await api("/api/admin/customer-trial-kickoff-plan/create-actions", {
      method: "POST",
      body: JSON.stringify({ ownerEmail: "success@tradegym.local", maxCreate: 8 }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial kickoff actions: ${result.created || 0} created, ${result.reused || 0} reused, ${result.skipped || 0} skipped. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial kickoff action creation failed: ${escapeHtml(error.message)}`;
  } finally {
    if (nodes.createTrialKickoffActions) nodes.createTrialKickoffActions.disabled = false;
  }
}

async function exportCustomerTrialPacket(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/customer-trial-packet/export?format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Customer trial packet export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Customer trial packet export ready: ${format.toUpperCase()} / ${text.length} bytes. Education trial evidence only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Customer trial packet (${format.toUpperCase()})</strong>
            <span>Education SaaS trial handoff only. No investment advice, stock recommendation, live signal, return promise, broker connection, auto-trading, or real-money readiness.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial packet export failed: ${escapeHtml(error.message)}`;
  }
}

async function sendCustomerTrialPacket() {
  if (!nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/customer-trial-packet-deliveries", {
      method: "POST",
      body: JSON.stringify({
        recipientEmail: "buyer@institution.local",
        ownerEmail: "success@tradegym.local",
        subject: "TradeGym education trial packet",
      }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial packet delivery recorded: ${escapeHtml(result.delivery?.recipientEmail || "recipient")} / ${escapeHtml(result.delivery?.providerMode || "local-simulated")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial packet delivery failed: ${escapeHtml(error.message)}`;
  }
}

async function recordCustomerTrialFeedback(deliveryId, feedbackStatus) {
  if (!deliveryId || !feedbackStatus || !nodes.productReadinessStatus) return;
  const noteByStatus = {
    objections: "Customer raised education trial objections and wants clearer implementation boundaries before proceeding.",
    needs_more_evidence: "Customer requested more education delivery, onboarding, support, and audit evidence before a bounded trial.",
    trial_ready: "Customer is ready to plan a bounded education trial after reviewing local/demo/mock provider labels and prohibited-use boundaries.",
    no_fit: "Customer is not a fit for the current education trial scope.",
  };
  try {
    const result = await api("/api/admin/customer-trial-packet-deliveries/feedback", {
      method: "POST",
      body: JSON.stringify({
        deliveryId,
        feedbackStatus,
        feedbackNote: noteByStatus[feedbackStatus] || "Customer trial feedback recorded for education customer-success follow-up.",
        nextCustomerSuccessAction: "Prepare the next education customer-success follow-up without trading-performance or production-readiness claims.",
      }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial feedback recorded: ${escapeHtml(result.delivery?.feedbackStatus || feedbackStatus)}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial feedback failed: ${escapeHtml(error.message)}`;
  }
}

async function createCustomerTrialFeedbackAction(deliveryId) {
  if (!deliveryId || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/customer-trial-packet-deliveries/create-action", {
      method: "POST",
      body: JSON.stringify({ deliveryId, ownerEmail: "success@tradegym.local" }),
    });
    nodes.productReadinessStatus.textContent = `Customer trial feedback action ${result.reused ? "reused" : "created"}: ${escapeHtml(result.action?.title || "customer-success follow-up")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Customer trial feedback action failed: ${escapeHtml(error.message)}`;
  }
}

async function exportNextStepEngagementReport(format) {
  if (!nodes.productReadinessStatus || !nodes.readinessRemediationList) return;
  try {
    const response = await fetch(`/api/admin/next-step-engagement-report/export?format=${encodeURIComponent(format)}&limit=80`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Next-step engagement export failed");
    }
    const text = await response.text();
    nodes.productReadinessStatus.textContent = `Next-step engagement export ready: ${format.toUpperCase()} / ${text.length} bytes. Education workflow evidence only; production ready remains no.`;
    nodes.readinessRemediationList.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="attempt-row">
          <div>
            <strong>Next-step engagement (${format.toUpperCase()})</strong>
            <span>Learner workflow follow-through only. No trading-skill score, win-rate claim, return evidence, stock recommendation, live signal, broker connection, auto-trading, or production launch certification.</span>
          </div>
          <span class="tag warn">${text.length} bytes</span>
        </div>
        <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
      `
    );
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Next-step engagement export failed: ${escapeHtml(error.message)}`;
  }
}

async function exportCompletionCertificate(reportId, format, target = "learner") {
  if (!reportId) return;
  const statusNode = target === "coach" ? nodes.coachConsoleStatus : nodes.progressReportPanel;
  const targetNode = target === "coach" ? nodes.coachProgressReportPanel : nodes.progressReportPanel;
  try {
    const response = await fetch(`/api/completion-certificate/export?reportId=${encodeURIComponent(reportId)}&format=${encodeURIComponent(format)}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Completion certificate export failed");
    }
    const text = await response.text();
    if (target === "coach" && statusNode) {
      statusNode.textContent = `Completion certificate export ready: ${format.toUpperCase()} / ${text.length} bytes. Education proof only.`;
    }
    const preview = `
      <div class="attempt-row completion-report-card">
        <div>
          <strong>Education completion certificate (${format.toUpperCase()})</strong>
          <span>Completion proof for an education workflow only. No trading-skill certification, win-rate claim, return evidence, stock recommendation, live signal, broker connection, auto-trading, or real-money instruction.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${escapeHtml(text.slice(0, 2600))}</pre>
    `;
    if (targetNode) {
      targetNode.insertAdjacentHTML("afterbegin", preview);
    }
    await refreshAuditLog();
  } catch (error) {
    if (target === "coach" && nodes.coachConsoleStatus) {
      nodes.coachConsoleStatus.textContent = `Completion certificate export failed: ${escapeHtml(error.message)}`;
    } else if (nodes.progressReportPanel) {
      nodes.progressReportPanel.insertAdjacentHTML("afterbegin", `<p>Completion certificate export failed: ${escapeHtml(error.message)}</p>`);
    }
  }
}

async function createPilotRenewalBrief() {
  if (!nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-renewal-briefs", {
      method: "POST",
      body: JSON.stringify({
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot renewal brief saved: ${escapeHtml(result.brief?.title || "draft")} / ${escapeHtml(result.brief?.recommendation || "review")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot renewal brief save failed: ${escapeHtml(error.message)}`;
  }
}

async function updatePilotRenewalBrief(briefId, status) {
  if (!briefId || !status || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-renewal-briefs/update", {
      method: "POST",
      body: JSON.stringify({
        briefId,
        status,
        ownerEmail: "success@tradegym.local",
        reviewNote: status === "reviewed"
          ? "Reviewed as an education-only customer-success renewal brief. No trading performance, win-rate, return, signal, broker, or real-money readiness claim was made."
          : "Updated as an education-only customer-success renewal brief.",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot renewal brief ${escapeHtml(result.brief?.title || "brief")}: ${escapeHtml(result.brief?.status || status)}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot renewal brief update failed: ${escapeHtml(error.message)}`;
  }
}

async function deliverPilotRenewalBrief(briefId) {
  if (!briefId || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-renewal-brief-deliveries", {
      method: "POST",
      body: JSON.stringify({
        briefId,
        recipientEmail: "success@tradegym.local",
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot renewal brief delivery recorded: ${escapeHtml(result.delivery?.recipientEmail || "recipient")} / ${escapeHtml(result.delivery?.providerMode || "local-simulated")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot renewal brief delivery failed: ${escapeHtml(error.message)}`;
  }
}

async function recordPilotRenewalFeedback(deliveryId, feedbackStatus) {
  if (!deliveryId || !feedbackStatus || !nodes.productReadinessStatus) return;
  const nextByStatus = {
    objections: "Schedule a customer-success call to resolve education delivery objections and clarify production-readiness boundaries.",
    expansion_interest: "Prepare an education-only expansion plan with cohort scope, coach capacity, and learning evidence milestones.",
    renewal_ready: "Prepare renewal paperwork around education adoption, coach follow-through, and source transparency evidence.",
    no_fit: "Document fit gap and archive the education pilot without making trading-performance claims.",
  };
  try {
    const result = await api("/api/admin/pilot-renewal-brief-deliveries/feedback", {
      method: "POST",
      body: JSON.stringify({
        deliveryId,
        feedbackStatus,
        feedbackNote: `Recorded customer-success feedback status ${feedbackStatus} for the education-only renewal brief.`,
        nextCustomerSuccessAction: nextByStatus[feedbackStatus] || "Plan the next education customer-success follow-up.",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot renewal feedback recorded: ${escapeHtml(result.delivery?.feedbackStatus || feedbackStatus)}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot renewal feedback failed: ${escapeHtml(error.message)}`;
  }
}

async function createPilotRenewalFeedbackAction(deliveryId) {
  if (!deliveryId || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-renewal-brief-deliveries/create-action", {
      method: "POST",
      body: JSON.stringify({
        deliveryId,
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot renewal feedback action ${result.reused ? "reused" : "created"}: ${escapeHtml(result.action?.title || "customer-success follow-up")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot renewal feedback action failed: ${escapeHtml(error.message)}`;
  }
}

async function savePilotExpansionPlan() {
  if (!nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-expansion-plans", {
      method: "POST",
      body: JSON.stringify({
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot expansion plan saved: ${escapeHtml(result.saved?.decision || "review")}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot expansion plan save failed: ${escapeHtml(error.message)}`;
  }
}

async function updatePilotExpansionPlan(planId, status) {
  if (!planId || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-expansion-plans/update", {
      method: "POST",
      body: JSON.stringify({
        planId,
        status,
        ownerEmail: "success@tradegym.local",
        executionNote: "Education-only expansion execution update for customer-success delivery readiness.",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot expansion plan updated: ${escapeHtml(result.updated?.status || status)}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot expansion plan update failed: ${escapeHtml(error.message)}`;
  }
}

async function savePilotExpansionLaunchBrief() {
  if (!nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-expansion-launch-briefs", {
      method: "POST",
      body: JSON.stringify({
        ownerEmail: "success@tradegym.local",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot expansion launch brief saved: ready ${result.brief?.summary?.ready || 0}/${result.brief?.summary?.total || 0}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot expansion launch brief save failed: ${escapeHtml(error.message)}`;
  }
}

async function updatePilotExpansionLaunchBrief(briefId, status) {
  if (!briefId || !status || !nodes.productReadinessStatus) return;
  try {
    const result = await api("/api/admin/pilot-expansion-launch-briefs/update", {
      method: "POST",
      body: JSON.stringify({
        briefId,
        status,
        ownerEmail: "success@tradegym.local",
        reviewNote: "Updated as an education-only pilot expansion launch brief for customer-success coordination.",
      }),
    });
    nodes.productReadinessStatus.textContent = `Pilot expansion launch brief ${escapeHtml(result.brief?.title || "brief")}: ${escapeHtml(result.brief?.status || status)}. Production ready remains no.`;
    await refreshProductReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.productReadinessStatus.textContent = `Pilot expansion launch brief update failed: ${escapeHtml(error.message)}`;
  }
}

async function exportAudit(format) {
  try {
    const response = await fetch(`/api/admin/audit-logs/export?${auditQuery(format).toString()}`);
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Audit export failed");
    }
    const text = await response.text();
    nodes.auditLog.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>Export ready (${format.toUpperCase()})</strong>
          <span>Preview only. Use the API endpoint for a production download flow.</span>
        </div>
        <span class="tag warn">${text.length} bytes</span>
      </div>
      <pre class="export-preview">${text.slice(0, 2400)}</pre>
    `;
  } catch (error) {
    nodes.auditLog.innerHTML = `<p>Audit export failed: ${error.message}</p>`;
  }
}

async function processDeletionRequest(requestId, action) {
  try {
    const result = await api("/api/admin/deletion-requests/process", {
      method: "POST",
      body: JSON.stringify({
        requestId,
        action,
        note: `Handled from ops UI as ${action}`,
      }),
    });
    nodes.aiCoachStatus.textContent = `Deletion request ${result.request.id}: ${result.request.moderationStatus}`;
    await refreshReviewQueue();
    await refreshMetrics();
    await refreshAuditLog();
  } catch (error) {
    nodes.aiCoachStatus.textContent = `Deletion request failed: ${error.message}`;
  }
}
async function login(email, password) {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  state.data.session = result.session;
  state.data.user = result.user;
  renderSession();
  await loadBootstrap();
  await refreshEntitlement();
  if (state.data?.session?.role === "admin") {
    await refreshMetrics();
  }
}

async function loginTrialAccount() {
  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "student@tradegym.local", password: "demo123" }),
  });
  state.data = state.data || {};
  state.data.session = result.session;
  state.data.user = result.user;
  await loadBootstrap({ render: false });
}

async function startFriendTrial() {
  await ensureTrialAccess({ redirect: true });
}

async function submitFriendTrialFeedback() {
  if (!nodes.friendFeedbackStatus) return;
  const confusing = nodes.friendFeedbackConfusing?.value.trim() || "";
  const helpful = nodes.friendFeedbackHelpful?.value.trim() || "";
  const continueReason = nodes.friendFeedbackContinue?.value.trim() || "";
  if (![confusing, helpful, continueReason].some(Boolean)) {
    nodes.friendFeedbackStatus.textContent = "先写一句真实感受，再提交。";
    return;
  }
  try {
    nodes.friendSubmitFeedback.disabled = true;
    nodes.friendFeedbackStatus.textContent = "正在提交反馈...";
    await ensureTrialAccess();
    const message = [
      `哪里看不懂：${confusing || "未填写"}`,
      `哪一步有帮助：${helpful || "未填写"}`,
      `是否愿意再练一次：${continueReason || "未填写"}`,
      "说明：这是一条用户试用反馈，只评价学习流程，不评价策略收益。",
    ].join("\n");
    const result = await api("/api/support/tickets", {
      method: "POST",
      body: JSON.stringify({
        category: "learning",
        subject: "用户试用反馈：学习流程是否有帮助",
        message,
      }),
    });
    state.data.supportTickets = result.tickets || [result.ticket];
    renderSupportTickets(state.data.supportTickets);
    nodes.friendFeedbackStatus.textContent = "已提交。谢谢，下一步我们会优先看哪里卡住、哪里有帮助。";
  } catch (error) {
    nodes.friendFeedbackStatus.textContent = `提交失败：${escapeHtml(error.message)}`;
  } finally {
    if (nodes.friendSubmitFeedback) nodes.friendSubmitFeedback.disabled = false;
  }
}

async function acknowledgeCompliance() {
  try {
    const result = await api("/api/compliance/acknowledge", {
      method: "POST",
      body: JSON.stringify({
        accepted: true,
        version: state.data.compliance?.version,
      }),
    });
    state.data.compliance = result.compliance;
    state.data.onboarding = result.onboarding || state.data.onboarding;
    renderCompliance();
    renderOnboarding();
  } catch (error) {
    if (nodes.complianceStatus) nodes.complianceStatus.textContent = `Compliance failed: ${error.message}`;
  }
}

async function registerAccount() {
  try {
    const result = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: nodes.registerName.value.trim(),
        email: nodes.registerEmail.value.trim(),
        password: nodes.registerPassword.value,
        legalAcceptance: {
          accepted: nodes.legalAcceptance?.checked === true,
          termsVersion: state.data.legalVersions?.terms,
          privacyVersion: state.data.legalVersions?.privacy,
          riskDisclosureVersion: state.data.legalVersions?.risk,
        },
      }),
    });
    state.data.session = result.session;
    state.data.user = result.user;
    state.data.entitlement = result.entitlement;
    state.data.compliance = result.compliance;
    if (nodes.verifyToken) nodes.verifyToken.value = result.verification?.token || "";
    renderSession();
    renderEntitlement();
    renderCompliance();
    await refreshMetrics();
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Registered ${result.account.email}; local verify token filled.`;
  } catch (error) {
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Register failed: ${error.message}`;
  }
}

async function verifyEmail() {
  try {
    const result = await api("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token: nodes.verifyToken.value.trim() }),
    });
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Email verified: ${result.account.email}`;
  } catch (error) {
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Verify failed: ${error.message}`;
  }
}

async function requestPasswordReset() {
  try {
    const result = await api("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email: nodes.resetEmail.value.trim() }),
    });
    if (nodes.resetToken && result.resetToken) nodes.resetToken.value = result.resetToken;
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = result.resetToken
      ? "Reset token generated locally and filled."
      : "If the account exists, a reset email would be sent in production.";
  } catch (error) {
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Reset request failed: ${error.message}`;
  }
}

async function confirmPasswordReset() {
  try {
    const result = await api("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({
        token: nodes.resetToken.value.trim(),
        password: nodes.resetPassword.value,
      }),
    });
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Password reset completed: ${result.account.email}`;
  } catch (error) {
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Reset confirm failed: ${error.message}`;
  }
}

async function exportAccountData() {
  try {
    const result = await api("/api/account/export");
    const counts = [
      `attempts=${result.attempts?.length || 0}`,
      `replay=${result.replayNotes?.length || 0}`,
      `orders=${result.orders?.length || 0}`,
      `audit=${result.auditLogs?.length || 0}`,
    ].join(", ");
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Export ready for ${result.account?.email}: ${counts}`;
  } catch (error) {
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Export failed: ${error.message}`;
  }
}

async function requestAccountDeletion() {
  try {
    const result = await api("/api/account/delete-request", {
      method: "POST",
      body: JSON.stringify({ reason: nodes.deleteAccountReason?.value || "" }),
    });
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Deletion request queued: ${result.request.id}`;
    await refreshReviewQueue();
  } catch (error) {
    if (nodes.accountLifecycleStatus) nodes.accountLifecycleStatus.textContent = `Deletion request failed: ${error.message}`;
  }
}

async function logout() {
  await api("/api/auth/logout", { method: "POST", body: "{}" });
  state.data.session = null;
  state.data.entitlement = null;
  renderSession();
  renderEntitlement();
}

async function publishScenario() {
  const options = nodes.cmsOptions.value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const draft = state.generatedDraft;
  nodes.publishScenario.disabled = true;
  try {
    const result = await api("/api/admin/scenarios", {
      method: "POST",
      body: JSON.stringify({
        title: nodes.cmsTitle.value.trim(),
        tag: nodes.cmsTag.value.trim(),
        question: nodes.cmsQuestion.value.trim(),
        options,
        answer: draft?.answer ?? 1,
        symbol: draft?.symbol,
        timeframe: draft?.timeframe,
        candles: draft?.candles,
        technical: draft?.technical || "Teacher-created scenario for practicing failed breakout risk handling.",
        news: draft?.news || "Teaching demo data: no real news event.",
        sentiment: draft?.sentiment || "Teaching demo data: sentiment is context, not a buy or sell reason.",
        feedbackTitle: draft?.feedbackTitle || "Accept failed breakout before forcing a trade",
        feedback: draft?.feedback || "When price falls back into the range, the breakout thesis is weaker. The training goal is to name invalidation conditions instead of defending a losing idea.",
        tags: draft?.tags || ["failed breakout", "invalidation", "patience"],
        nextPath: draft?.nextPath,
        source: draft?.source,
      }),
    });
    state.data.scenarios = result.scenarios;
    state.scenarioIndex = 0;
    renderTrainer();
    renderReplay();
    nodes.publishStatus.textContent = `Submitted for review: ${result.scenario.title}`;
    await refreshMetrics();
    await refreshScenarioReviews();
    await refreshDataSources();
  } catch (error) {
    nodes.publishStatus.textContent = error.message;
  } finally {
    nodes.publishScenario.disabled = false;
  }
}

async function generateScenarioDraft() {
  if (!nodes.publishStatus) return;
  try {
    const result = await api("/api/admin/scenarios/generate-draft", {
      method: "POST",
      body: JSON.stringify({
        title: nodes.cmsTitle.value.trim(),
        tag: nodes.cmsTag.value.trim(),
        knowledgePointId: state.data.knowledgePoints?.[0]?.id,
      }),
    });
    state.generatedDraft = result.draft;
    nodes.cmsTitle.value = result.draft.title;
    nodes.cmsTag.value = result.draft.tag;
    nodes.cmsQuestion.value = result.draft.question;
    nodes.cmsOptions.value = result.draft.options.join("\n");
    nodes.publishStatus.textContent = `Draft generated from ${result.providers.marketData.provider}/${result.providers.news.provider}/${result.providers.questionGenerator.provider}. Review before publishing.`;
    await refreshReadiness();
    await refreshAuditLog();
  } catch (error) {
    nodes.publishStatus.textContent = `Draft generation failed: ${error.message}`;
  }
}
function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function saveReplayNote() {
  const note = nodes.replayPlan.value.trim();
  if (!note) {
    nodes.replayPlan.focus();
    return;
  }
  nodes.saveReplayPlan.disabled = true;
  try {
    await ensureTrialAccess();
    const result = await api("/api/replay-notes", {
      method: "POST",
      body: JSON.stringify({
        scenarioId: currentScenario().id,
        step: state.replayStep,
        note,
      }),
    });
    state.data.user = result.user;
    state.data.profile = result.profile;
    state.data.attempts = result.attempts;
    state.data.entitlement = result.entitlement;
    nodes.replayPlan.value = "";
    renderProfile();
    renderDashboard();
    renderEntitlement();
    await refreshCoachReport();
    await refreshProgressReport();
  } finally {
    nodes.saveReplayPlan.disabled = false;
  }
}

async function submitPaperTrade() {
  if (!nodes.submitPaperTrade) return;
  const thesis = nodes.paperTradeThesis.value.trim();
  const invalidation = nodes.paperTradeInvalidation.value.trim();
  const marketContext = nodes.paperTradeContext?.value.trim() || "";
  if (!thesis || !invalidation || !marketContext) {
    if (nodes.paperTradeResult) nodes.paperTradeResult.innerHTML = "<p>Thesis, invalidation plan, and news/sentiment boundary are required.</p>";
    return;
  }
  nodes.submitPaperTrade.disabled = true;
  try {
    await ensureTrialAccess();
    const result = await api("/api/paper-trades", {
      method: "POST",
      body: JSON.stringify({
        scenarioId: currentScenario().id,
        step: state.replayStep,
        side: nodes.paperTradeSide.value,
        riskPercent: Number(nodes.paperTradeRisk.value || 1),
        thesis,
        invalidation,
        marketContext,
      }),
    });
    state.data.user = result.user;
    state.data.profile = result.profile;
    state.data.attempts = result.attempts;
    state.data.paperTrades = result.paperTrades;
    state.data.backtestClassroom = result.backtestClassroom;
    state.data.entitlement = result.entitlement;
    state.data.learningPath = result.learningPath;
    nodes.paperTradeThesis.value = "";
    nodes.paperTradeInvalidation.value = "";
    if (nodes.paperTradeContext) nodes.paperTradeContext.value = "";
    const debrief = result.paperTrade.replayDebrief;
    nodes.paperTradeResult.innerHTML = `
      <div class="attempt-row">
        <div>
          <strong>已保存教学模拟记录</strong>
          <span>${result.paperTrade.evaluation.simulatedR}R / 纪律分 ${result.paperTrade.evaluation.disciplineScore}</span>
          <span>环境边界 ${result.paperTrade.contextReview?.score ?? "-"}：${escapeHtml(result.paperTrade.contextReview?.summary || "已保存消息/情绪边界，等待复盘。")}</span>
          ${debrief ? `<span>回放复盘 ${debrief.processScore}：${escapeHtml(debrief.decisionQuality)} / 决策时点 ${debrief.revealStep}，隐藏K线 ${debrief.hiddenCandlesBeforeDecision}</span>` : ""}
          ${debrief ? `<span>下一步练习：${escapeHtml(debrief.nextPractice?.[0] || "按同一张检查表再回放一次。")}</span>` : ""}
          <span>${result.paperTrade.evaluation.constraints[1]}</span>
        </div>
        <span class="tag warn">演示</span>
      </div>
    `;
    renderPaperTrades();
    renderBacktestClassroom();
    renderProfile();
    renderDashboard();
    renderEntitlement();
    renderLearningPath();
    await refreshEvidenceIntegrity();
    await refreshCoachReport();
    await refreshProgressReport();
  } catch (error) {
    if (nodes.paperTradeResult) nodes.paperTradeResult.innerHTML = `<p>${error.message}</p>`;
  } finally {
    nodes.submitPaperTrade.disabled = false;
  }
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.jump));
  });
  nodes.submitBtn.addEventListener("click", submitDecision);
  nodes.refreshAchievements?.addEventListener("click", refreshAchievements);
  nodes.onboardingNext?.addEventListener("click", async () => {
    const nextView = nodes.onboardingNext.dataset.nextView || state.data?.onboarding?.nextView || "dashboard";
    nodes.onboardingNext.disabled = true;
    try {
      await recordNextStepEvent("opened");
    } catch (error) {
      console.warn("Next-step event was not recorded", error);
    } finally {
      nodes.onboardingNext.disabled = !state.data?.session || state.data?.onboarding?.status === "completed";
    }
    if (nextView === "trainer") {
      selectScenarioById(nodes.onboardingNext.dataset.scenarioId || state.data?.onboarding?.recommendedScenario?.id);
    }
    setView(nextView);
    if (nextView === "replay") refreshBacktestClassroom();
    if (nextView === "coach") refreshProgressReport();
    if (state.data?.onboarding?.currentStepId === "compliance") {
      nodes.acknowledgeCompliance?.focus();
    }
  });
  nodes.refreshCourseCatalog?.addEventListener("click", refreshCourseCatalog);
  nodes.refreshLearnerCoursePath?.addEventListener("click", refreshLearnerCoursePath);
  nodes.courseCatalogList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-course-progress]");
    if (!button) return;
    if (button.dataset.courseProgress === "knowledge") {
      markCourseKnowledgeReviewed(button.dataset.coursePackageId, button.dataset.knowledgePointId);
    }
  });
  nodes.learnerCoursePathList?.addEventListener("click", (event) => {
    const progressButton = event.target.closest("[data-course-progress]");
    if (progressButton?.dataset.courseProgress === "knowledge") {
      markCourseKnowledgeReviewed(progressButton.dataset.coursePackageId, progressButton.dataset.knowledgePointId);
      return;
    }
    const scenarioButton = event.target.closest("[data-course-scenario-id]");
    if (scenarioButton) {
      selectScenarioById(scenarioButton.dataset.courseScenarioId);
      setView("trainer");
      return;
    }
    const backtestButton = event.target.closest("[data-course-backtest-drill]");
    if (backtestButton) {
      setView("replay");
      refreshBacktestClassroom();
    }
    const contextButton = event.target.closest("[data-course-context-drill]");
    if (contextButton) {
      setView("replay");
      refreshMarketContextClassroom();
    }
    const sourceButton = event.target.closest("[data-course-source-drill]");
    if (sourceButton) {
      setView("replay");
      refreshSourceTransparencyClassroom();
    }
  });
  nodes.nextBtn.addEventListener("click", () => {
    state.scenarioIndex = (state.scenarioIndex + 1) % state.data.scenarios.length;
    state.replayStep = 8;
    renderTrainer();
    renderReplay();
  });
  nodes.trainingResultActions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-training-result-action]");
    if (!button) return;
    if (button.dataset.trainingResultAction === "next") {
      selectScenarioById(button.dataset.scenarioId);
      setView("trainer");
    }
    if (button.dataset.trainingResultAction === "coach") setView("coach");
    if (button.dataset.trainingResultAction === "replay") setView("replay");
    if (button.dataset.trainingResultAction === "feedback") setView("community");
  });
  nodes.replayPrev.addEventListener("click", () => {
    state.replayStep = Math.max(4, state.replayStep - 1);
    renderReplay();
  });
  nodes.replayNext.addEventListener("click", () => {
    state.replayStep = Math.min(currentScenario().candles.length, state.replayStep + 1);
    renderReplay();
  });
  nodes.replayReset.addEventListener("click", () => {
    state.replayStep = 8;
    renderReplay();
  });
  nodes.saveReplayPlan.addEventListener("click", saveReplayNote);
  nodes.submitPaperTrade?.addEventListener("click", submitPaperTrade);
  nodes.paperTradeLog?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-replay-debrief-followup]");
    if (!button) return;
    createReplayDebriefFollowup(button.dataset.replayDebriefFollowup);
  });
  nodes.refreshEvidenceIntegrity?.addEventListener("click", refreshEvidenceIntegrity);
  nodes.refreshBacktestClassroom?.addEventListener("click", refreshBacktestClassroom);
  nodes.exportBacktestLiteracyJson?.addEventListener("click", () => exportBacktestLiteracyBrief("json"));
  nodes.exportBacktestLiteracyCsv?.addEventListener("click", () => exportBacktestLiteracyBrief("csv"));
  nodes.exportBacktestLiteracyMd?.addEventListener("click", () => exportBacktestLiteracyBrief("md"));
  nodes.refreshContextClassroom?.addEventListener("click", refreshMarketContextClassroom);
  nodes.refreshSourceClassroom?.addEventListener("click", refreshSourceTransparencyClassroom);
  nodes.backtestMisconceptionPanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-backtest-drill-answer]");
    if (!button) return;
    submitBacktestMisconception(Number(button.dataset.backtestDrillAnswer));
  });
  nodes.contextMisconceptionPanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-context-drill-answer]");
    if (!button) return;
    submitContextMisconception(Number(button.dataset.contextDrillAnswer));
  });
  nodes.sourceMisconceptionPanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-source-drill-answer]");
    if (!button) return;
    submitSourceMisconception(Number(button.dataset.sourceDrillAnswer));
  });
  nodes.refreshCoachReport?.addEventListener("click", refreshCoachReport);
  nodes.refreshProgressReport?.addEventListener("click", refreshProgressReport);
  nodes.refreshCoachSessionBookings?.addEventListener("click", refreshCoachSessionBookings);
  nodes.requestCoachSession?.addEventListener("click", requestCoachSessionBooking);
  nodes.refreshSupportTickets?.addEventListener("click", refreshSupportTickets);
  nodes.createSupportTicket?.addEventListener("click", createSupportTicket);
  nodes.refreshNotifications?.addEventListener("click", refreshNotifications);
  nodes.progressReportPanel?.addEventListener("click", (event) => {
    const modelRunButton = event.target.closest("[data-education-model-run]");
    if (modelRunButton?.dataset.educationModelRun === "archive") {
      archiveEducationModelRun();
      return;
    }
    const certificateButton = event.target.closest("[data-completion-certificate-format]");
    if (certificateButton) {
      exportCompletionCertificate(certificateButton.dataset.reportId, certificateButton.dataset.completionCertificateFormat, "learner");
      return;
    }
    const button = event.target.closest("[data-learner-report-action]");
    if (!button) return;
    updateLearnerReportDelivery(button.dataset.deliveryId, button.dataset.learnerReportAction);
  });
  nodes.notificationList?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-notification-action]");
    if (!button) return;
    if (button.dataset.notificationAction === "open-report") {
      if (button.dataset.deliveryId) await updateLearnerReportDelivery(button.dataset.deliveryId, "read");
      setView("coach");
      await refreshProgressReport();
    }
    if (button.dataset.notificationAction === "start-assignment") {
      selectScenarioById(button.dataset.scenarioId);
      setView("trainer");
    }
    if (button.dataset.notificationAction === "open-support") {
      await markSupportTicketRead(button.dataset.ticketId);
      await refreshSupportTickets();
    }
    if (button.dataset.notificationAction === "open-activation") {
      if (button.dataset.taskId) {
        const result = await api("/api/activation-interventions/read", {
          method: "POST",
          body: JSON.stringify({ taskId: button.dataset.taskId }),
        });
        state.data.notifications = result.notifications || state.data.notifications;
        renderNotifications(state.data.notifications);
      }
      setView(button.dataset.targetView || "dashboard");
      await refreshOnboarding();
    }
    if (button.dataset.notificationAction === "open-next-learning") {
      if (button.dataset.reportId) {
        const result = await api("/api/next-learning-products/read", {
          method: "POST",
          body: JSON.stringify({ reportId: button.dataset.reportId }),
        });
        state.data.notifications = result.notifications || state.data.notifications;
        renderNotifications(state.data.notifications);
      }
      setView("coach");
      await refreshProgressReport();
    }
    if (button.dataset.notificationAction === "open-evidence-followup") {
      if (button.dataset.taskId) {
        const result = await api("/api/learning-evidence-followups/read", {
          method: "POST",
          body: JSON.stringify({ taskId: button.dataset.taskId }),
        });
        state.data.notifications = result.notifications || state.data.notifications;
        state.data.progressReport = result.report || state.data.progressReport;
        renderNotifications(state.data.notifications);
        const alreadyResponded = result.task?.learnerRespondedAt;
        const stillOpen = result.task?.status === "open";
        if (stillOpen && !alreadyResponded) {
          const learnerResponse = window.prompt("Learning reflection for your coach: what evidence will you add next, and how will you separate news/sentiment context from simulated decisions?");
          if (learnerResponse && learnerResponse.trim().length >= 30) {
            const responseResult = await api("/api/learning-evidence-followups/respond", {
              method: "POST",
              body: JSON.stringify({ taskId: button.dataset.taskId, learnerResponse }),
            });
            state.data.notifications = responseResult.notifications || state.data.notifications;
            state.data.progressReport = responseResult.report || state.data.progressReport;
            renderNotifications(state.data.notifications);
          }
        }
      }
      setView("coach");
      await refreshProgressReport();
    }
    if (button.dataset.notificationAction === "open-coach-session") {
      if (button.dataset.bookingId) {
        const result = await api("/api/coach/session-bookings/read", {
          method: "POST",
          body: JSON.stringify({ bookingId: button.dataset.bookingId }),
        });
        state.data.coachSessionBookings = result.bookings || state.data.coachSessionBookings;
        state.data.notifications = result.notifications || state.data.notifications;
        renderCoachSessionBookings(state.data.coachSessionBookings);
        renderNotifications(state.data.notifications);
      }
      setView("coach");
      await refreshCoachSessionBookings();
    }
  });
  nodes.refreshAssignments?.addEventListener("click", refreshAssignments);
  nodes.refreshMetrics?.addEventListener("click", refreshMetrics);
  nodes.refreshActivationInterventions?.addEventListener("click", refreshActivationInterventions);
  nodes.activationFunnelList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-activation-action]");
    if (!button) return;
    if (button.dataset.activationAction === "create-intervention") {
      createActivationIntervention(button.dataset.userId, button.dataset.stepId);
    }
    if (button.dataset.activationAction === "assign-package") {
      assignCoursePackageToLearner(button.dataset.userId, button.dataset.coursePackageId || "");
    }
    if (button.dataset.activationAction === "completion-followup") {
      createCompletionReportFollowup(button.dataset.reportId);
    }
  });
  nodes.activationInterventionList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-activation-task-status]");
    if (!button) return;
    updateActivationIntervention(button.dataset.taskId, button.dataset.activationTaskStatus);
  });
  nodes.refreshRevenueOps?.addEventListener("click", refreshRevenueOps);
  nodes.refreshRevenueOpsActions?.addEventListener("click", refreshRevenueOpsActions);
  nodes.revenueOpsList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-revenue-action]");
    if (!button) return;
    runRevenueOpsAction(button.dataset.userId, button.dataset.revenueAction);
  });
  nodes.refreshReadiness?.addEventListener("click", refreshReadiness);
  nodes.createReadinessTasks?.addEventListener("click", createReadinessTasks);
  nodes.productReadinessList?.addEventListener("click", (event) => {
    const pilotButton = event.target.closest("[data-pilot-action-status]");
    if (pilotButton) {
      updatePilotSuccessAction(pilotButton.dataset.pilotActionId, pilotButton.dataset.pilotActionStatus);
      return;
    }
    const briefButton = event.target.closest("[data-pilot-brief-status]");
    if (briefButton) {
      updatePilotRenewalBrief(briefButton.dataset.pilotBriefId, briefButton.dataset.pilotBriefStatus);
      return;
    }
    const deliveryButton = event.target.closest("[data-pilot-brief-deliver]");
    if (deliveryButton) {
      deliverPilotRenewalBrief(deliveryButton.dataset.pilotBriefDeliver);
      return;
    }
    const feedbackButton = event.target.closest("[data-pilot-delivery-feedback]");
    if (feedbackButton) {
      recordPilotRenewalFeedback(feedbackButton.dataset.pilotDeliveryId, feedbackButton.dataset.pilotDeliveryFeedback);
      return;
    }
    const trialFeedbackButton = event.target.closest("[data-trial-delivery-feedback]");
    if (trialFeedbackButton) {
      recordCustomerTrialFeedback(trialFeedbackButton.dataset.trialDeliveryId, trialFeedbackButton.dataset.trialDeliveryFeedback);
      return;
    }
    const roomFeedbackButton = event.target.closest("[data-room-share-feedback]");
    if (roomFeedbackButton) {
      recordCustomerTrialRoomFeedback(roomFeedbackButton.dataset.roomShareId, roomFeedbackButton.dataset.roomShareFeedback);
      return;
    }
    const roomBuyerReviewButton = event.target.closest("[data-room-share-buyer-review]");
    if (roomBuyerReviewButton) {
      viewCustomerTrialRoomBuyerReview(roomBuyerReviewButton.dataset.roomShareBuyerReview);
      return;
    }
    const roomBuyerObjectionButton = event.target.closest("[data-room-share-buyer-objection]");
    if (roomBuyerObjectionButton) {
      recordCustomerTrialRoomBuyerObjection(roomBuyerObjectionButton.dataset.roomShareBuyerObjection);
      return;
    }
    const expansionButton = event.target.closest("[data-pilot-expansion-status]");
    if (expansionButton) {
      updatePilotExpansionPlan(expansionButton.dataset.pilotExpansionId, expansionButton.dataset.pilotExpansionStatus);
      return;
    }
    const launchBriefButton = event.target.closest("[data-pilot-launch-brief-status]");
    if (launchBriefButton) {
      updatePilotExpansionLaunchBrief(launchBriefButton.dataset.pilotLaunchBriefId, launchBriefButton.dataset.pilotLaunchBriefStatus);
      return;
    }
    const feedbackActionButton = event.target.closest("[data-pilot-delivery-action]");
    if (feedbackActionButton) {
      createPilotRenewalFeedbackAction(feedbackActionButton.dataset.pilotDeliveryAction);
      return;
    }
    const trialActionButton = event.target.closest("[data-trial-delivery-action]");
    if (trialActionButton) {
      createCustomerTrialFeedbackAction(trialActionButton.dataset.trialDeliveryAction);
      return;
    }
    const roomActionButton = event.target.closest("[data-room-share-action]");
    if (!roomActionButton) return;
    createCustomerTrialRoomFeedbackAction(roomActionButton.dataset.roomShareAction);
  });
  nodes.readinessRemediationList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-readiness-task-status]");
    if (!button) return;
    updateReadinessTask(button.dataset.readinessTaskId, button.dataset.readinessTaskStatus);
  });
  nodes.refreshDataSources?.addEventListener("click", refreshDataSources);
  nodes.refreshTeachingEvolutionLab?.addEventListener("click", refreshTeachingEvolutionLab);
  nodes.refreshDatasetManifest?.addEventListener("click", refreshDatasetManifest);
  nodes.exportDatasetManifestMd?.addEventListener("click", () => exportDatasetManifest("md"));
  nodes.refreshOpenSourceMap?.addEventListener("click", refreshOpenSourceReferenceMap);
  nodes.refreshOpenSourceReviews?.addEventListener("click", refreshOpenSourceReferenceReviews);
  nodes.exportOpenSourceMapCsv?.addEventListener("click", () => exportOpenSourceReferenceMap("csv"));
  nodes.exportOpenSourceMapMd?.addEventListener("click", () => exportOpenSourceReferenceMap("md"));
  nodes.dataGovernanceQueue?.addEventListener("click", (event) => {
    const openSourceReviewButton = event.target.closest("[data-open-source-review-status]");
    if (openSourceReviewButton) {
      updateOpenSourceReferenceReview(
        openSourceReviewButton.dataset.openSourceReferenceKey,
        openSourceReviewButton.dataset.openSourceReviewStatus,
      );
      return;
    }
    const button = event.target.closest("[data-data-governance-action]");
    if (!button) return;
    runDataGovernanceAction(button.dataset.dataGovernanceId, button.dataset.dataGovernanceAction);
  });
  nodes.refreshScenarioReviews?.addEventListener("click", refreshScenarioReviews);
  nodes.refreshAdminUsers?.addEventListener("click", refreshAdminUsers);
  nodes.adminUserSearch?.addEventListener("input", refreshAdminUsers);
  nodes.adminUserStatusFilter?.addEventListener("change", refreshAdminUsers);
  nodes.adminUserRoleFilter?.addEventListener("change", refreshAdminUsers);
  nodes.refreshCoachConsole?.addEventListener("click", refreshCoachConsole);
  nodes.educationServiceHealthPanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-health-action]");
    if (!button) return;
    if (button.dataset.healthAction === "open-model-review") openEducationModelReviewQueue();
    if (button.dataset.healthAction === "open-overdue-coach-tasks") refreshCoachTasks("", { overdue: true });
    if (button.dataset.healthAction === "open-chart-evidence") refreshCoachTasks("", { chartEvidenceOnly: true });
    if (button.dataset.healthAction === "open-evidence-ready-apply") refreshCoachTasks("ready_to_apply");
    if (button.dataset.healthAction === "open-evidence-awaiting-assignment") refreshCoachTasks("awaiting_assignment_completion");
    if (button.dataset.healthAction === "open-evidence-closure") refreshCoachTasks("ready_for_coach_closure");
    if (button.dataset.healthAction === "export-health-json") exportEducationServiceHealth("json");
    if (button.dataset.healthAction === "export-health-csv") exportEducationServiceHealth("csv");
  });
  nodes.exportEvidencePacketsJson?.addEventListener("click", () => exportLearningEvidencePackets("json"));
  nodes.exportEvidencePacketsCsv?.addEventListener("click", () => exportLearningEvidencePackets("csv"));
  nodes.coachConsoleSearch?.addEventListener("input", refreshCoachConsole);
  nodes.bulkContextRiskFollowups?.addEventListener("click", createBulkContextRiskFollowups);
  nodes.bulkChartEvidenceFollowups?.addEventListener("click", createBulkChartEvidenceFollowups);
  nodes.bulkLearningActionQueue?.addEventListener("click", processBulkLearningActionQueue);
  nodes.bulkServiceFollowups?.addEventListener("click", createBulkServiceFollowups);
  nodes.refreshServiceDelivery?.addEventListener("click", refreshServiceDelivery);
  nodes.exportSupportSlaJson?.addEventListener("click", () => exportSupportSlaReport("json"));
  nodes.exportSupportSlaCsv?.addEventListener("click", () => exportSupportSlaReport("csv"));
  nodes.exportSupportSlaMd?.addEventListener("click", () => exportSupportSlaReport("md"));
  nodes.refreshAdminSupportTickets?.addEventListener("click", refreshAdminSupportTickets);
  nodes.adminSupportSearch?.addEventListener("input", refreshAdminSupportTickets);
  nodes.adminSupportStatus?.addEventListener("change", refreshAdminSupportTickets);
  nodes.adminSupportTicketList?.addEventListener("click", (event) => {
    const supportButton = event.target.closest("[data-support-action]");
    if (supportButton) {
      updateSupportTicket(supportButton.dataset.ticketId, supportButton.dataset.supportAction);
      return;
    }
    const refundButton = event.target.closest("[data-refund-action]");
    if (refundButton) {
      processRefundRequest(refundButton.dataset.ticketId, refundButton.dataset.refundAction);
    }
  });
  nodes.refreshAdminCoachSessions?.addEventListener("click", refreshAdminCoachSessions);
  nodes.adminCoachSessionSearch?.addEventListener("input", refreshAdminCoachSessions);
  nodes.adminCoachSessionStatus?.addEventListener("change", refreshAdminCoachSessions);
  nodes.adminCoachSessionList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-session-action]");
    if (!button) return;
    updateAdminCoachSession(button.dataset.bookingId, button.dataset.sessionAction);
  });
  nodes.serviceDeliveryList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-service-action]");
    if (!button) return;
    if (button.dataset.serviceAction === "create-followup") {
      createServiceFollowup(button.dataset.deliveryId);
    }
  });
  nodes.createServiceSlaActions?.addEventListener("click", createServiceSlaActions);
  nodes.refreshCoachTasks?.addEventListener("click", refreshCoachTasks);
  nodes.exportLearningRecordsJson?.addEventListener("click", () => exportLearningRecords("json"));
  nodes.exportLearningRecordsCsv?.addEventListener("click", () => exportLearningRecords("csv"));
  nodes.exportLearningRecordsMd?.addEventListener("click", () => exportLearningRecords("md"));
  nodes.refreshRosterHandoffs?.addEventListener("click", refreshRosterHandoffs);
  nodes.viewRosterOnboardingProgress?.addEventListener("click", () => viewRosterOnboardingProgress("", ""));
  nodes.exportRosterOnboardingProgressCsv?.addEventListener("click", () => exportRosterOnboardingProgress("", "", "csv"));
  nodes.exportRosterOnboardingProgressMd?.addEventListener("click", () => exportRosterOnboardingProgress("", "", "md"));
  nodes.rosterHandoffList?.addEventListener("click", (event) => {
    const followupButton = event.target.closest("[data-roster-onboarding-followups]");
    if (followupButton) {
      createRosterOnboardingFollowups(followupButton.dataset.rosterOnboardingFollowups);
      return;
    }
    const onboardingButton = event.target.closest("[data-roster-onboarding-format]");
    if (onboardingButton) {
      exportRosterOnboardingReport(onboardingButton.dataset.handoffId, onboardingButton.dataset.rosterOnboardingFormat);
      return;
    }
    const button = event.target.closest("[data-roster-handoff-format]");
    if (!button) return;
    exportRosterHandoff(button.dataset.handoffId, button.dataset.rosterHandoffFormat);
  });
  nodes.refreshCohorts?.addEventListener("click", refreshCohorts);
  nodes.viewProcurementProgress?.addEventListener("click", () => viewCohortProcurementProgress("", ""));
  nodes.exportProcurementProgressCsv?.addEventListener("click", () => exportCohortProcurementProgress("", "", "csv"));
  nodes.exportProcurementProgressMd?.addEventListener("click", () => exportCohortProcurementProgress("", "", "md"));
  nodes.exportProcurementProgressMeetingBrief?.addEventListener("click", () => exportCohortProcurementProgress("", "", "meeting_brief"));
  nodes.createProcurementMeetingActions?.addEventListener("click", () => createCohortProcurementMeetingActions("", ""));
  nodes.createCohort?.addEventListener("click", createCohort);
  nodes.importRoster?.addEventListener("click", importRoster);
  nodes.cohortList?.addEventListener("click", (event) => {
    const buyerReviewButton = event.target.closest("[data-cohort-procurement-buyer-review]");
    if (buyerReviewButton) {
      viewCohortProcurementBuyerReview(buyerReviewButton.dataset.cohortProcurementBuyerReview);
      return;
    }
    const buyerObjectionButton = event.target.closest("[data-cohort-procurement-buyer-objection]");
    if (buyerObjectionButton) {
      recordCohortProcurementBuyerObjection(buyerObjectionButton.dataset.cohortProcurementBuyerObjection);
      return;
    }
    const actionButton = event.target.closest("[data-cohort-procurement-action]");
    if (actionButton) {
      createCohortProcurementFeedbackAction(actionButton.dataset.cohortProcurementAction);
      return;
    }
    const feedbackButton = event.target.closest("[data-cohort-procurement-feedback]");
    if (feedbackButton) {
      recordCohortProcurementFeedback(feedbackButton.dataset.cohortProcurementDeliveryId, feedbackButton.dataset.cohortProcurementFeedback);
      return;
    }
    const button = event.target.closest("[data-cohort-action]");
    if (!button) return;
    if (button.dataset.cohortAction === "view-report") viewCohortEducationReport(button.dataset.cohortId);
    if (button.dataset.cohortAction === "success-brief") viewCohortSuccessBrief(button.dataset.cohortId);
    if (button.dataset.cohortAction === "success-csv") exportCohortSuccessBrief(button.dataset.cohortId, "csv");
    if (button.dataset.cohortAction === "success-md") exportCohortSuccessBrief(button.dataset.cohortId, "md");
    if (button.dataset.cohortAction === "compliance-pack") viewCohortCompliancePack(button.dataset.cohortId);
    if (button.dataset.cohortAction === "compliance-csv") exportCohortCompliancePack(button.dataset.cohortId, "csv");
    if (button.dataset.cohortAction === "compliance-md") exportCohortCompliancePack(button.dataset.cohortId, "md");
    if (button.dataset.cohortAction === "procurement-packet") viewCohortProcurementPacket(button.dataset.cohortId);
    if (button.dataset.cohortAction === "renewal-review") viewCohortRenewalReview(button.dataset.cohortId);
    if (button.dataset.cohortAction === "renewal-csv") exportCohortRenewalReview(button.dataset.cohortId, "csv");
    if (button.dataset.cohortAction === "renewal-md") exportCohortRenewalReview(button.dataset.cohortId, "md");
    if (button.dataset.cohortAction === "renewal-actions") createCohortRenewalReviewActions(button.dataset.cohortId);
    if (button.dataset.cohortAction === "procurement-deliver") deliverCohortProcurementPacket(button.dataset.cohortId);
    if (button.dataset.cohortAction === "procurement-followup") createCohortProcurementFollowup(button.dataset.cohortId);
    if (button.dataset.cohortAction === "procurement-progress") viewCohortProcurementProgress(button.dataset.cohortId || "");
    if (button.dataset.cohortAction === "procurement-progress-csv") exportCohortProcurementProgress(button.dataset.cohortId || "", "", "csv");
    if (button.dataset.cohortAction === "procurement-progress-md") exportCohortProcurementProgress(button.dataset.cohortId || "", "", "md");
    if (button.dataset.cohortAction === "procurement-progress-meeting") exportCohortProcurementProgress(button.dataset.cohortId || "", "", "meeting_brief");
    if (button.dataset.cohortAction === "procurement-meeting-actions") createCohortProcurementMeetingActions(button.dataset.cohortId || "", "");
    if (button.dataset.cohortAction === "procurement-csv") exportCohortProcurementPacket(button.dataset.cohortId, "csv");
    if (button.dataset.cohortAction === "procurement-md") exportCohortProcurementPacket(button.dataset.cohortId, "md");
    if (button.dataset.cohortAction === "export-json") exportCohortEducationReport(button.dataset.cohortId, "json");
    if (button.dataset.cohortAction === "export-csv") exportCohortEducationReport(button.dataset.cohortId, "csv");
    if (button.dataset.cohortAction === "export-md") exportCohortEducationReport(button.dataset.cohortId, "md");
    if (button.dataset.cohortAction === "learning-records") exportLearningRecords("json", button.dataset.cohortId);
    if (button.dataset.cohortAction === "assign") assignCohortPractice(button.dataset.cohortId);
    if (button.dataset.cohortAction === "assign-course-package") assignCohortCoursePackage(button.dataset.cohortId);
  });
  nodes.coachConsoleList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coach-action]");
    if (!button) return;
    if (button.dataset.coachAction === "create-task") {
      createCoachReviewTask(button.dataset.userId, decodeURIComponent(button.dataset.focus || "decision process"));
    }
    if (button.dataset.coachAction === "assign-practice") {
      createPracticeAssignment(button.dataset.userId, button.dataset.scenarioId, decodeURIComponent(button.dataset.focus || "practice"));
    }
    if (button.dataset.coachAction === "view-progress-report") {
      viewCoachProgressReport(button.dataset.userId);
    }
    if (button.dataset.coachAction === "evidence-followup") {
      createLearningEvidenceFollowup(button.dataset.userId);
    }
    if (button.dataset.coachAction === "context-followup") {
      createContextRiskFollowup(button.dataset.userId);
    }
    if (button.dataset.coachAction === "assign-course-package") {
      assignCoursePackageToLearner(button.dataset.userId, button.dataset.coursePackageId || "");
    }
    if (button.dataset.coachAction === "metric-followup") {
      createMetricFollowup(button.dataset.userId, button.dataset.coursePackageId || "");
    }
  });
  nodes.learningActionQueueList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coach-action]");
    if (!button) return;
    if (button.dataset.coachAction === "create-task") {
      createCoachReviewTask(button.dataset.userId, decodeURIComponent(button.dataset.focus || "decision process"));
    }
    if (button.dataset.coachAction === "view-progress-report") {
      viewCoachProgressReport(button.dataset.userId);
    }
    if (button.dataset.coachAction === "evidence-followup") {
      createLearningEvidenceFollowup(button.dataset.userId);
    }
    if (button.dataset.coachAction === "context-followup") {
      createContextRiskFollowup(button.dataset.userId);
    }
    if (button.dataset.coachAction === "assign-course-package") {
      assignCoursePackageToLearner(button.dataset.userId, button.dataset.coursePackageId || "");
    }
    if (button.dataset.coachAction === "metric-followup") {
      createMetricFollowup(button.dataset.userId, button.dataset.coursePackageId || "");
    }
  });
  nodes.learningActionOutcomePanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sla-action]");
    if (!button) return;
    handleLearningActionSlaAction(button.dataset.slaAction, button.dataset.slaType, button.dataset.slaOwner);
  });
  nodes.coachProgressReportPanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coach-action]");
    if (!button) return;
    if (button.dataset.coachAction === "deliver-progress-report") {
      deliverCoachProgressReport(button.dataset.userId);
    }
    if (button.dataset.coachAction === "completion-followup") {
      createCompletionReportFollowup(button.dataset.reportId);
    }
    if (button.dataset.coachAction === "export-certificate-json") {
      exportCompletionCertificate(button.dataset.reportId, "json", "coach");
    }
    if (button.dataset.coachAction === "export-certificate-csv") {
      exportCompletionCertificate(button.dataset.reportId, "csv", "coach");
    }
    if (button.dataset.coachAction === "export-certificate-md") {
      exportCompletionCertificate(button.dataset.reportId, "md", "coach");
    }
    if (button.dataset.coachAction === "assign-course-package") {
      assignCoursePackageToLearner(button.dataset.userId, button.dataset.coursePackageId || "");
    }
  });
  nodes.coachTaskList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-coach-action]");
    if (!button) return;
    if (button.dataset.coachAction === "filter-evidence-loop") refreshCoachTasks(button.dataset.evidenceLoopStatus || "");
    if (button.dataset.coachAction === "filter-chart-evidence") refreshCoachTasks("", { chartEvidenceOnly: true });
    if (button.dataset.coachAction === "filter-replay-debrief") refreshCoachTasks("", { replayDebriefOnly: true });
    if (button.dataset.coachAction === "filter-overdue-tasks") refreshCoachTasks("", { overdue: true });
    if (button.dataset.coachAction === "export-evidence-loop-json") exportLearningEvidenceLoop("json");
    if (button.dataset.coachAction === "export-evidence-loop-csv") exportLearningEvidenceLoop("csv");
    if (button.dataset.coachAction === "apply-evidence-next-action") applyEvidenceNextAction(button.dataset.taskId);
    if (button.dataset.coachAction === "assign-recommended") assignRecommendedCoachTask(button.dataset.taskId);
    if (button.dataset.coachAction === "complete-task") updateCoachReviewTask(button.dataset.taskId, "completed");
    if (button.dataset.coachAction === "cancel-task") updateCoachReviewTask(button.dataset.taskId, "canceled");
  });
  nodes.refreshReviewQueue?.addEventListener("click", refreshReviewQueue);
  nodes.refreshAuditLog?.addEventListener("click", refreshAuditLog);
  nodes.auditTypeFilter?.addEventListener("change", refreshAuditLog);
  nodes.refreshEducationModelRuns?.addEventListener("click", refreshEducationModelRuns);
  nodes.auditUserFilter?.addEventListener("input", refreshAuditLog);
  nodes.auditStatusFilter?.addEventListener("change", refreshAuditLog);
  nodes.auditFromFilter?.addEventListener("change", refreshAuditLog);
  nodes.auditToFilter?.addEventListener("change", refreshAuditLog);
  nodes.refreshAuditIntegrity?.addEventListener("click", refreshAuditIntegrity);
  nodes.sealAuditIntegrity?.addEventListener("click", sealAuditIntegrity);
  nodes.exportAuditJson?.addEventListener("click", () => exportAudit("json"));
  nodes.exportAuditCsv?.addEventListener("click", () => exportAudit("csv"));
  nodes.exportEducationModelRunsJson?.addEventListener("click", () => exportEducationModelRuns("json"));
  nodes.exportEducationModelRunsCsv?.addEventListener("click", () => exportEducationModelRuns("csv"));
  nodes.refreshEntitlement?.addEventListener("click", refreshEntitlement);
  nodes.refreshReceipts?.addEventListener("click", refreshReceipts);
  nodes.refreshRevenueLedger?.addEventListener("click", refreshRevenueLedger);
  nodes.refreshBillingCompliance?.addEventListener("click", refreshBillingCompliance);
  nodes.refreshProductReadiness?.addEventListener("click", refreshProductReadiness);
  nodes.exportPrototypeScorecardJson?.addEventListener("click", () => exportCommercialPrototypeScorecard("json"));
  nodes.exportPrototypeScorecardCsv?.addEventListener("click", () => exportCommercialPrototypeScorecard("csv"));
  nodes.exportPrototypeScorecardMd?.addEventListener("click", () => exportCommercialPrototypeScorecard("md"));
  nodes.exportTrialKickoffJson?.addEventListener("click", () => exportCustomerTrialKickoffPlan("json"));
  nodes.exportTrialKickoffCsv?.addEventListener("click", () => exportCustomerTrialKickoffPlan("csv"));
  nodes.exportTrialKickoffMd?.addEventListener("click", () => exportCustomerTrialKickoffPlan("md"));
  nodes.createTrialKickoffActions?.addEventListener("click", createCustomerTrialKickoffActions);
  nodes.exportTrialRoomJson?.addEventListener("click", () => exportCustomerTrialRoom("json"));
  nodes.exportTrialRoomCsv?.addEventListener("click", () => exportCustomerTrialRoom("csv"));
  nodes.exportTrialRoomMd?.addEventListener("click", () => exportCustomerTrialRoom("md"));
  nodes.exportTrialRoomProgressMd?.addEventListener("click", () => exportCustomerTrialRoomShareProgress("md"));
  nodes.sendTrialRoom?.addEventListener("click", sendCustomerTrialRoom);
  nodes.exportLaunchOpsJson?.addEventListener("click", () => exportLaunchOpsBoard("json"));
  nodes.exportLaunchOpsCsv?.addEventListener("click", () => exportLaunchOpsBoard("csv"));
  nodes.exportLaunchOpsMd?.addEventListener("click", () => exportLaunchOpsBoard("md"));
  nodes.createLaunchOpsActions?.addEventListener("click", createLaunchOpsActions);
  nodes.exportCustomerTrialJson?.addEventListener("click", () => exportCustomerTrialPacket("json"));
  nodes.exportCustomerTrialCsv?.addEventListener("click", () => exportCustomerTrialPacket("csv"));
  nodes.exportCustomerTrialMd?.addEventListener("click", () => exportCustomerTrialPacket("md"));
  nodes.sendCustomerTrialPacket?.addEventListener("click", sendCustomerTrialPacket);
  nodes.exportReadinessEvidenceJson?.addEventListener("click", () => exportReadinessEvidencePacket("json"));
  nodes.exportReadinessEvidenceCsv?.addEventListener("click", () => exportReadinessEvidencePacket("csv"));
  nodes.exportPilotHandoffJson?.addEventListener("click", () => exportPilotHandoffReport("json"));
  nodes.exportPilotHandoffCsv?.addEventListener("click", () => exportPilotHandoffReport("csv"));
  nodes.exportPilotRenewalJson?.addEventListener("click", () => exportPilotRenewalReview("json"));
  nodes.exportPilotRenewalCsv?.addEventListener("click", () => exportPilotRenewalReview("csv"));
  nodes.exportPilotRenewalMd?.addEventListener("click", () => exportPilotRenewalReview("md"));
  nodes.exportPilotExpansionJson?.addEventListener("click", () => exportPilotExpansionLaunchChecklist("json"));
  nodes.exportPilotExpansionCsv?.addEventListener("click", () => exportPilotExpansionLaunchChecklist("csv"));
  nodes.exportPilotExpansionMd?.addEventListener("click", () => exportPilotExpansionLaunchChecklist("md"));
  nodes.exportNextStepEngagementJson?.addEventListener("click", () => exportNextStepEngagementReport("json"));
  nodes.exportNextStepEngagementCsv?.addEventListener("click", () => exportNextStepEngagementReport("csv"));
  nodes.exportNextStepEngagementMd?.addEventListener("click", () => exportNextStepEngagementReport("md"));
  nodes.savePilotExpansionLaunchBrief?.addEventListener("click", savePilotExpansionLaunchBrief);
  nodes.createPilotRenewalBrief?.addEventListener("click", createPilotRenewalBrief);
  nodes.savePilotExpansionPlan?.addEventListener("click", savePilotExpansionPlan);
  nodes.createPilotSuccessActions?.addEventListener("click", createPilotSuccessActions);
  nodes.buyCoachReviewAddon?.addEventListener("click", buyCoachReviewAddon);
  nodes.cancelSubscription?.addEventListener("click", cancelSubscription);
  nodes.requestRefund?.addEventListener("click", requestRefundReview);
  nodes.acknowledgeCompliance?.addEventListener("click", acknowledgeCompliance);
  document.querySelectorAll("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => checkout(button.dataset.plan));
  });
  nodes.orderLog?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-billing-event]");
    if (!button) return;
    simulateBillingEvent(button.dataset.billingEvent, button.dataset.orderId);
  });
  nodes.reviewQueue?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-action]");
    if (!button) return;
    processDeletionRequest(button.dataset.requestId, button.dataset.deleteAction);
  });
  nodes.educationModelRunList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-education-model-review]");
    if (!button) return;
    reviewEducationModelRun(button.dataset.runId, button.dataset.educationModelReview);
  });
  nodes.scenarioReviewList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scenario-review]");
    if (!button) return;
    reviewScenario(button.dataset.scenarioId, button.dataset.scenarioReview);
  });
  nodes.adminUserList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button) return;
    updateAdminUser(button.dataset.userId, button.dataset.userAction, button.dataset.nextRole);
  });
  nodes.loginDemo?.addEventListener("click", startFriendTrial);
  nodes.friendStartLogin?.addEventListener("click", startFriendTrial);
  nodes.friendCheckProvider?.addEventListener("click", refreshFriendProviderStatus);
  nodes.friendSubmitFeedback?.addEventListener("click", submitFriendTrialFeedback);
  nodes.logoutDemo?.addEventListener("click", logout);
  nodes.loginSubmit?.addEventListener("click", () => login(nodes.loginEmail.value, nodes.loginPassword.value));
  nodes.registerSubmit?.addEventListener("click", registerAccount);
  nodes.verifyEmailSubmit?.addEventListener("click", verifyEmail);
  nodes.resetRequest?.addEventListener("click", requestPasswordReset);
  nodes.resetConfirm?.addEventListener("click", confirmPasswordReset);
  nodes.exportAccountData?.addEventListener("click", exportAccountData);
  nodes.requestAccountDeletion?.addEventListener("click", requestAccountDeletion);
  nodes.createContentSource?.addEventListener("click", createContentSource);
  nodes.createChartScreenshotIntake?.addEventListener("click", createChartScreenshotIntake);
  nodes.processContentSource?.addEventListener("click", () => processContentSource());
  nodes.runContentPipelineDemo?.addEventListener("click", runContentPipelineDemo);
  nodes.refreshContentSources?.addEventListener("click", refreshContentSources);
  nodes.refreshContentJobs?.addEventListener("click", refreshContentJobs);
  nodes.contentJobList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-content-job-review]");
    if (!button) return;
    reviewContentJobItem(button.dataset.jobId, button.dataset.contentJobReview, button.dataset.itemId);
  });
  nodes.contentSourceList?.addEventListener("click", (event) => {
    const reviewButton = event.target.closest("[data-content-source-review]");
    if (reviewButton) {
      reviewContentSource(reviewButton.dataset.contentSourceReviewId, reviewButton.dataset.contentSourceReview);
      return;
    }
    const alignButton = event.target.closest("[data-content-align-id]");
    if (alignButton) {
      addContentAlignmentEvidence(alignButton.dataset.contentAlignId);
      return;
    }
    const releasePacketButton = event.target.closest("[data-content-release-packet]");
    if (releasePacketButton) {
      exportContentSourceReleasePacket(releasePacketButton.dataset.contentReleasePacketId, releasePacketButton.dataset.contentReleasePacket);
      return;
    }
    const chartReviewButton = event.target.closest("[data-chart-screenshot-review]");
    if (chartReviewButton) {
      reviewChartScreenshotIntake(chartReviewButton.dataset.chartScreenshotReviewId, chartReviewButton.dataset.chartScreenshotReview);
      return;
    }
    const chartSubmitButton = event.target.closest("[data-chart-screenshot-submit-scenario]");
    if (chartSubmitButton) {
      submitChartScreenshotScenario(chartSubmitButton.dataset.chartScreenshotSubmitScenario);
      return;
    }
    const chartPackageButton = event.target.closest("[data-chart-screenshot-create-package]");
    if (chartPackageButton) {
      createChartScreenshotCoursePackage(chartPackageButton.dataset.chartScreenshotCreatePackage);
      return;
    }
    const chartPublishAssignButton = event.target.closest("[data-chart-screenshot-publish-assign]");
    if (chartPublishAssignButton) {
      publishAndAssignChartScreenshotPackage(chartPublishAssignButton.dataset.chartScreenshotPublishAssign);
      return;
    }
    const chartEvidenceFollowupButton = event.target.closest("[data-chart-screenshot-evidence-followup]");
    if (chartEvidenceFollowupButton) {
      createChartScreenshotEvidenceFollowup(chartEvidenceFollowupButton.dataset.chartScreenshotEvidenceFollowup);
      return;
    }
    const processButton = event.target.closest("[data-content-process-id]");
    if (processButton) {
      processContentSource(processButton.dataset.contentProcessId);
      return;
    }
    const button = event.target.closest("[data-content-source-id]");
    if (!button) return;
    selectContentSource(button.dataset.contentSourceId);
  });
  nodes.distillKnowledge?.addEventListener("click", distillKnowledge);
  nodes.refreshCoursePackages?.addEventListener("click", refreshCoursePackages);
  nodes.createCoursePackage?.addEventListener("click", createCoursePackage);
  nodes.coursePackageList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-course-package-action]");
    if (!button) return;
    if (button.dataset.coursePackageAction === "publish") publishCoursePackage(button.dataset.coursePackageId);
  });
  nodes.generateScenarioDraft?.addEventListener("click", generateScenarioDraft);
  nodes.publishScenario?.addEventListener("click", publishScenario);
}

async function boot() {
  bindEvents();
  setView("dashboard");
  try {
    await ensureTrialAccess();
  } catch (error) {
    nodes.viewTitle.textContent = "Service not started";
    document.querySelector(".hero-panel h3").textContent = "Start the SaaS service with npm.cmd start";
    document.querySelector(".hero-panel p").textContent = error.message;
  }
}

boot();







