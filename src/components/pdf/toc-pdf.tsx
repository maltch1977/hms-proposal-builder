import { View, Text } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";

interface TocEntry {
  title: string;
}

interface TocPdfProps {
  entries: TocEntry[];
}

export function TocPdf({ entries }: TocPdfProps) {
  return (
    <View>
      <Text
        style={{
          fontSize: 10,
          fontFamily: "Helvetica-Bold",
          color: COLORS.navy,
          letterSpacing: 2,
          marginBottom: 16,
        }}
      >
        TABLE OF CONTENTS
      </Text>
      <View style={baseStyles.goldAccent} />
      {entries.map((entry, idx) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 10, color: COLORS.bodyText, flex: 1 }}>
            {entry.title}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: COLORS.darkGray,
              width: 30,
              textAlign: "right",
            }}
          >
            --
          </Text>
        </View>
      ))}
    </View>
  );
}
