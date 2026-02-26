export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HMS_ADMIN: "hms_admin",
  PROPOSAL_USER: "proposal_user",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  hms_admin: "HMS Admin",
  proposal_user: "Proposal User",
};

export const PROPOSAL_STATUSES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  IN_REVIEW: "in_review",
  APPROVED: "approved",
  RETURNED: "returned",
  EXPORTED: "exported",
  ARCHIVED: "archived",
} as const;

export type ProposalStatus =
  (typeof PROPOSAL_STATUSES)[keyof typeof PROPOSAL_STATUSES];

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  returned: "Returned",
  exported: "Exported",
  archived: "Archived",
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  returned: "bg-orange-100 text-orange-700",
  exported: "bg-hms-navy/10 text-hms-navy",
  archived: "bg-gray-100 text-gray-500",
};

export const SECTION_SLUGS = {
  COVER_PAGE: "cover_page",
  INTRODUCTION: "introduction",
  TABLE_OF_CONTENTS: "table_of_contents",
  FIRM_BACKGROUND: "firm_background",
  KEY_PERSONNEL: "key_personnel",
  PROJECT_SCHEDULE: "project_schedule",
  SITE_LOGISTICS: "site_logistics",
  QAQC_COMMISSIONING: "qaqc_commissioning",
  CLOSEOUT: "closeout",
  REFERENCE_CHECK: "reference_check",
  INTERVIEW_PANEL: "interview_panel",
  PROJECT_COST: "project_cost",
  EXECUTIVE_SUMMARY: "executive_summary",
} as const;

export type SectionSlug = (typeof SECTION_SLUGS)[keyof typeof SECTION_SLUGS];

export const SECTION_DISPLAY_NAMES: Record<SectionSlug, string> = {
  cover_page: "Cover Page",
  introduction: "Introduction",
  table_of_contents: "Table of Contents",
  firm_background: "Firm Background & Experience",
  key_personnel: "Key Personnel & Org Chart",
  project_schedule: "Project Schedule",
  site_logistics: "Site Logistics & Safety",
  qaqc_commissioning: "QA/QC/Commissioning",
  closeout: "Closeout",
  reference_check: "Reference Check",
  interview_panel: "Interview Panel",
  project_cost: "Project Cost",
  executive_summary: "Executive Summary",
};

export const ROLE_TYPES = [
  "Executive",
  "Senior Project Manager",
  "Project Manager",
  "General Foreman",
  "Foreman",
  "Superintendent",
  "Engineer",
  "Programmer",
  "Technician",
  "Estimator",
  "Other",
] as const;

export type RoleType = (typeof ROLE_TYPES)[number];

export const ROLE_TYPE_HIERARCHY: Record<string, number> = {
  Executive: 1,
  "Senior Project Manager": 2,
  "Project Manager": 3,
  "General Foreman": 4,
  Foreman: 5,
  Superintendent: 6,
  Engineer: 7,
  Programmer: 8,
  Technician: 9,
  Estimator: 10,
  Other: 11,
};

export const PROJECT_TYPES = [
  "New Construction",
  "Retrofit",
  "DDC Upgrade",
  "Service Contract",
  "Design-Build",
  "Energy Management",
  "Other",
] as const;

export const BUILDING_TYPES = [
  "Hospital",
  "Laboratory",
  "Office",
  "School",
  "University",
  "Industrial",
  "Government",
  "Retail",
  "Data Center",
  "Other",
] as const;

export const REFERENCE_CATEGORIES = [
  "Owner",
  "General Contractor",
  "Mechanical Contractor",
  "Electrical Contractor",
  "Architect",
  "Engineer",
  "Other",
] as const;

export const COST_ITEM_TYPES = {
  BASE: "base",
  ADDER: "adder",
  DEDUCT: "deduct",
} as const;

export type CostItemType = (typeof COST_ITEM_TYPES)[keyof typeof COST_ITEM_TYPES];

export const LOCK_LEVELS = {
  NONE: "none",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type LockLevel = (typeof LOCK_LEVELS)[keyof typeof LOCK_LEVELS];
