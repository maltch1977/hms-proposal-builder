import { Mark, mergeAttributes } from "@tiptap/core";

export const RequirementMark = Mark.create({
  name: "requirementMark",

  inclusive: false,
  exitable: true,

  addAttributes() {
    return {
      reqId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-req-id"),
        renderHTML: (attributes) => {
          if (!attributes.reqId) return {};
          return { "data-req-id": attributes.reqId };
        },
      },
      reqType: {
        default: "addressed",
        parseHTML: (element) =>
          element.getAttribute("data-req-type") || "addressed",
        renderHTML: (attributes) => ({
          "data-req-type": attributes.reqType,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark[data-req-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const reqType = HTMLAttributes["data-req-type"] || "addressed";
    // Use hyphenated class name to match CSS (needs_input → needs-input)
    const cssType = reqType.replace(/_/g, "-");
    return [
      "mark",
      mergeAttributes(HTMLAttributes, {
        class: `requirement-mark requirement-mark--${cssType}`,
      }),
      0,
    ];
  },
});
