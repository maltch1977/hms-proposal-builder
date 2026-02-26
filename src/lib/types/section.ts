// Section-specific content type definitions
// Each section type stores its content as JSONB — these define the expected shapes

export interface CoverPageContent {
  client_name?: string;
  client_address?: string;
  project_label?: string;
  cover_template?: "photo" | "no_photo";
  cover_photo_url?: string;
}

export interface IntroductionContent {
  body?: string; // HTML from TipTap
}

export interface FirmBackgroundContent {
  narrative?: string; // HTML from TipTap
  // Case studies are stored in proposal_case_studies junction table
}

export interface KeyPersonnelContent {
  // Team members stored in proposal_team_members junction table
  // Org chart positions stored in hierarchy_position on each member
  org_chart_image?: string; // URL to a custom org chart image
  requirement_responses?: Record<string, string>;
  member_bios?: Record<string, string>; // personnel_id → HTML bio narrative
}

export interface ProjectScheduleContent {
  files?: Array<{
    url: string;
    path: string;
    filename: string;
    type: string;
  }>;
  output_mode?: "raw" | "ai_only" | "both";
  execution_strategy?: {
    project_duration?: string;
    phases?: Array<{
      name: string;
      duration: string;
      description: string;
      milestones: string[];
    }>;
    critical_path?: string[];
    approach_narrative?: string;
  };
  requirement_responses?: Record<string, string>;
}

export interface SiteLogisticsContent {
  body?: string; // HTML from TipTap
  emr_entries?: Array<{ year: string; rating: string }>;
}

export interface QAQCContent {
  quality_assurance?: string; // HTML
  quality_control?: string; // HTML
  commissioning?: string; // HTML
}

export interface CloseoutContent {
  body?: string; // HTML from TipTap
}

export interface ReferenceCheckContent {
  // References stored in proposal_references junction table
  requirement_responses?: Record<string, string>;
}

export interface InterviewPanelContent {
  // Auto-generated from proposal_team_members — no user input
  requirement_responses?: Record<string, string>;
}

export interface PricingRow {
  id: string;
  description: string;
  values: Record<string, string>; // column_id -> dollar amount string
}

export interface PricingColumn {
  id: string;
  name: string;
  type: "base" | "alternate" | "value_engineering";
}

export interface ProjectCostContent {
  columns?: PricingColumn[];
  rows?: PricingRow[];
  notes?: string;
  files?: Array<{
    url: string;
    path: string;
    filename: string;
    type: string;
  }>;
  requirement_responses?: Record<string, string>;
}

export interface ExecutiveSummaryContent {
  body?: string; // HTML from TipTap
}
