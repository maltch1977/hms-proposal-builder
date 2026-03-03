import type { PricingColumn, PricingRow } from "@/lib/types/section";

export interface SectionData {
  slug: string;
  displayName: string;
  content: Record<string, unknown>;
  isEnabled: boolean;
}

export interface PersonnelEntry {
  fullName: string;
  title: string;
  roleType: string;
  yearStartedInTrade: number | null;
  yearsCompany: number | null;
  yearsWithDistech: number | null;
  taskDescription: string | null;
  specialties: string[];
  certifications: string[];
  bio: string | null;
  description?: string | null; // optional short description (Key Personnel only)
}

export interface CaseStudyEntry {
  projectName: string;
  clientName: string;
  buildingType: string;
  squareFootage: number | null;
  narrative: string | null;
  photoUrl?: string;
}

export interface ReferenceEntry {
  contactName: string;
  title: string;
  company: string;
  phone: string;
  email: string | null;
  category: string;
}

export interface EmrEntry {
  year: number;
  rating: number;
}

export interface OrgChartNode {
  id: string;
  fullName: string;
  title: string;
  parentId: string | null;
}

export interface ProposalDocumentData {
  title: string;
  clientName: string;
  clientAddress: string;
  projectLabel: string;
  coverTemplate: "photo" | "no_photo";
  coverPhotoUrl?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  footerText?: string;
  sections: SectionData[];
  personnel: PersonnelEntry[];
  caseStudies: CaseStudyEntry[];
  references: ReferenceEntry[];
  costData: { columns: PricingColumn[]; rows: PricingRow[]; notes?: string };
  emrRatings: EmrEntry[];
  qualificationsPersonnel: PersonnelEntry[];
  interviewPanelPersonnel: InterviewPanelEntry[];
  orgChartHierarchy?: OrgChartNode[];
}

export interface InterviewPanelEntry extends PersonnelEntry {
  interviewDescription?: string;
}
