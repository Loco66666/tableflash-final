export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; email: string | null; phone: string | null; role: "super_admin" | "restaurant_owner" | "restaurant_staff"; created_at: string | null; updated_at: string | null };
        Insert: { id: string; full_name?: string | null; email?: string | null; phone?: string | null; role: "super_admin" | "restaurant_owner" | "restaurant_staff"; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; full_name?: string | null; email?: string | null; phone?: string | null; role?: "super_admin" | "restaurant_owner" | "restaurant_staff"; created_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      restaurant_applications: { Row: { id: string; restaurant_name: string; owner_name: string; city: string | null; phone: string | null; email: string; restaurant_type: string | null; source: string | null; status: "pending"|"approved"|"rejected"|"needs_followup"; internal_note: string | null; reviewed_by: string | null; reviewed_at: string | null; created_at: string | null; updated_at: string | null }; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      restaurants: { Row: Record<string, unknown>; Insert: { name: string; slug: string; status?: "trial"|"active"|"suspended"|"archived"; city?: string | null; phone?: string | null; email?: string | null; cuisine_type?: string | null; plan?: "trial"|"standard"|"premium"; trial_ends_at?: string | null }; Update: Record<string, unknown>; Relationships: [] };
      restaurant_settings: { Row: Record<string, unknown>; Insert: { restaurant_id: string }; Update: Record<string, unknown>; Relationships: [] };
      admin_events: { Row: Record<string, unknown>; Insert: { actor_id?: string | null; restaurant_id?: string | null; event_type: string; message: string; metadata?: Record<string, unknown> }; Update: Record<string, unknown>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
