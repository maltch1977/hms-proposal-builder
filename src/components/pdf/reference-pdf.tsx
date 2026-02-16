import { View, Text } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";

interface ReferenceEntry {
  contactName: string;
  title: string;
  company: string;
  phone: string;
  email: string | null;
  category: string;
}

interface ReferencePdfProps {
  references: ReferenceEntry[];
}

export function ReferencePdf({ references }: ReferencePdfProps) {
  return (
    <View style={baseStyles.table}>
      <View style={baseStyles.tableHeader}>
        <Text style={[baseStyles.tableHeaderCell, { width: "22%" }]}>
          Contact
        </Text>
        <Text style={[baseStyles.tableHeaderCell, { width: "18%" }]}>
          Title
        </Text>
        <Text style={[baseStyles.tableHeaderCell, { width: "20%" }]}>
          Company
        </Text>
        <Text style={[baseStyles.tableHeaderCell, { width: "14%" }]}>
          Category
        </Text>
        <Text style={[baseStyles.tableHeaderCell, { width: "14%" }]}>
          Phone
        </Text>
        <Text style={[baseStyles.tableHeaderCell, { width: "12%" }]}>
          Email
        </Text>
      </View>
      {references.map((ref, idx) => (
        <View
          key={idx}
          style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
        >
          <Text style={[baseStyles.tableCell, baseStyles.bold, { width: "22%" }]}>
            {ref.contactName}
          </Text>
          <Text style={[baseStyles.tableCell, { width: "18%" }]}>
            {ref.title}
          </Text>
          <Text style={[baseStyles.tableCell, { width: "20%" }]}>
            {ref.company}
          </Text>
          <Text style={[baseStyles.tableCell, { width: "14%" }]}>
            {ref.category}
          </Text>
          <Text style={[baseStyles.tableCell, { width: "14%" }]}>
            {ref.phone}
          </Text>
          <Text style={[baseStyles.tableCell, { width: "12%", fontSize: 8 }]}>
            {ref.email || "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}
