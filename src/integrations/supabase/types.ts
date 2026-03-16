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
      bug_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          page_url: string | null
          severity: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          page_url?: string | null
          severity?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          page_url?: string | null
          severity?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      car_listings: {
        Row: {
          body_type: string | null
          color: string | null
          country: string
          created_at: string
          dealer_id: string | null
          description: string | null
          doors: number | null
          engine_size: string | null
          enquiries_count: number | null
          features: string[] | null
          finance_check_clear: boolean | null
          fuel_type: string | null
          hpi_check_data: Json | null
          id: string
          images: string[] | null
          inspection_score: number | null
          is_featured: boolean | null
          is_promoted: boolean | null
          legal_check_clear: boolean | null
          location: string | null
          logbook_url: string | null
          make: string
          mileage: number | null
          model: string
          price: number
          promoted_until: string | null
          registration: string | null
          search_vector: unknown
          seller_id: string
          specs: Json | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          transmission: string | null
          updated_at: string
          verified: boolean | null
          video_url: string | null
          views_count: number | null
          vin: string | null
          year: number
        }
        Insert: {
          body_type?: string | null
          color?: string | null
          country?: string
          created_at?: string
          dealer_id?: string | null
          description?: string | null
          doors?: number | null
          engine_size?: string | null
          enquiries_count?: number | null
          features?: string[] | null
          finance_check_clear?: boolean | null
          fuel_type?: string | null
          hpi_check_data?: Json | null
          id?: string
          images?: string[] | null
          inspection_score?: number | null
          is_featured?: boolean | null
          is_promoted?: boolean | null
          legal_check_clear?: boolean | null
          location?: string | null
          logbook_url?: string | null
          make: string
          mileage?: number | null
          model: string
          price: number
          promoted_until?: string | null
          registration?: string | null
          search_vector?: unknown
          seller_id: string
          specs?: Json | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          transmission?: string | null
          updated_at?: string
          verified?: boolean | null
          video_url?: string | null
          views_count?: number | null
          vin?: string | null
          year: number
        }
        Update: {
          body_type?: string | null
          color?: string | null
          country?: string
          created_at?: string
          dealer_id?: string | null
          description?: string | null
          doors?: number | null
          engine_size?: string | null
          enquiries_count?: number | null
          features?: string[] | null
          finance_check_clear?: boolean | null
          fuel_type?: string | null
          hpi_check_data?: Json | null
          id?: string
          images?: string[] | null
          inspection_score?: number | null
          is_featured?: boolean | null
          is_promoted?: boolean | null
          legal_check_clear?: boolean | null
          location?: string | null
          logbook_url?: string | null
          make?: string
          mileage?: number | null
          model?: string
          price?: number
          promoted_until?: string | null
          registration?: string | null
          search_vector?: unknown
          seller_id?: string
          specs?: Json | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          transmission?: string | null
          updated_at?: string
          verified?: boolean | null
          video_url?: string | null
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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      dealer_landing_public: {
        Row: {
          business_name: string | null
          city: string | null
          country: string | null
          description: string | null
          id: string
          is_active: boolean | null
          kyc_verified: boolean | null
          landing_page_config: Json | null
          logo_url: string | null
          slug: string | null
          tier: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          kyc_verified?: boolean | null
          landing_page_config?: Json | null
          logo_url?: string | null
          slug?: string | null
          tier?: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kyc_verified?: boolean | null
          landing_page_config?: Json | null
          logo_url?: string | null
          slug?: string | null
          tier?: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
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
      dealers_public: {
        Row: {
          business_name: string | null
          city: string | null
          country: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          slug: string | null
          tier: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          logo_url?: string | null
          slug?: string | null
          tier?: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          slug?: string | null
          tier?: Database["public"]["Enums"]["dealer_tier"] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          message: string
          replied_at: string | null
          reply: string | null
          seller_id: string
          sender_email: string | null
          sender_id: string
          sender_name: string | null
          sender_phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          message: string
          replied_at?: string | null
          reply?: string | null
          seller_id: string
          sender_email?: string | null
          sender_id: string
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          message?: string
          replied_at?: string | null
          reply?: string | null
          seller_id?: string
          sender_email?: string | null
          sender_id?: string
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_reports: {
        Row: {
          created_at: string
          id: string
          inspector_name: string | null
          listing_id: string
          report_url: string | null
          score: number
          summary: string | null
          total_points: number
        }
        Insert: {
          created_at?: string
          id?: string
          inspector_name?: string | null
          listing_id: string
          report_url?: string | null
          score?: number
          summary?: string | null
          total_points?: number
        }
        Update: {
          created_at?: string
          id?: string
          inspector_name?: string | null
          listing_id?: string
          report_url?: string | null
          score?: number
          summary?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_views: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          listing_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          listing_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          listing_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          listing_id: string | null
          read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_leads: {
        Row: {
          actual_value: number | null
          assigned_to: string | null
          buyer_email: string | null
          buyer_id: string | null
          buyer_name: string | null
          buyer_phone: string | null
          closed_at: string | null
          created_at: string
          dealer_id: string | null
          expected_value: number | null
          id: string
          listing_id: string | null
          lost_reason: string | null
          notes: string | null
          seller_id: string
          source: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          updated_at: string
        }
        Insert: {
          actual_value?: number | null
          assigned_to?: string | null
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          closed_at?: string | null
          created_at?: string
          dealer_id?: string | null
          expected_value?: number | null
          id?: string
          listing_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          seller_id: string
          source?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Update: {
          actual_value?: number | null
          assigned_to?: string | null
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          closed_at?: string | null
          created_at?: string
          dealer_id?: string | null
          expected_value?: number | null
          id?: string
          listing_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          seller_id?: string
          source?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_leads_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_at: string
          id: string
          listing_id: string
          new_price: number
          old_price: number
        }
        Insert: {
          changed_at?: string
          id?: string
          listing_id: string
          new_price: number
          old_price: number
        }
        Update: {
          changed_at?: string
          id?: string
          listing_id?: string
          new_price?: number
          old_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
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
      profiles_public: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_cars: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_cars_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          notify: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          notify?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          notify?: boolean
          user_id?: string
        }
        Relationships: []
      }
      seller_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          reviewer_id: string
          seller_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          reviewer_id: string
          seller_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          reviewer_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
        ]
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
      pipeline_stage:
        | "lead"
        | "enquiry"
        | "viewing"
        | "offer"
        | "negotiation"
        | "sold"
        | "lost"
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
      pipeline_stage: [
        "lead",
        "enquiry",
        "viewing",
        "offer",
        "negotiation",
        "sold",
        "lost",
      ],
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
