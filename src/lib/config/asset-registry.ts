import type { AssetTypeConfig, PastProject, Personnel, Reference } from "@/lib/types/asset-library";

export const ASSET_CONFIGS: Record<string, AssetTypeConfig> = {
  past_projects: {
    key: "past_projects",
    label: "Case Study",
    labelPlural: "Case Studies",
    endpoints: {
      list: "/api/past-projects",
      create: "/api/past-projects",
      update: (id) => `/api/past-projects/${id}`,
      delete: (id) => `/api/past-projects/${id}`,
      linked: (pid) => `/api/proposals/${pid}/case-studies`,
      link: (pid) => `/api/proposals/${pid}/case-studies`,
      unlink: (pid) => `/api/proposals/${pid}/case-studies`,
      reorder: (pid) => `/api/proposals/${pid}/case-studies`,
    },
    responseKeys: {
      list: "projects",
      create: "project",
      update: "project",
      linked: "studies",
    },
    foreignKey: "past_project_id",
    unlinkBodyKey: "study_id",
    nestedKey: "project",
    searchFields: ["project_name", "client_name", "building_type", "project_type"],
    maxItems: 5,
    getTitle: (item) => (item as PastProject).project_name,
    getSubtitle: (item) => {
      const p = item as PastProject;
      return [p.client_name, p.building_type].filter(Boolean).join(" — ");
    },
  },
  personnel: {
    key: "personnel",
    label: "Team Member",
    labelPlural: "Team Members",
    endpoints: {
      list: "/api/personnel",
      create: "/api/personnel",
      update: (id) => `/api/personnel/${id}`,
      delete: (id) => `/api/personnel/${id}`,
      linked: (pid) => `/api/proposals/${pid}/team-members`,
      link: (pid) => `/api/proposals/${pid}/team-members`,
      unlink: (pid) => `/api/proposals/${pid}/team-members`,
      reorder: (pid) => `/api/proposals/${pid}/team-members`,
    },
    responseKeys: {
      list: "personnel",
      create: "person",
      update: "person",
      linked: "members",
    },
    foreignKey: "personnel_id",
    unlinkBodyKey: "member_id",
    nestedKey: "personnel",
    searchFields: ["full_name", "title", "role_type"],
    getTitle: (item) => (item as Personnel).full_name,
    getSubtitle: (item) => {
      const p = item as Personnel;
      return [p.title, p.role_type].filter(Boolean).join(" — ");
    },
  },
  references: {
    key: "references",
    label: "Reference",
    labelPlural: "References",
    endpoints: {
      list: "/api/references",
      create: "/api/references",
      update: (id) => `/api/references/${id}`,
      delete: (id) => `/api/references/${id}`,
      linked: (pid) => `/api/proposals/${pid}/references`,
      link: (pid) => `/api/proposals/${pid}/references`,
      unlink: (pid) => `/api/proposals/${pid}/references`,
      reorder: (pid) => `/api/proposals/${pid}/references`,
    },
    responseKeys: {
      list: "references",
      create: "reference",
      update: "reference",
      linked: "refs",
    },
    foreignKey: "reference_id",
    unlinkBodyKey: "ref_id",
    nestedKey: "reference",
    searchFields: ["contact_name", "company", "category"],
    getTitle: (item) => (item as Reference).contact_name,
    getSubtitle: (item) => {
      const r = item as Reference;
      return [r.company, r.category].filter(Boolean).join(" — ");
    },
  },
} as const;
