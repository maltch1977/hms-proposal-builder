import { Page, View, Text } from "@react-pdf/renderer";
import { baseStyles, COLORS } from "./pdf-styles";
import { PageHeader } from "./page-header";
import { PageFooter } from "./page-footer";

interface SectionPageProps {
  title: string;
  children: React.ReactNode;
  logoUrl?: string;
  clientName: string;
  projectLabel: string;
  footerText?: string;
  companyName?: string;
}

export function SectionPage({
  title,
  children,
  logoUrl,
  clientName,
  projectLabel,
  footerText,
  companyName,
}: SectionPageProps) {
  return (
    <Page size="LETTER" style={baseStyles.page}>
      <PageHeader
        logoUrl={logoUrl}
        clientName={clientName}
        projectLabel={projectLabel}
        companyName={companyName}
      />
      <Text style={baseStyles.sectionTitle}>{title}</Text>
      {children}
      <PageFooter footerText={footerText} />
    </Page>
  );
}
