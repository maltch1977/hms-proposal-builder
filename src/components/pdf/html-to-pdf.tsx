import { Text, View } from "@react-pdf/renderer";
import { COLORS, baseStyles } from "./pdf-styles";

// Simple HTML-to-react-pdf converter for TipTap output
// Handles: p, strong, em, u, h2, h3, ul, ol, li, blockquote, br

interface HtmlNode {
  type: "text" | "element";
  tag?: string;
  text?: string;
  children?: HtmlNode[];
}

function parseHtml(html: string): HtmlNode[] {
  if (!html) return [];

  const nodes: HtmlNode[] = [];
  let remaining = html;

  while (remaining.length > 0) {
    // Check for tag
    const tagMatch = remaining.match(/^<(\/?)([\w]+)([^>]*)>/);
    if (tagMatch && tagMatch.index === 0) {
      const isClosing = tagMatch[1] === "/";
      const tagName = tagMatch[2].toLowerCase();
      remaining = remaining.slice(tagMatch[0].length);

      if (isClosing) {
        // Return to close this level
        return nodes;
      }

      // Self-closing tags
      if (tagName === "br" || tagName === "hr") {
        nodes.push({ type: "element", tag: tagName, children: [] });
        continue;
      }

      // Parse children until closing tag
      const children = parseHtml(remaining);
      nodes.push({ type: "element", tag: tagName, children });

      // Find and consume closing tag
      const closeTag = `</${tagName}>`;
      const closeIdx = remaining.indexOf(closeTag);
      if (closeIdx >= 0) {
        remaining = remaining.slice(closeIdx + closeTag.length);
      } else {
        remaining = "";
      }
    } else {
      // Text content
      const nextTag = remaining.indexOf("<");
      const textContent =
        nextTag >= 0 ? remaining.slice(0, nextTag) : remaining;
      remaining = nextTag >= 0 ? remaining.slice(nextTag) : "";

      if (textContent) {
        const decoded = textContent
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&middot;/g, "\u00B7")
          .replace(/&nbsp;/g, " ")
          .replace(/&#39;/g, "'");
        nodes.push({ type: "text", text: decoded });
      }
    }
  }

  return nodes;
}

function renderNode(node: HtmlNode, key: number): React.ReactNode {
  if (node.type === "text") {
    return node.text;
  }

  const children = node.children?.map((child, i) => renderNode(child, i));

  switch (node.tag) {
    case "p":
      return (
        <Text key={key} style={{ marginBottom: 6, fontSize: 10, lineHeight: 1.6 }}>
          {children}
        </Text>
      );
    case "h2":
      return (
        <View key={key} minPresenceAhead={0.15}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Helvetica-Bold",
              color: COLORS.navy,
              marginTop: 10,
              marginBottom: 6,
            }}
          >
            {children}
          </Text>
        </View>
      );
    case "h3":
      return (
        <View key={key} minPresenceAhead={0.12}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Helvetica-Bold",
              color: COLORS.navy,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            {children}
          </Text>
        </View>
      );
    case "strong":
    case "b":
      return (
        <Text key={key} style={{ fontFamily: "Helvetica-Bold" }}>
          {children}
        </Text>
      );
    case "em":
    case "i":
      return (
        <Text key={key} style={{ fontFamily: "Helvetica-Oblique" }}>
          {children}
        </Text>
      );
    case "u":
      return (
        <Text key={key} style={{ textDecoration: "underline" }}>
          {children}
        </Text>
      );
    case "ul":
      return (
        <View key={key} style={{ marginLeft: 12, marginBottom: 6 }}>
          {children}
        </View>
      );
    case "ol":
      return (
        <View key={key} style={{ marginLeft: 12, marginBottom: 6 }}>
          {node.children?.map((child, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={{ width: 16, fontSize: 10 }}>{i + 1}.</Text>
              <Text style={{ flex: 1, fontSize: 10, lineHeight: 1.6 }}>
                {child.children?.map((c, j) => renderNode(c, j))}
              </Text>
            </View>
          ))}
        </View>
      );
    case "li":
      return (
        <View key={key} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={{ width: 12, fontSize: 10 }}>{"\u2022"}</Text>
          <Text style={{ flex: 1, fontSize: 10, lineHeight: 1.6 }}>
            {children}
          </Text>
        </View>
      );
    case "blockquote":
      return (
        <View
          key={key}
          style={{
            borderLeftWidth: 3,
            borderLeftColor: COLORS.gold,
            paddingLeft: 10,
            marginVertical: 6,
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Oblique", color: COLORS.darkGray }}>
            {children}
          </Text>
        </View>
      );
    case "br":
      return <Text key={key}>{"\n"}</Text>;
    case "hr":
      return (
        <View
          key={key}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: COLORS.mediumGray,
            marginVertical: 8,
          }}
        />
      );
    default:
      return <Text key={key}>{children}</Text>;
  }
}

export function HtmlContent({ html }: { html: string }) {
  if (!html) return null;
  const nodes = parseHtml(html);
  return (
    <View>
      {nodes.map((node, i) => renderNode(node, i))}
    </View>
  );
}
