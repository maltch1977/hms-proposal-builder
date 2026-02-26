import { Document, View, Text } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";
import { CoverPagePdf } from "./cover-page-pdf";
import { SectionPage } from "./section-page";
import { TocPdf } from "./toc-pdf";
import { HtmlContent } from "./html-to-pdf";
import { KeyPersonnelPdf } from "./key-personnel-pdf";
import { EmrTablePdf } from "./emr-table-pdf";
import { ProjectCostPdf } from "./project-cost-pdf";
import { ReferencePdf } from "./reference-pdf";
import { ExecutionStrategyPdf } from "./execution-strategy-pdf";
import type { Json } from "@/lib/types/database";
import type { PricingColumn, PricingRow } from "@/lib/types/section";

// Types for the assembled proposal data
interface SectionData {
  slug: string;
  displayName: string;
  content: Record<string, unknown>;
  isEnabled: boolean;
}

interface PersonnelEntry {
  fullName: string;
  title: string;
  roleType: string;
  yearsIndustry: number | null;
  yearsCompany: number | null;
  yearsWithDistech: number | null;
  taskDescription: string | null;
  specialties: string[];
  certifications: string[];
  bio: string | null;
}

interface CaseStudyEntry {
  projectName: string;
  clientName: string;
  buildingType: string;
  squareFootage: number | null;
  narrative: string | null;
}

interface ReferenceEntry {
  contactName: string;
  title: string;
  company: string;
  phone: string;
  email: string | null;
  category: string;
}

interface EmrEntry {
  year: number;
  rating: number;
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
}

interface ProposalDocumentProps {
  data: ProposalDocumentData;
}

export function ProposalDocument({ data }: ProposalDocumentProps) {
  const enabledSections = data.sections.filter((s) => s.isEnabled);
  const pageProps = {
    logoUrl: data.logoUrl,
    clientName: data.clientName,
    projectLabel: data.projectLabel || "RESPONSE TO RFP",
    footerText: data.footerText,
    companyName: data.companyName,
  };

  // TOC entries from enabled sections (excluding cover + toc itself)
  const tocEntries = enabledSections
    .filter((s) => s.slug !== "cover_page" && s.slug !== "table_of_contents")
    .map((s) => ({ title: s.displayName }));

  return (
    <Document
      title={data.title}
      author={data.companyName || "HMS Commercial Service, Inc."}
      subject={`Proposal for ${data.clientName}`}
    >
      {/* Cover Page */}
      {enabledSections.some((s) => s.slug === "cover_page") && (
        <CoverPagePdf
          title={data.title}
          clientName={data.clientName}
          clientAddress={data.clientAddress}
          projectLabel={data.projectLabel}
          coverTemplate={data.coverTemplate}
          coverPhotoUrl={data.coverPhotoUrl}
          logoUrl={data.logoUrl}
          companyName={data.companyName}
          companyAddress={data.companyAddress}
          companyPhone={data.companyPhone}
          companyEmail={data.companyEmail}
          companyWebsite={data.companyWebsite}
        />
      )}

      {/* Render remaining sections in order */}
      {enabledSections
        .filter((s) => s.slug !== "cover_page")
        .map((section) => {
          switch (section.slug) {
            case "table_of_contents":
              return (
                <SectionPage key={section.slug} title="Table of Contents" {...pageProps}>
                  <TocPdf entries={tocEntries} />
                </SectionPage>
              );

            case "introduction":
              return (
                <SectionPage key={section.slug} title="Introduction" {...pageProps}>
                  <HtmlContent html={(section.content.body as string) || ""} />
                </SectionPage>
              );

            case "firm_background":
              return (
                <SectionPage key={section.slug} title="Firm Background & Experience" {...pageProps}>
                  <HtmlContent html={(section.content.narrative as string) || ""} />
                  {data.caseStudies.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={baseStyles.sectionSubtitle}>Case Studies</Text>
                      {data.caseStudies.map((cs, idx) => (
                        <View
                          key={idx}
                          style={{
                            marginBottom: 10,
                            padding: 8,
                            borderWidth: 0.5,
                            borderColor: COLORS.mediumGray,
                            borderRadius: 2,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.navy }}>
                            {cs.projectName}
                          </Text>
                          <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 2 }}>
                            {cs.clientName} — {cs.buildingType}
                            {cs.squareFootage ? ` — ${cs.squareFootage.toLocaleString()} SF` : ""}
                          </Text>
                          {cs.narrative && (
                            <Text style={{ fontSize: 9, marginTop: 4, lineHeight: 1.5 }}>
                              {cs.narrative}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </SectionPage>
              );

            case "key_personnel":
              return (
                <SectionPage key={section.slug} title="Key Personnel & Org Chart" {...pageProps}>
                  <KeyPersonnelPdf
                    personnel={data.personnel}
                    orgChartImageUrl={
                      (section.content.org_chart_mode || "upload") === "upload"
                        ? (section.content.org_chart_image as string | undefined)
                        : undefined
                    }
                  />
                </SectionPage>
              );

            case "executive_summary":
              return (
                <SectionPage key={section.slug} title="Executive Summary" {...pageProps}>
                  <HtmlContent html={(section.content.body as string) || ""} />
                </SectionPage>
              );

            case "project_schedule": {
              const outputMode = (section.content.output_mode as string) || "raw";
              const strategy = section.content.execution_strategy as {
                project_duration?: string;
                phases?: Array<{ name: string; duration: string; description: string; milestones: string[] }>;
                critical_path?: string[];
                approach_narrative?: string;
              } | undefined;
              const showGantt = outputMode === "raw" || outputMode === "both";
              const showStrategy = (outputMode === "ai_only" || outputMode === "both") && strategy;

              return (
                <SectionPage key={section.slug} title="Project Schedule" {...pageProps}>
                  {showGantt && <HtmlContent html="See attached Gantt chart(s)." />}
                  {showStrategy && (
                    <ExecutionStrategyPdf
                      projectDuration={strategy.project_duration}
                      phases={strategy.phases}
                      criticalPath={strategy.critical_path}
                      approachNarrative={strategy.approach_narrative}
                    />
                  )}
                </SectionPage>
              );
            }

            case "site_logistics":
              return (
                <SectionPage key={section.slug} title="Site Logistics & Safety" {...pageProps}>
                  <HtmlContent html={(section.content.body as string) || ""} />
                  <EmrTablePdf ratings={data.emrRatings} />
                </SectionPage>
              );

            case "qaqc_commissioning":
              return (
                <SectionPage key={section.slug} title="QA/QC/Commissioning" {...pageProps}>
                  <HtmlContent html={(section.content.quality_assurance as string) || ""} />
                  <HtmlContent html={(section.content.quality_control as string) || ""} />
                  <HtmlContent html={(section.content.commissioning as string) || ""} />
                </SectionPage>
              );

            case "closeout":
              return (
                <SectionPage key={section.slug} title="Closeout" {...pageProps}>
                  <HtmlContent html={(section.content.body as string) || ""} />
                </SectionPage>
              );

            case "reference_check":
              return (
                <SectionPage key={section.slug} title="Reference Check" {...pageProps}>
                  <ReferencePdf references={data.references} />
                </SectionPage>
              );

            case "interview_panel":
              return (
                <SectionPage key={section.slug} title="Interview Panel" {...pageProps}>
                  <KeyPersonnelPdf personnel={data.personnel} />
                </SectionPage>
              );


            case "project_cost":
              return (
                <SectionPage key={section.slug} title="Project Cost" {...pageProps}>
                  <ProjectCostPdf
                    columns={data.costData.columns}
                    rows={data.costData.rows}
                    notes={data.costData.notes}
                  />
                </SectionPage>
              );

            default:
              return null;
          }
        })}
    </Document>
  );
}
