export interface RFPRequirement {
  id: string;
  description: string;
  section_slug: string;
  is_mandatory: boolean;
  auto_filled: boolean;
  source_text?: string;
}

export interface ParsedRFP {
  client_name: string;
  client_address: string;
  project_name: string;
  deadline: string | null;
  requirements: RFPRequirement[];
  suggested_sections: string[];
  suggested_library_items: Record<string, string>;
  suggested_team: string[];
  suggested_references: string[];
  suggested_case_studies: string[];
}

export interface QualityCheckIssue {
  id: string;
  type: "missing_content" | "inconsistency" | "formatting" | "incomplete" | "generic";
  severity: "warning" | "suggestion";
  section_slug: string;
  section_name: string;
  message: string;
  suggestion: string;
}

export interface PolishSuggestion {
  id: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface LanguageSuggestion {
  id: string;
  section_slug: string;
  section_name: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface ExecutionStrategyData {
  project_duration: string;
  phases: Array<{
    name: string;
    duration: string;
    description: string;
    milestones: string[];
  }>;
  critical_path: string[];
  approach_narrative: string;
}

export interface ExecSummary {
  paragraph_one: string;
  paragraph_two: string;
  full_html: string;
}

export interface SimilarProposal {
  id: string;
  title: string;
  client_name: string;
  similarity_reason: string;
  score: number;
}

export interface GeneratedSectionContent {
  introduction?: { body: string };
  firm_background?: { narrative: string };
  site_logistics?: { body: string };
  qaqc_commissioning?: {
    quality_assurance: string;
    quality_control: string;
    commissioning: string;
  };
  closeout?: { body: string };
  executive_summary?: { body: string };
}

export interface RequirementMapping {
  req_id: string;
  section_slug: string;
  field: string;
  req_type: "addressed" | "needs_input";
  note: string;
}

export interface ContentGap {
  section_slug: string;
  field: string;
  reason: string;
  requirement_ids: string[];
}

export interface PopulateResponse {
  success: boolean;
  sections_populated: string[];
  content_gaps: ContentGap[];
  team_added: number;
  references_added: number;
  case_studies_added: number;
}
