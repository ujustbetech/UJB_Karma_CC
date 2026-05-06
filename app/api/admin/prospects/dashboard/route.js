import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { adminDb, getFirebaseAdminInitError } from "@/lib/firebase/firebaseAdmin";
import { publicEnv } from "@/lib/config/publicEnv";
import { deriveProspectStage } from "@/lib/prospectAutomation/service.mjs";

const TODO_COLLECTION = "TODO";
const AUTOMATION_ISSUES_COLLECTION = "prospect_automation_issues";
const OPEN_TODO_STATUSES = new Set(["Pending", "In Progress"]);

function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") {
    const v = value.toDate();
    return v instanceof Date && !Number.isNaN(v.getTime()) ? v : null;
  }
  if (typeof value?.seconds === "number") {
    const v = new Date(value.seconds * 1000);
    return Number.isNaN(v.getTime()) ? null : v;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toIsoDate(value) {
  const date = toDate(value);
  if (!date) return "";
  return startOfDay(date).toISOString().slice(0, 10);
}

function dateDiffDays(fromDate, toDateValue = new Date()) {
  const from = startOfDay(fromDate);
  const to = startOfDay(toDateValue);
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function parseDateRangeDays(value) {
  const normalized = normalize(value).toLowerCase();
  if (normalized === "30d") return 30;
  if (normalized === "90d") return 90;
  return null;
}

function getProspectDateReference(prospect = {}) {
  return (
    toDate(prospect.createdAt) ||
    toDate(prospect.updatedAt) ||
    toDate(prospect.lastEngagementDate) ||
    toDate(prospect.feedbackFormTriggeredAt)
  );
}

function mapAuthenticChoiceBucket(status) {
  const normalized = normalize(status).toLowerCase();
  if (normalized === "choose to enroll") return "Choose to Enroll";
  if (normalized === "need some time") return "Need Some Time";
  if (normalized.startsWith("decline")) return "Declined";
  if (normalized === "awaiting response") return "Awaiting Response";
  return "Not Decided";
}

function getEnrollmentRowStatus(prospect = {}, label) {
  const rows = Array.isArray(prospect.enrollmentStages) ? prospect.enrollmentStages : [];
  const row = rows.find((item) => normalize(item?.label) === normalize(label));
  return normalize(row?.status);
}

function getLatestNeedTimeDate(prospect = {}) {
  const logs = Array.isArray(prospect.authenticChoiceLogs) ? prospect.authenticChoiceLogs : [];
  const entry = [...logs]
    .reverse()
    .find((log) => normalize(log?.status).toLowerCase() === "need some time");
  return toDate(entry?.clickedAt) || toDate(prospect.updatedAt) || toDate(prospect.lastEngagementDate);
}

function shouldIncludeByDateRange(dateValue, cutoffDate) {
  if (!cutoffDate) return true;
  if (!dateValue) return true;
  return dateValue >= cutoffDate;
}

function buildMetricDefinitions() {
  return {
    total_active_prospects: {
      title: "Total Active Prospects",
      laymanMeaning:
        "This is the number of prospects currently in progress and not archived.",
      formula: "Count of prospects where record status is Active.",
      includedData: "Prospect records with active lifecycle.",
      excludedData: "Archived or converted records.",
    },
    open_todos: {
      title: "Open Follow-up Tasks",
      laymanMeaning:
        "This shows how many follow-up tasks are still pending or currently being worked on.",
      formula: "Count of TODO items with status Pending or In Progress.",
      includedData: "Prospect-linked TODO records in open states.",
      excludedData: "Done tasks.",
    },
    overdue_todos: {
      title: "Overdue Follow-ups",
      laymanMeaning:
        "These are tasks whose follow-up date has already passed and still need action.",
      formula: "Open TODO count where follow-up date is before today.",
      includedData: "Open TODOs with valid follow-up dates.",
      excludedData: "Future-dated or completed tasks.",
    },
    due_today_todos: {
      title: "Due Today",
      laymanMeaning:
        "This shows tasks that should be completed today so we stay on schedule.",
      formula: "Open TODO count where follow-up date equals today.",
      includedData: "Open TODOs due on current date.",
      excludedData: "Overdue, future, or completed tasks.",
    },
    choose_to_enroll_rate: {
      title: "Choose to Enroll Rate",
      laymanMeaning:
        "This indicates how many active prospects have said yes to join the journey.",
      formula: "Choose to Enroll prospects divided by active prospects.",
      includedData: "Active prospects with authentic-choice status.",
      excludedData: "Archived records.",
    },
    need_some_time_rate: {
      title: "Need Some Time Rate",
      laymanMeaning:
        "This shows the share of prospects who are interested but still deciding.",
      formula: "Need Some Time prospects divided by active prospects.",
      includedData: "Active prospects with Need Some Time status.",
      excludedData: "Archived records.",
    },
    declined_rate: {
      title: "Declined Rate",
      laymanMeaning:
        "This is the percentage of active prospects who declined to continue.",
      formula: "Declined prospects divided by active prospects.",
      includedData: "Active prospects with decline statuses.",
      excludedData: "Archived records.",
    },
    fee_option_upfront_share: {
      title: "Upfront Fee Option Share",
      laymanMeaning:
        "This tells how many fee decisions are choosing direct upfront payment.",
      formula: "Upfront payment selected divided by total fee-option decisions.",
      includedData: "Enrollment fee option statuses.",
      excludedData: "Prospects without fee-option status.",
    },
    auto_todos_created: {
      title: "Automation TODOs",
      laymanMeaning:
        "This shows tasks automatically created by the system for follow-ups.",
      formula: "Count of TODO items marked with automation source.",
      includedData: "TODO records where automation_source is present.",
      excludedData: "Manually created TODOs.",
    },
    skipped_missing_ops: {
      title: "Skipped: Missing OPS",
      laymanMeaning:
        "These are automation follow-ups that could not be assigned because OPS owner was missing.",
      formula: "Count of open automation issues of type missing OPS assignment.",
      includedData: "Prospect automation issue records.",
      excludedData: "Resolved or unrelated issues.",
    },
    open_automation_issues: {
      title: "Open Automation Issues",
      laymanMeaning:
        "This tracks unresolved system follow-up exceptions that need admin attention.",
      formula: "Count of automation issue records with status open.",
      includedData: "All open automation issue records.",
      excludedData: "Closed issues.",
    },
    no_recent_engagement: {
      title: "No Recent Engagement (8+ days)",
      laymanMeaning:
        "These prospects have not had a recent engagement update and may need immediate outreach.",
      formula: "Count of active prospects with last engagement older than 7 days or missing.",
      includedData: "Active prospects and last engagement date.",
      excludedData: "Archived records.",
    },
    chart_stage_distribution: {
      title: "Stage Distribution",
      laymanMeaning:
        "This chart shows how prospects are spread across the journey stages right now.",
      formula: "Count of active prospects by derived journey stage.",
      includedData: "Active prospects and stage derivation logic.",
      excludedData: "Archived records.",
    },
    chart_authentic_choice_outcomes: {
      title: "Authentic Choice Outcomes",
      laymanMeaning:
        "This chart shows the latest decision status breakdown of active prospects.",
      formula: "Count of active prospects by authentic-choice outcome bucket.",
      includedData: "Active prospects and authentic-choice status.",
      excludedData: "Archived records.",
    },
    chart_fee_option_split: {
      title: "Fee Option Split",
      laymanMeaning:
        "This chart compares how prospects are choosing fee payment options.",
      formula: "Count of active prospects by enrollment fee option status.",
      includedData: "Enrollment fee option row in enrollment stages.",
      excludedData: "Archived records.",
    },
    chart_aging_buckets: {
      title: "Engagement Aging Buckets",
      laymanMeaning:
        "This chart groups prospects by how long it has been since their last engagement.",
      formula: "Count active prospects by days since last engagement (0-2, 3-7, 8+).",
      includedData: "Active prospects with last engagement dates.",
      excludedData: "Archived records.",
    },
  };
}

function buildOpsOptions(prospects = []) {
  const map = new Map();
  for (const prospect of prospects) {
    const email = normalize(prospect.assignedOpsEmail).toLowerCase();
    if (!email) continue;
    map.set(email, {
      value: email,
      label: normalize(prospect.assignedOpsName) || email,
    });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function buildStatusOptions(prospects = []) {
  const set = new Set();
  for (const prospect of prospects) {
    const value = normalize(prospect.status);
    if (value) set.add(value);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function GET(req) {
  try {
    if (getFirebaseAdminInitError() || !adminDb) {
      return NextResponse.json(
        { message: "Admin Firebase access is not configured." },
        { status: 500 }
      );
    }

    const auth = requireAdminSession(req, hasAdminAccess);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const opsEmailFilter = normalize(req.nextUrl.searchParams.get("opsEmail")).toLowerCase();
    const statusFilter = normalize(req.nextUrl.searchParams.get("status"));
    const dateRange = normalize(req.nextUrl.searchParams.get("dateRange")) || "all-time";
    const now = new Date();
    const dateRangeDays = parseDateRangeDays(dateRange);
    const cutoffDate = dateRangeDays ? new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000) : null;

    const [prospectSnap, todoSnap, issueSnap] = await Promise.all([
      adminDb.collection(publicEnv.collections.prospect).get(),
      adminDb.collection(TODO_COLLECTION).get(),
      adminDb.collection(AUTOMATION_ISSUES_COLLECTION).get().catch(() => ({ docs: [] })),
    ]);

    const allProspects = prospectSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
    const opsOptions = buildOpsOptions(allProspects);
    const statusOptions = buildStatusOptions(allProspects);

    const filteredProspects = allProspects.filter((prospect) => {
      const assignedOpsEmail = normalize(prospect.assignedOpsEmail).toLowerCase();
      const status = normalize(prospect.status);
      const referenceDate = getProspectDateReference(prospect);

      if (opsEmailFilter && assignedOpsEmail !== opsEmailFilter) return false;
      if (statusFilter && normalize(status).toLowerCase() !== normalize(statusFilter).toLowerCase()) {
        return false;
      }
      if (!shouldIncludeByDateRange(referenceDate, cutoffDate)) return false;
      return true;
    });

    const visibleProspectIds = new Set(filteredProspects.map((prospect) => prospect.id));
    const activeProspects = filteredProspects.filter(
      (prospect) => normalize(prospect.recordStatus || prospect.lifecycleStatus) !== "Archive"
    );

    const todos = todoSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
      .filter((todo) => {
        const prospectId = normalize(todo.prospect_id);
        if (!prospectId || !visibleProspectIds.has(prospectId)) return false;
        if (normalize(todo.user_type).toLowerCase() !== "prospect") return false;
        const followUpDate = toDate(todo.follow_up_date);
        if (!shouldIncludeByDateRange(followUpDate, cutoffDate)) return false;
        return true;
      });

    const issues = (issueSnap.docs || [])
      .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
      .filter((issue) => {
        const prospectId = normalize(issue.prospect_id);
        if (!prospectId || !visibleProspectIds.has(prospectId)) return false;
        const createdAt = toDate(issue.created_at);
        if (!shouldIncludeByDateRange(createdAt, cutoffDate)) return false;
        return true;
      });

    const stageCountsMap = new Map();
    for (const prospect of activeProspects) {
      const stage = deriveProspectStage(prospect);
      stageCountsMap.set(stage, (stageCountsMap.get(stage) || 0) + 1);
    }
    const stageDistribution = [...stageCountsMap.entries()].map(([label, value]) => ({ label, value }));

    const authenticChoiceMap = new Map();
    for (const prospect of activeProspects) {
      const bucket = mapAuthenticChoiceBucket(prospect.status);
      authenticChoiceMap.set(bucket, (authenticChoiceMap.get(bucket) || 0) + 1);
    }
    const authenticChoiceOutcomes = [...authenticChoiceMap.entries()].map(([label, value]) => ({ label, value }));

    const feeOptionMap = new Map();
    for (const prospect of activeProspects) {
      const status = getEnrollmentRowStatus(prospect, "Enrollment fees Option Opted for") || "Option pending";
      feeOptionMap.set(status, (feeOptionMap.get(status) || 0) + 1);
    }
    const feeOptionSplit = [...feeOptionMap.entries()].map(([label, value]) => ({ label, value }));

    const agingMap = new Map([
      ["0-2 days", 0],
      ["3-7 days", 0],
      ["8+ days", 0],
      ["No engagement", 0],
    ]);
    for (const prospect of activeProspects) {
      const engagementDate = toDate(prospect.lastEngagementDate);
      if (!engagementDate) {
        agingMap.set("No engagement", (agingMap.get("No engagement") || 0) + 1);
        continue;
      }
      const days = dateDiffDays(engagementDate, now);
      if (days <= 2) agingMap.set("0-2 days", (agingMap.get("0-2 days") || 0) + 1);
      else if (days <= 7) agingMap.set("3-7 days", (agingMap.get("3-7 days") || 0) + 1);
      else agingMap.set("8+ days", (agingMap.get("8+ days") || 0) + 1);
    }
    const agingBuckets = [...agingMap.entries()].map(([label, value]) => ({ label, value }));

    const openTodos = todos.filter((todo) => OPEN_TODO_STATUSES.has(normalize(todo.status)));
    const todayIso = startOfDay(now).toISOString().slice(0, 10);
    const overdueTodos = openTodos.filter((todo) => {
      const date = toIsoDate(todo.follow_up_date);
      return date && date < todayIso;
    });
    const dueTodayTodos = openTodos.filter((todo) => toIsoDate(todo.follow_up_date) === todayIso);

    const chooseCount = activeProspects.filter(
      (prospect) => normalize(prospect.status).toLowerCase() === "choose to enroll"
    ).length;
    const needTimeCount = activeProspects.filter(
      (prospect) => normalize(prospect.status).toLowerCase() === "need some time"
    ).length;
    const declinedCount = activeProspects.filter((prospect) =>
      normalize(prospect.status).toLowerCase().startsWith("decline")
    ).length;

    const feeUpfrontCount = feeOptionSplit.find(
      (item) => normalize(item.label).toLowerCase() === "upfront payment selected"
    )?.value || 0;
    const totalFeeChoiceCount = feeOptionSplit.reduce((sum, item) => sum + Number(item.value || 0), 0);

    const openAutomationIssues = issues.filter(
      (issue) => normalize(issue.status).toLowerCase() === "open"
    );
    const missingOpsIssueCount = openAutomationIssues.filter(
      (issue) => normalize(issue.issue_type).toLowerCase() === "missing_ops_assignment"
    ).length;
    const autoTodosCount = todos.filter(
      (todo) => normalize(todo.automation_source) === "prospect_automation"
    ).length;

    const noRecentEngagementCount = activeProspects.filter((prospect) => {
      const date = toDate(prospect.lastEngagementDate);
      if (!date) return true;
      return dateDiffDays(date, now) > 7;
    }).length;

    const needSomeTimeFollowups = activeProspects
      .filter((prospect) => normalize(prospect.status).toLowerCase() === "need some time")
      .map((prospect) => {
        const latestNeedTimeDate = getLatestNeedTimeDate(prospect);
        return {
          prospectId: prospect.id,
          prospectName: normalize(prospect.prospectName) || "Prospect",
          assignedOpsName: normalize(prospect.assignedOpsName) || "-",
          assignedOpsEmail: normalize(prospect.assignedOpsEmail) || "-",
          status: normalize(prospect.status) || "-",
          lastNeedTimeAt: latestNeedTimeDate ? latestNeedTimeDate.toISOString() : null,
          daysSinceNeedTime: latestNeedTimeDate ? dateDiffDays(latestNeedTimeDate, now) : null,
        };
      })
      .sort((a, b) => (b.daysSinceNeedTime || 0) - (a.daysSinceNeedTime || 0));

    const feeMailSentNoOption = activeProspects
      .filter((prospect) => {
        const feeMailStatus = getEnrollmentRowStatus(prospect, "Enrollment Fees Mail Status");
        const feeOptionStatus = getEnrollmentRowStatus(prospect, "Enrollment fees Option Opted for");
        const optionNormalized = normalize(feeOptionStatus).toLowerCase();
        const hasSelectedOption =
          optionNormalized === "upfront payment selected" || optionNormalized === "adjustment selected";
        return normalize(feeMailStatus).toLowerCase() === "fee mail sent" && !hasSelectedOption;
      })
      .map((prospect) => ({
        prospectId: prospect.id,
        prospectName: normalize(prospect.prospectName) || "Prospect",
        assignedOpsName: normalize(prospect.assignedOpsName) || "-",
        assignedOpsEmail: normalize(prospect.assignedOpsEmail) || "-",
        feeMailStatus: getEnrollmentRowStatus(prospect, "Enrollment Fees Mail Status") || "-",
        feeOptionStatus: getEnrollmentRowStatus(prospect, "Enrollment fees Option Opted for") || "Option pending",
      }));

    const missingOpsAssignmentIssues = openAutomationIssues
      .filter((issue) => normalize(issue.issue_type).toLowerCase() === "missing_ops_assignment")
      .map((issue) => ({
        issueId: issue.id,
        prospectId: normalize(issue.prospect_id),
        prospectName: normalize(issue.prospect_name) || "Prospect",
        ruleKey: normalize(issue.rule_key) || "-",
        message: normalize(issue.message) || "-",
        createdAt: toDate(issue.created_at)?.toISOString() || null,
      }));

    const metricDefinitions = buildMetricDefinitions();
    const safeRate = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return NextResponse.json({
      filters: {
        selected: {
          opsEmail: opsEmailFilter,
          status: statusFilter,
          dateRange,
        },
        options: {
          ops: opsOptions,
          status: statusOptions,
          dateRange: [
            { value: "all-time", label: "All-time" },
            { value: "30d", label: "Last 30 days" },
            { value: "90d", label: "Last 90 days" },
          ],
        },
      },
      kpis: [
        { id: "total_active_prospects", title: "Active Prospects", value: activeProspects.length },
        { id: "open_todos", title: "Open TODOs", value: openTodos.length },
        { id: "overdue_todos", title: "Overdue TODOs", value: overdueTodos.length },
        { id: "due_today_todos", title: "Due Today", value: dueTodayTodos.length },
        { id: "choose_to_enroll_rate", title: "Choose to Enroll", value: `${safeRate(chooseCount, activeProspects.length)}%` },
        { id: "need_some_time_rate", title: "Need Some Time", value: `${safeRate(needTimeCount, activeProspects.length)}%` },
        { id: "declined_rate", title: "Declined", value: `${safeRate(declinedCount, activeProspects.length)}%` },
        { id: "fee_option_upfront_share", title: "Upfront Fee Share", value: `${safeRate(feeUpfrontCount, totalFeeChoiceCount)}%` },
        { id: "auto_todos_created", title: "Automation TODOs", value: autoTodosCount },
        { id: "skipped_missing_ops", title: "Skipped: Missing OPS", value: missingOpsIssueCount },
        { id: "open_automation_issues", title: "Open Automation Issues", value: openAutomationIssues.length },
        { id: "no_recent_engagement", title: "No Recent Engagement", value: noRecentEngagementCount },
      ],
      charts: [
        { id: "chart_stage_distribution", title: "Stage Distribution", type: "bar", data: stageDistribution },
        { id: "chart_authentic_choice_outcomes", title: "Authentic Choice Outcomes", type: "pie", data: authenticChoiceOutcomes },
        { id: "chart_fee_option_split", title: "Fee Option Split", type: "pie", data: feeOptionSplit },
        { id: "chart_aging_buckets", title: "Engagement Aging Buckets", type: "bar", data: agingBuckets },
      ],
      actionTables: {
        overdueFollowups: overdueTodos
          .map((todo) => ({
            todoId: todo.id,
            prospectId: normalize(todo.prospect_id),
            linkedName: normalize(todo.linked_name) || "Prospect",
            assignToName: normalize(todo.assign_to_name) || "-",
            assignTo: normalize(todo.assign_to) || "-",
            followUpDate: toIsoDate(todo.follow_up_date) || "-",
            purpose: normalize(todo.purpose) || "-",
            discussion: normalize(todo.discussion_details) || "-",
            status: normalize(todo.status) || "-",
          }))
          .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)),
        needSomeTimeFollowups,
        feeMailSentNoOption,
        missingOpsAssignmentIssues,
      },
      metricDefinitions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Prospect dashboard API error:", error);
    return NextResponse.json({ message: "Failed to load prospect dashboard" }, { status: 500 });
  }
}
