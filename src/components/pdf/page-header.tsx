import { View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./pdf-styles";

interface PageHeaderProps {
  logoUrl?: string;
  clientName: string;
  projectLabel: string;
  companyName?: string;
}

export function PageHeader({
  logoUrl,
  clientName,
  projectLabel,
  companyName,
}: PageHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: COLORS.gold,
        paddingBottom: 8,
        marginBottom: 16,
      }}
      fixed
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {logoUrl && (
          <Image
            src={logoUrl}
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
        )}
        <View>
          <Text
            style={{
              fontSize: 8,
              fontFamily: "Helvetica-Bold",
              color: COLORS.navy,
              letterSpacing: 1,
            }}
          >
            {(companyName || "HMS Commercial Service, Inc.").toUpperCase()}
          </Text>
          <Text style={{ fontSize: 7, color: COLORS.darkGray }}>
            {projectLabel}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 7, color: COLORS.darkGray, textAlign: "right" }}>
        {clientName}
      </Text>
    </View>
  );
}
