import { View, Text } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";

interface CostItem {
  description: string;
  type: "base" | "adder" | "deduct";
  amount: number;
}

interface ProjectCostPdfProps {
  items: CostItem[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProjectCostPdf({ items }: ProjectCostPdfProps) {
  const baseItems = items.filter((i) => i.type === "base");
  const adders = items.filter((i) => i.type === "adder");
  const deducts = items.filter((i) => i.type === "deduct");

  const baseTotal = baseItems.reduce((s, i) => s + i.amount, 0);
  const addersTotal = adders.reduce((s, i) => s + i.amount, 0);
  const deductsTotal = deducts.reduce((s, i) => s + i.amount, 0);
  const grandTotal = baseTotal + addersTotal - deductsTotal;

  return (
    <View>
      {/* Base Scope */}
      {baseItems.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={baseStyles.sectionSubtitle}>Base Scope</Text>
          <View style={baseStyles.table}>
            <View style={baseStyles.tableHeader}>
              <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>
                Description
              </Text>
              <Text
                style={[
                  baseStyles.tableHeaderCell,
                  { width: 100, textAlign: "right" },
                ]}
              >
                Amount
              </Text>
            </View>
            {baseItems.map((item, idx) => (
              <View
                key={idx}
                style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
              >
                <Text style={[baseStyles.tableCell, { flex: 1 }]}>
                  {item.description}
                </Text>
                <Text
                  style={[
                    baseStyles.tableCell,
                    { width: 100, textAlign: "right" },
                  ]}
                >
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
            <View
              style={{
                flexDirection: "row",
                paddingVertical: 5,
                paddingHorizontal: 8,
                backgroundColor: COLORS.lightGray,
              }}
            >
              <Text
                style={[baseStyles.tableCell, baseStyles.bold, { flex: 1 }]}
              >
                Base Scope Subtotal
              </Text>
              <Text
                style={[
                  baseStyles.tableCell,
                  baseStyles.bold,
                  { width: 100, textAlign: "right" },
                ]}
              >
                {formatCurrency(baseTotal)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Adders */}
      {adders.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={baseStyles.sectionSubtitle}>Adders / Alternates</Text>
          <View style={baseStyles.table}>
            {adders.map((item, idx) => (
              <View
                key={idx}
                style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
              >
                <Text style={[baseStyles.tableCell, { flex: 1 }]}>
                  {item.description}
                </Text>
                <Text
                  style={[
                    baseStyles.tableCell,
                    { width: 100, textAlign: "right" },
                  ]}
                >
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Deducts */}
      {deducts.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={baseStyles.sectionSubtitle}>Deducts</Text>
          <View style={baseStyles.table}>
            {deducts.map((item, idx) => (
              <View
                key={idx}
                style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
              >
                <Text style={[baseStyles.tableCell, { flex: 1 }]}>
                  {item.description}
                </Text>
                <Text
                  style={[
                    baseStyles.tableCell,
                    { width: 100, textAlign: "right", color: "#CC0000" },
                  ]}
                >
                  ({formatCurrency(item.amount)})
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Grand Total */}
      <View
        style={{
          flexDirection: "row",
          paddingVertical: 8,
          paddingHorizontal: 8,
          backgroundColor: COLORS.navy,
          marginTop: 4,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 11,
            fontFamily: "Helvetica-Bold",
            color: COLORS.white,
          }}
        >
          GRAND TOTAL
        </Text>
        <Text
          style={{
            width: 100,
            textAlign: "right",
            fontSize: 11,
            fontFamily: "Helvetica-Bold",
            color: COLORS.white,
          }}
        >
          {formatCurrency(grandTotal)}
        </Text>
      </View>
    </View>
  );
}
