import { View, Text } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";

interface EmrEntry {
  year: number;
  rating: number;
}

interface EmrTablePdfProps {
  ratings: EmrEntry[];
}

export function EmrTablePdf({ ratings }: EmrTablePdfProps) {
  if (ratings.length === 0) return null;

  const sorted = [...ratings].sort((a, b) => a.year - b.year);

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={baseStyles.sectionSubtitle}>
        Experience Modification Rating (EMR)
      </Text>
      <View style={baseStyles.table}>
        <View style={baseStyles.tableHeader}>
          {sorted.map((r) => (
            <Text
              key={r.year}
              style={[
                baseStyles.tableHeaderCell,
                { flex: 1, textAlign: "center" },
              ]}
            >
              {r.year}
            </Text>
          ))}
        </View>
        <View style={baseStyles.tableRow}>
          {sorted.map((r) => (
            <Text
              key={r.year}
              style={[
                baseStyles.tableCell,
                baseStyles.bold,
                { flex: 1, textAlign: "center" },
              ]}
            >
              {r.rating.toFixed(2)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
