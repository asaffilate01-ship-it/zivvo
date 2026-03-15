export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_commissions: {
        Row: {
          agent_id: string
          amount: number | null
          commission_rate: number | null
          created_at: string
          dealer_id: string
          id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          amount?: number | null
          commission_rate?: number | null
          created_at?: string
          dealer_id: string
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number | null
          commission_rate?: number | null
          created_at?: string
          dealer_id?: string
          id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_commissions_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      car_listings: {
        Row: {
          body_type: string | null
          color: string | null
          created_at: string
          dealer_id: string | null
          description: string | null
          doors: number | null
          engine_size: string | null
          enquiries_count: number | null
          features: string[] | null
          finance_check_clear: boolean | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          legal_check_clear: boolean | null
          location: string | null
          make: string
          mileage: number | null
          model: string
          price: number
          registration: string | null
          seller_id: string
          specs: Json | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          transmission: string | null
          updated_at: string
          verified: boolean | null
          views_count: number | null
          vin: string | null
          year: number
        }
        Insert: {
          body_type?: string | null
          color?: string | null
          created_at?: string
          dealer_id?: string | null
          description?: string | null
          doors?: number | null
          engine_size?: string | null
          enquiries_count?: number | null
          features?: string[] | null
          finance_check_clear?: boolean | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          legal_check_clear?: boolean | null
          location?: string | null
          make: string
          mileage?: number | null
          model: string
          price: number
          registration?: string | null
          seller_id: string
          specs?: Json | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          transmission?: string | null
          updated_at?: string
          verified?: boolean | null
          views_count?: number | null
          vin?: string | null
          year: number
        }
        Update: {
          body_type?: string | null
          color?: string | null
          created_at?: string
          dealer_id?: string | null
          description?: string | null
          doors?: number | null
          engine_size?: string | null
          enquiries_count?: number | null
          features?: string[] | null
          finance_check_clear?: boolean | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          legal_check_clear?: boolean | null
          location?: string | null
          make?: string
          mileage?: number | null
          model?: string
          price?: number
          registration?: string | null
          seller_id?: string
          specs?: Json | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          transmission?: string | null
          updated_at?: string
          verified?: boolean | null
          views_count?: number | null
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_listings_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          address: string | null
          approved_by: string | null
          business_email: string | null
          business_name: string
          business_phone: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          kyc_approved_at: string | null
          kyc_submitted_at: string | null
          kyc_verified: boolean | null
          landing_page_config: Json | null
          logo_url: string | null
          max_listings: number | null
          onboarded_by_agent: string | null
          postcode: string | null
          slug: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tier: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          approved_by?: string | null
          business_email?: string | null
          business_name: string
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          kyc_approved_at?: string | null
          kyc_submitted_at?: string | null
          kyc_verified?: boolean | null
          landing_page_config?: Json | null
          logo_url?: string | null
          max_listings?: number | null
          onboarded_by_agent?: string | null
          postcode?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tier?: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          approved_by?: string | null
          business_email?: string | null
          business_name?: string
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          kyc_approved_at?: string | null
          kyc_submitted_at?: string | null
          kyc_verified?: boolean | null
          landing_page_config?: Json | null
          logo_url?: string | null
          max_listings?: number | null
          onboarded_by_agent?: string | null
          postcode?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tier?: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "dealer" | "agent" | "admin"
      dealer_tier: "starter" | "professional" | "enterprise"
      listing_status: "draft" | "active" | "sold" | "expired" | "under_review"
      subscription_status:
        | "active"
        | "past_due"
        | "canceled"
        | "trialing"
        | "incomplete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["buyer", "seller", "dealer", "agent", "admin"],
      dealer_tier: ["starter", "professional", "enterprise"],
      listing_status: ["draft", "active", "sold", "expired", "under_review"],
      subscription_status: [
        "active",
        "past_due",
        "canceled",
        "trialing",
        "incomplete",
      ],
    },
  },
} as const
