export type AppRole = "super_admin" | "restaurant_owner" | "restaurant_staff";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "needs_followup";

export type RestaurantStatus = "trial" | "active" | "suspended" | "archived";

export type SubscriptionPlan = "trial" | "standard" | "premium";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: AppRole;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: AppRole;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: AppRole;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      restaurant_applications: {
        Row: {
          id: string;
          restaurant_name: string;
          owner_name: string;
          city: string | null;
          phone: string | null;
          email: string;
          restaurant_type: string | null;
          source: string | null;
          status: ApplicationStatus;
          internal_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_name: string;
          owner_name: string;
          city?: string | null;
          phone?: string | null;
          email: string;
          restaurant_type?: string | null;
          source?: string | null;
          status?: ApplicationStatus;
          internal_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_name?: string;
          owner_name?: string;
          city?: string | null;
          phone?: string | null;
          email?: string;
          restaurant_type?: string | null;
          source?: string | null;
          status?: ApplicationStatus;
          internal_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: RestaurantStatus;
          owner_id: string | null;
          city: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          cuisine_type: string | null;
          plan: SubscriptionPlan;
          trial_ends_at: string | null;
          google_review_url: string | null;
          public_base_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: RestaurantStatus;
          owner_id?: string | null;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          cuisine_type?: string | null;
          plan?: SubscriptionPlan;
          trial_ends_at?: string | null;
          google_review_url?: string | null;
          public_base_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: RestaurantStatus;
          owner_id?: string | null;
          city?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          cuisine_type?: string | null;
          plan?: SubscriptionPlan;
          trial_ends_at?: string | null;
          google_review_url?: string | null;
          public_base_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      restaurant_members: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          role: AppRole;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          role?: AppRole;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          role?: AppRole;
          created_at?: string | null;
        };
        Relationships: [];
      };

      restaurant_settings: {
        Row: {
          id: string;
          restaurant_id: string;
          lunch_enabled: boolean | null;
          lunch_start: string | null;
          lunch_end: string | null;
          dinner_enabled: boolean | null;
          dinner_start: string | null;
          dinner_end: string | null;
          orders_enabled: boolean | null;
          require_payment_before_preparation: boolean | null;
          qr_enabled: boolean | null;
          reviews_enabled: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          lunch_enabled?: boolean | null;
          lunch_start?: string | null;
          lunch_end?: string | null;
          dinner_enabled?: boolean | null;
          dinner_start?: string | null;
          dinner_end?: string | null;
          orders_enabled?: boolean | null;
          require_payment_before_preparation?: boolean | null;
          qr_enabled?: boolean | null;
          reviews_enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          lunch_enabled?: boolean | null;
          lunch_start?: string | null;
          lunch_end?: string | null;
          dinner_enabled?: boolean | null;
          dinner_start?: string | null;
          dinner_end?: string | null;
          orders_enabled?: boolean | null;
          require_payment_before_preparation?: boolean | null;
          qr_enabled?: boolean | null;
          reviews_enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price_cents: number;
          currency: string;
          image_url: string | null;
          is_available: boolean;
          is_featured: boolean;
          sort_order: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      admin_events: {
        Row: {
          id: string;
          actor_id: string | null;
          restaurant_id: string | null;
          event_type: string;
          message: string;
          metadata: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          restaurant_id?: string | null;
          event_type: string;
          message: string;
          metadata?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          restaurant_id?: string | null;
          event_type?: string;
          message?: string;
          metadata?: Json;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      application_status: ApplicationStatus;
      restaurant_status: RestaurantStatus;
      subscription_plan: SubscriptionPlan;
    };
    CompositeTypes: Record<string, never>;
  };
};
