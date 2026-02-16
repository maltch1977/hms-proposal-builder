import { View, Text } from "@react-pdf/renderer";
import { COLORS } from "./pdf-styles";

interface PageFooterProps {
  footerText?: string;
}

export function PageFooter({ footerText }: PageFooterProps) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 24,
        left: 54,
        right: 54,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 0.5,
        borderTopColor: COLORS.mediumGray,
        paddingTop: 6,
      }}
      fixed
    >
      <Text style={{ fontSize: 7, color: COLORS.darkGray }}>
        {footerText || "HMS Commercial Service, Inc."}
      </Text>
      <Text
        style={{ fontSize: 7, color: COLORS.darkGray }}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}
