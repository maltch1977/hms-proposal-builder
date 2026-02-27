import { View, Text, Image } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";
import { HtmlContent } from "./html-to-pdf";

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

interface KeyPersonnelPdfProps {
  personnel: PersonnelEntry[];
  orgChartImageUrl?: string;
}

export function KeyPersonnelPdf({ personnel, orgChartImageUrl }: KeyPersonnelPdfProps) {
  return (
    <View>
      {/* Org Chart — custom image or text fallback */}
      <Text style={baseStyles.sectionSubtitle}>Organization Chart</Text>
      {orgChartImageUrl ? (
        <View style={{ marginBottom: 16, alignItems: "center" }}>
          <Image
            src={orgChartImageUrl}
            style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain" }}
          />
        </View>
      ) : (
        <View style={{ marginBottom: 16 }}>
          {personnel.map((person, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
                paddingLeft: idx === 0 ? 0 : 16,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: idx === 0 ? COLORS.navy : COLORS.blue,
                  borderRadius: 3,
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>
                {person.fullName}
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.darkGray, marginLeft: 6 }}>
                — {person.title}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Personnel Bios */}
      <View minPresenceAhead={0.25}>
        <Text style={baseStyles.sectionSubtitle}>Personnel Qualifications</Text>
      </View>
      {personnel.map((person, idx) => {
        const stats = [
          person.yearsIndustry != null && `Yrs Industry: ${person.yearsIndustry}`,
          person.yearsCompany != null && `Yrs Company: ${person.yearsCompany}`,
          person.yearsWithDistech != null && `Yrs Controls: ${person.yearsWithDistech}`,
        ].filter(Boolean);

        return (
          <View
            key={idx}
            minPresenceAhead={0.1}
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottomWidth: idx < personnel.length - 1 ? 0.5 : 0,
              borderBottomColor: COLORS.mediumGray,
            }}
          >
            {/* Name & title */}
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.navy }}>
              {person.fullName}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
              {person.roleType}
            </Text>

            {/* Stats */}
            {stats.length > 0 && (
              <Text style={{ fontSize: 8, color: COLORS.darkGray, marginTop: 3 }}>
                {stats.join("  ·  ")}
              </Text>
            )}

            {/* Certs & Specialties */}
            {(person.certifications.length > 0 || person.specialties.length > 0) && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2, gap: 12 }}>
                {person.certifications.length > 0 && (
                  <Text style={{ fontSize: 8, color: COLORS.darkGray }}>
                    Certs: {person.certifications.join(", ")}
                  </Text>
                )}
                {person.specialties.length > 0 && (
                  <Text style={{ fontSize: 8, color: COLORS.darkGray }}>
                    Specialties: {person.specialties.join(", ")}
                  </Text>
                )}
              </View>
            )}

            {/* Bio narrative */}
            {person.bio && (
              <View style={{ marginTop: 4 }}>
                <HtmlContent html={person.bio} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
