import { View, Text } from "@react-pdf/renderer";
import { baseStyles } from "./pdf-styles";
import type { PricingColumn, PricingRow } from "@/lib/types/section";

interface ProjectCostPdfProps {
  columns: PricingColumn[];
  rows: PricingRow[];
  notes?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseDollar(value: string | undefined): number {
  if (!value) return 0;
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}

export function ProjectCostPdf({ columns, rows, notes }: ProjectCostPdfProps) {
  if (columns.length === 0 && rows.length === 0) return null;

  const colWidth = columns.length > 0 ? 100 / columns.length : 100;

  return (
    <View>
      <View style={baseStyles.table}>
        {/* Header */}
        <View style={baseStyles.tableHeader}>
          <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>
            Description
          </Text>
          {columns.map((col) => (
            <Text
              key={col.id}
              style={[
                baseStyles.tableHeaderCell,
                { width: colWidth, textAlign: "right", flex: 1 },
              ]}
            >
              {col.name}
            </Text>
          ))}
        </View>

        {/* Data rows */}
        {rows.map((row, idx) => (
          <View
            key={row.id}
            style={idx % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
          >
            <Text style={[baseStyles.tableCell, { flex: 2 }]}>
              {row.description}
            </Text>
            {columns.map((col) => (
              <Text
                key={col.id}
                style={[
                  baseStyles.tableCell,
                  { width: colWidth, textAlign: "right", flex: 1 },
                ]}
              >
                {row.values[col.id]
                  ? formatCurrency(parseDollar(row.values[col.id]))
                  : ""}
              </Text>
            ))}
          </View>
        ))}

      </View>

      {/* Notes */}
      {notes && (
        <View style={{ marginTop: 10 }}>
          <Text style={baseStyles.sectionSubtitle}>Notes</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{notes}</Text>
        </View>
      )}
    </View>
  );
}
