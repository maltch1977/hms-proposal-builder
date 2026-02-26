export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          body_text_color: string;
          company_name: string | null;
          company_address: string | null;
          company_phone: string | null;
          company_website: string | null;
          company_email: string | null;
          footer_text: string | null;
          theme_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          body_text_color?: string;
          company_name?: string | null;
          company_address?: string | null;
          company_phone?: string | null;
          company_website?: string | null;
          company_email?: string | null;
          footer_text?: string | null;
          theme_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          body_text_color?: string;
          company_name?: string | null;
          company_address?: string | null;
          company_phone?: string | null;
          company_website?: string | null;
          company_email?: string | null;
          footer_text?: string | null;
          theme_config?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string;
          role: "super_admin" | "hms_admin" | "proposal_user";
          manager_id: string | null;
          avatar_url: string | null;
          is_active: boolean;
          requires_approval: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string;
          role: "super_admin" | "hms_admin" | "proposal_user";
          manager_id?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          requires_approval?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          full_name?: string;
          email?: string;
          role?: "super_admin" | "hms_admin" | "proposal_user";
          manager_id?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          requires_approval?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      section_types: {
        Row: {
          id: string;
          organization_id: string;
          slug: string;
          display_name: string;
          description: string | null;
          default_order: number;
          content_schema: Json | null;
          is_system: boolean;
          is_auto_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          slug: string;
          display_name: string;
          description?: string | null;
          default_order: number;
          content_schema?: Json | null;
          is_system?: boolean;
          is_auto_generated?: boolean;
          created_at?: string;
        };
        Update: {
          slug?: string;
          display_name?: string;
          description?: string | null;
          default_order?: number;
          content_schema?: Json | null;
          is_system?: boolean;
          is_auto_generated?: boolean;
        };
        Relationships: [];
      };
      proposals: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          title: string;
          client_name: string;
          client_address: string;
          project_label: string;
          status: "draft" | "submitted" | "in_review" | "approved" | "returned" | "exported" | "archived";
          cover_template: "photo" | "no_photo";
          cover_photo_url: string | null;
          deadline: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by: string;
          title: string;
          client_name: string;
          client_address?: string;
          project_label?: string;
          status?: "draft" | "submitted" | "in_review" | "approved" | "returned" | "exported" | "archived";
          cover_template?: "photo" | "no_photo";
          cover_photo_url?: string | null;
          deadline?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          client_name?: string;
          client_address?: string;
          project_label?: string;
          status?: "draft" | "submitted" | "in_review" | "approved" | "returned" | "exported" | "archived";
          cover_template?: "photo" | "no_photo";
          cover_photo_url?: string | null;
          deadline?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      proposal_sections: {
        Row: {
          id: string;
          proposal_id: string;
          section_type_id: string;
          order_index: number;
          is_enabled: boolean;
          content: Json;
          library_item_id: string | null;
          lock_level: "none" | "admin" | "super_admin";
          locked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          section_type_id: string;
          order_index: number;
          is_enabled?: boolean;
          content?: Json;
          library_item_id?: string | null;
          lock_level?: "none" | "admin" | "super_admin";
          locked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          order_index?: number;
          is_enabled?: boolean;
          content?: Json;
          library_item_id?: string | null;
          lock_level?: "none" | "admin" | "super_admin";
          locked_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      library_items: {
        Row: {
          id: string;
          organization_id: string;
          section_type_id: string;
          name: string;
          description: string | null;
          content: Json;
          metadata: Json;
          is_default: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          section_type_id: string;
          name: string;
          description?: string | null;
          content: Json;
          metadata?: Json;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          content?: Json;
          metadata?: Json;
          is_default?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      past_projects: {
        Row: {
          id: string;
          organization_id: string;
          project_name: string;
          project_type: string;
          building_type: string;
          client_name: string;
          square_footage: number | null;
          completion_date: string | null;
          narrative: string | null;
          photos: Json;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_name: string;
          project_type: string;
          building_type: string;
          client_name: string;
          square_footage?: number | null;
          completion_date?: string | null;
          narrative?: string | null;
          photos?: Json;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_name?: string;
          project_type?: string;
          building_type?: string;
          client_name?: string;
          square_footage?: number | null;
          completion_date?: string | null;
          narrative?: string | null;
          photos?: Json;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      personnel: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          title: string;
          role_type: string;
          years_in_industry: number | null;
          years_at_company: number | null;
          years_with_distech: number | null;
          task_description: string | null;
          bio: string | null;
          specialties: string[];
          certifications: string[];
          photo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          full_name: string;
          title: string;
          role_type: string;
          years_in_industry?: number | null;
          years_at_company?: number | null;
          years_with_distech?: number | null;
          task_description?: string | null;
          bio?: string | null;
          specialties?: string[];
          certifications?: string[];
          photo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          title?: string;
          role_type?: string;
          years_in_industry?: number | null;
          years_at_company?: number | null;
          years_with_distech?: number | null;
          task_description?: string | null;
          bio?: string | null;
          specialties?: string[];
          certifications?: string[];
          photo_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      references: {
        Row: {
          id: string;
          organization_id: string;
          contact_name: string;
          title: string;
          company: string;
          phone: string;
          email: string | null;
          category: string;
          project_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_name: string;
          title: string;
          company: string;
          phone: string;
          email?: string | null;
          category: string;
          project_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_name?: string;
          title?: string;
          company?: string;
          phone?: string;
          email?: string | null;
          category?: string;
          project_ids?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      cost_library_items: {
        Row: {
          id: string;
          organization_id: string;
          description: string;
          type: "base" | "adder" | "deduct";
          default_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          description: string;
          type: "base" | "adder" | "deduct";
          default_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          description?: string;
          type?: "base" | "adder" | "deduct";
          default_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      proposal_cost_items: {
        Row: {
          id: string;
          proposal_id: string;
          description: string;
          type: "base" | "adder" | "deduct";
          amount: number;
          order_index: number;
          cost_library_item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          description: string;
          type: "base" | "adder" | "deduct";
          amount: number;
          order_index: number;
          cost_library_item_id?: string | null;
          created_at?: string;
        };
        Update: {
          description?: string;
          type?: "base" | "adder" | "deduct";
          amount?: number;
          order_index?: number;
          cost_library_item_id?: string | null;
        };
        Relationships: [];
      };
      proposal_team_members: {
        Row: {
          id: string;
          proposal_id: string;
          personnel_id: string;
          order_index: number;
          role_override: string | null;
          hierarchy_position: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          personnel_id: string;
          order_index: number;
          role_override?: string | null;
          hierarchy_position?: Json;
          created_at?: string;
        };
        Update: {
          order_index?: number;
          role_override?: string | null;
          hierarchy_position?: Json;
        };
        Relationships: [];
      };
      proposal_case_studies: {
        Row: {
          id: string;
          proposal_id: string;
          past_project_id: string;
          order_index: number;
          photo_overrides: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          past_project_id: string;
          order_index: number;
          photo_overrides?: Json | null;
          created_at?: string;
        };
        Update: {
          order_index?: number;
          photo_overrides?: Json | null;
        };
        Relationships: [];
      };
      proposal_references: {
        Row: {
          id: string;
          proposal_id: string;
          reference_id: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          reference_id: string;
          order_index: number;
          created_at?: string;
        };
        Update: {
          order_index?: number;
        };
        Relationships: [];
      };
      emr_ratings: {
        Row: {
          id: string;
          organization_id: string;
          year: number;
          rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          year: number;
          rating: number;
          created_at?: string;
        };
        Update: {
          year?: number;
          rating?: number;
        };
        Relationships: [];
      };
      cover_photos: {
        Row: {
          id: string;
          organization_id: string;
          url: string;
          filename: string;
          project_type: string | null;
          building_type: string | null;
          tags: string[];
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          url: string;
          filename: string;
          project_type?: string | null;
          building_type?: string | null;
          tags?: string[];
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          url?: string;
          filename?: string;
          project_type?: string | null;
          building_type?: string | null;
          tags?: string[];
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          type: string;
          proposal_id: string | null;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          type: string;
          proposal_id?: string | null;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      proposal_comments: {
        Row: {
          id: string;
          proposal_id: string;
          section_id: string | null;
          author_id: string;
          content: string;
          parent_id: string | null;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          section_id?: string | null;
          author_id: string;
          content: string;
          parent_id?: string | null;
          is_resolved?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_resolved?: boolean;
        };
        Relationships: [];
      };
      proposal_changes: {
        Row: {
          id: string;
          proposal_id: string;
          section_id: string;
          author_id: string | null;
          field: string;
          old_value: Json | null;
          new_value: Json | null;
          status: "pending" | "accepted" | "rejected";
          change_type: "human" | "ai" | "system";
          summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          section_id: string;
          author_id?: string | null;
          field: string;
          old_value?: Json | null;
          new_value?: Json | null;
          status?: "pending" | "accepted" | "rejected";
          change_type?: "human" | "ai" | "system";
          summary?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "rejected";
          new_value?: Json | null;
          summary?: string | null;
        };
        Relationships: [];
      };
      proposal_collaborators: {
        Row: {
          id: string;
          proposal_id: string;
          profile_id: string;
          role: "owner" | "editor" | "viewer";
          added_by: string | null;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          profile_id: string;
          role?: "owner" | "editor" | "viewer";
          added_by?: string | null;
          color: string;
          created_at?: string;
        };
        Update: {
          role?: "owner" | "editor" | "viewer";
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_proposal_sections: {
        Args: {
          p_proposal_id: string;
          p_org_id: string;
        };
        Returns: void;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id?: string;
          p_metadata?: Json;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience type aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
