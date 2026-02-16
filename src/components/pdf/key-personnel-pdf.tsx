import { View, Text, Image } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";

interface PersonnelEntry {
  fullName: string;
  title: string;
  roleType: string;
  yearsIndustry: number | null;
  yearsCompany: number | null;
  taskDescription: string | null;
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

      {/* Personnel Table */}
      <Text style={baseStyles.sectionSubtitle}>Personnel Qualifications</Text>
      <View style={baseStyles.table}>
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.tableHeaderCell, { width: "22%" }]}>
            Name
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { width: "20%" }]}>
            Title
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { width: "14%" }]}>
            Role
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>
            Yrs Ind.
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { width: "10%", textAlign: "center" }]}>
            Yrs Co.
          </Text>
          <Text style={[baseStyles.tableHeaderCell, { width: "24%" }]}>
            Responsibilities
          </Text>
        </View>
        {personnel.map((person, idx) => (
          <View
            key={idx}
            style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
          >
            <Text style={[baseStyles.tableCell, baseStyles.bold, { width: "22%" }]}>
              {person.fullName}
            </Text>
            <Text style={[baseStyles.tableCell, { width: "20%" }]}>
              {person.title}
            </Text>
            <Text style={[baseStyles.tableCell, { width: "14%" }]}>
              {person.roleType}
            </Text>
            <Text style={[baseStyles.tableCell, { width: "10%", textAlign: "center" }]}>
              {person.yearsIndustry ?? "—"}
            </Text>
            <Text style={[baseStyles.tableCell, { width: "10%", textAlign: "center" }]}>
              {person.yearsCompany ?? "—"}
            </Text>
            <Text style={[baseStyles.tableCell, { width: "24%" }]}>
              {person.taskDescription || "—"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
