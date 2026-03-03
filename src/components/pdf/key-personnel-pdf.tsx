import { View, Text, Image } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";
import { HtmlContent } from "./html-to-pdf";
import type { OrgChartNode } from "@/lib/pdf/types";

interface PersonnelEntry {
  fullName: string;
  title: string;
  roleType: string;
  yearStartedInTrade: number | null;
  yearsCompany: number | null;
  yearsWithDistech: number | null;
  taskDescription: string | null;
  specialties: string[];
  certifications: string[];
  bio: string | null;
}

interface TreeNode {
  node: OrgChartNode;
  children: TreeNode[];
}

interface KeyPersonnelPdfProps {
  personnel: PersonnelEntry[];
  orgChartImageUrl?: string;
  orgChartHierarchy?: OrgChartNode[];
  clientName?: string;
}

function buildTree(nodes: OrgChartNode[]): TreeNode[] {
  const childrenMap = new Map<string | null, OrgChartNode[]>();
  for (const node of nodes) {
    const parentId = node.parentId;
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
    childrenMap.get(parentId)!.push(node);
  }

  function build(parentId: string | null): TreeNode[] {
    const children = childrenMap.get(parentId) || [];
    return children.map((node) => ({
      node,
      children: build(node.id),
    }));
  }

  return build(null);
}

function OrgChartBox({ name, title, isClient }: { name: string; title?: string; isClient?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: isClient ? COLORS.navy : COLORS.mediumGray,
        backgroundColor: isClient ? COLORS.navy : COLORS.white,
        borderRadius: 4,
        alignItems: "center",
        minWidth: 100,
      }}
    >
      <Text
        style={{
          fontSize: 8,
          fontFamily: "Helvetica-Bold",
          color: isClient ? COLORS.white : COLORS.navy,
        }}
      >
        {name}
      </Text>
      {title && (
        <Text style={{ fontSize: 7, color: isClient ? COLORS.white : COLORS.darkGray, marginTop: 1 }}>
          {title}
        </Text>
      )}
    </View>
  );
}

function VerticalLine() {
  return (
    <View style={{ width: 1, height: 12, backgroundColor: COLORS.mediumGray, alignSelf: "center" }} />
  );
}

function OrgTreeLevel({ nodes }: { nodes: TreeNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
        {nodes.map((treeNode) => (
          <View key={treeNode.node.id} style={{ alignItems: "center" }}>
            <OrgChartBox name={treeNode.node.fullName} title={treeNode.node.title} />
            {treeNode.children.length > 0 && (
              <>
                <VerticalLine />
                <OrgTreeLevel nodes={treeNode.children} />
              </>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function HierarchyOrgChart({ hierarchy, clientName }: { hierarchy: OrgChartNode[]; clientName: string }) {
  const tree = buildTree(hierarchy);

  return (
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <OrgChartBox name={clientName} isClient />
      <VerticalLine />
      <OrgTreeLevel nodes={tree} />
    </View>
  );
}

export function KeyPersonnelPdf({ personnel, orgChartImageUrl, orgChartHierarchy, clientName }: KeyPersonnelPdfProps) {
  return (
    <View>
      {/* Org Chart — hierarchy tree, uploaded image, or text fallback */}
      <Text style={baseStyles.sectionSubtitle}>Organization Chart</Text>
      {orgChartHierarchy && orgChartHierarchy.length > 0 ? (
        <HierarchyOrgChart hierarchy={orgChartHierarchy} clientName={clientName || "HMS Client"} />
      ) : orgChartImageUrl ? (
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

      {/* Personnel Bios */}
      <View minPresenceAhead={0.25}>
        <Text style={baseStyles.sectionSubtitle}>Personnel Qualifications</Text>
      </View>
      {personnel.map((person, idx) => {
        const currentYear = new Date().getFullYear();
        const stats = [
          person.yearStartedInTrade != null && `Yrs in Trade: ${currentYear - person.yearStartedInTrade}`,
          person.yearsCompany != null && `Yrs Company: ${person.yearsCompany}`,
          person.yearsWithDistech != null && `Yrs Controls: ${person.yearsWithDistech}`,
        ].filter(Boolean);

        return (
          <View
            key={idx}
            minPresenceAhead={0.1}
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottomWidth: idx < personnel.length - 1 ? 0.5 : 0,
              borderBottomColor: COLORS.mediumGray,
            }}
          >
            {/* Name & title */}
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.navy }}>
              {person.fullName}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
              {person.roleType}
            </Text>

            {/* Stats */}
            {stats.length > 0 && (
              <Text style={{ fontSize: 8, color: COLORS.darkGray, marginTop: 3 }}>
                {stats.join("  ·  ")}
              </Text>
            )}

            {/* Task Description / Responsibilities */}
            {person.taskDescription && (
              <Text style={{ fontSize: 8, color: COLORS.darkGray, marginTop: 3 }}>
                Responsibilities: {person.taskDescription}
              </Text>
            )}

            {/* Certs & Specialties */}
            {(person.certifications.length > 0 || person.specialties.length > 0) && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2, gap: 12 }}>
                {person.certifications.length > 0 && (
                  <Text style={{ fontSize: 8, color: COLORS.darkGray }}>
                    Certs: {person.certifications.join(", ")}
                  </Text>
                )}
                {person.specialties.length > 0 && (
                  <Text style={{ fontSize: 8, color: COLORS.darkGray }}>
                    Specialties: {person.specialties.join(", ")}
                  </Text>
                )}
              </View>
            )}

            {/* Bio narrative */}
            {person.bio && (
              <View style={{ marginTop: 4 }}>
                <HtmlContent html={person.bio} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
