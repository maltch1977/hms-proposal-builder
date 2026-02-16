import { StyleSheet, Font } from "@react-pdf/renderer";

// HMS Brand colors
export const COLORS = {
  navy: "#1B365D",
  blue: "#2B5797",
  gold: "#C9A227",
  white: "#FFFFFF",
  bodyText: "#333333",
  lightGray: "#F5F5F5",
  mediumGray: "#E0E0E0",
  darkGray: "#666666",
};

// Base styles reused across PDF components
export const baseStyles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 60,
    paddingHorizontal: 54,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.bodyText,
    lineHeight: 1.5,
  },
  sectionTitle: {
    backgroundColor: COLORS.navy,
    color: COLORS.white,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginBottom: 8,
    marginTop: 12,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.bodyText,
  },
  table: {
    width: "100%",
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: "row" as const,
    backgroundColor: COLORS.navy,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row" as const,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.mediumGray,
  },
  tableRowAlt: {
    flexDirection: "row" as const,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.mediumGray,
    backgroundColor: COLORS.lightGray,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.bodyText,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  italic: {
    fontFamily: "Helvetica-Oblique",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
    marginVertical: 12,
  },
  goldAccent: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    marginBottom: 12,
    width: 40,
  },
});
