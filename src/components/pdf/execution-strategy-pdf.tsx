import { View, Text } from "@react-pdf/renderer";
import { COLORS } from "./pdf-styles";

interface Phase {
  name: string;
  duration: string;
  description: string;
  milestones: string[];
}

interface ExecutionStrategyPdfProps {
  projectDuration?: string;
  phases?: Phase[];
  criticalPath?: string[];
  approachNarrative?: string;
}

export function ExecutionStrategyPdf({
  projectDuration,
  phases,
  criticalPath,
  approachNarrative,
}: ExecutionStrategyPdfProps) {
  return (
    <View>
      {projectDuration && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.navy }}>
            Project Duration: {projectDuration}
          </Text>
        </View>
      )}

      {approachNarrative && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 10, lineHeight: 1.5 }}>
            {approachNarrative}
          </Text>
        </View>
      )}

      {phases && phases.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Helvetica-Bold",
              color: COLORS.navy,
              marginBottom: 6,
            }}
          >
            Project Phases
          </Text>
          {phases.map((phase, idx) => (
            <View
              key={idx}
              style={{
                marginBottom: 8,
                padding: 8,
                borderWidth: 0.5,
                borderColor: COLORS.mediumGray,
                borderRadius: 2,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>
                  Phase {idx + 1}: {phase.name}
                </Text>
                <Text style={{ fontSize: 9, color: COLORS.darkGray }}>
                  {phase.duration}
                </Text>
              </View>
              {phase.description && (
                <Text style={{ fontSize: 9, lineHeight: 1.4, marginBottom: 4 }}>
                  {phase.description}
                </Text>
              )}
              {phase.milestones.length > 0 && (
                <View style={{ marginTop: 2 }}>
                  {phase.milestones.map((ms, mi) => (
                    <Text key={mi} style={{ fontSize: 9, color: COLORS.darkGray, paddingLeft: 8 }}>
                      {"\u2022"} {ms}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {criticalPath && criticalPath.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Helvetica-Bold",
              color: COLORS.navy,
              marginBottom: 4,
            }}
          >
            Critical Path
          </Text>
          {criticalPath.map((item, idx) => (
            <Text key={idx} style={{ fontSize: 9, paddingLeft: 8, lineHeight: 1.4 }}>
              {"\u2022"} {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
