import type { Tables } from "./database";

export type AssetTypeKey = "past_projects" | "personnel" | "references";

export type PastProject = Tables<"past_projects">;
export type Personnel = Tables<"personnel">;
export type Reference = Tables<"references">;

export type AssetItem = PastProject | Personnel | Reference;

export interface AssetTypeConfig<T extends AssetItem = AssetItem> {
  key: AssetTypeKey;
  label: string;
  labelPlural: string;
  endpoints: {
    list: string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    linked: (proposalId: string) => string;
    link: (proposalId: string) => string;
    unlink: (proposalId: string) => string;
    reorder: (proposalId: string) => string;
  };
  responseKeys: {
    list: string;
    create: string;
    update: string;
    linked: string;
  };
  foreignKey: string;
  /** Key used in the DELETE body to identify the junction record (e.g. "study_id", "member_id", "ref_id") */
  unlinkBodyKey: string;
  /** Key in the linked response where the nested item lives (e.g. "project", "personnel", "reference") */
  nestedKey: string;
  searchFields: string[];
  maxItems?: number;
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
}

/** A linked junction record with nested item data */
export interface LinkedRecord {
  id: string;
  order_index?: number;
  [key: string]: unknown;
}

export type PanelView = "browse" | "form";

export interface PanelState {
  view: PanelView;
  editingItem: AssetItem | null;
}
