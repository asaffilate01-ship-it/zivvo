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
      auction_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          auction_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          auction_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          auction_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_audit_log_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          deposit_verified: boolean | null
          finance_preapproved: boolean | null
          id: string
          ip_address: string | null
          is_auto_bid: boolean | null
          is_winning: boolean | null
          max_auto_bid: number | null
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          deposit_verified?: boolean | null
          finance_preapproved?: boolean | null
          id?: string
          ip_address?: string | null
          is_auto_bid?: boolean | null
          is_winning?: boolean | null
          max_auto_bid?: number | null
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          deposit_verified?: boolean | null
          finance_preapproved?: boolean | null
          id?: string
          ip_address?: string | null
          is_auto_bid?: boolean | null
          is_winning?: boolean | null
          max_auto_bid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_contracts: {
        Row: {
          auction_id: string
          buyer_id: string
          buyer_ip: string | null
          buyer_signed: boolean | null
          buyer_signed_at: string | null
          contract_html: string | null
          created_at: string
          escrow_id: string | null
          id: string
          seller_id: string
          seller_ip: string | null
          seller_signed: boolean | null
          seller_signed_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          auction_id: string
          buyer_id: string
          buyer_ip?: string | null
          buyer_signed?: boolean | null
          buyer_signed_at?: string | null
          contract_html?: string | null
          created_at?: string
          escrow_id?: string | null
          id?: string
          seller_id: string
          seller_ip?: string | null
          seller_signed?: boolean | null
          seller_signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          auction_id?: string
          buyer_id?: string
          buyer_ip?: string | null
          buyer_signed?: boolean | null
          buyer_signed_at?: string | null
          contract_html?: string | null
          created_at?: string
          escrow_id?: string | null
          id?: string
          seller_id?: string
          seller_ip?: string | null
          seller_signed?: boolean | null
          seller_signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_contracts_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_contracts_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "auction_escrow"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_deposits: {
        Row: {
          amount: number
          auction_id: string
          authorized_at: string | null
          captured_at: string | null
          created_at: string
          id: string
          released_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          authorized_at?: string | null
          captured_at?: string | null
          created_at?: string
          id?: string
          released_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          authorized_at?: string | null
          captured_at?: string | null
          created_at?: string
          id?: string
          released_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_deposits_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_escrow: {
        Row: {
          auction_id: string
          buyer_id: string
          buyer_premium: number
          contract_signed: boolean | null
          created_at: string
          id: string
          keys_handed_over: boolean | null
          platform_revenue: number
          released_at: string | null
          seller_fee: number
          seller_id: string
          status: Database["public"]["Enums"]["escrow_status"]
          total_amount: number
          updated_at: string
          v5c_received: boolean | null
        }
        Insert: {
          auction_id: string
          buyer_id: string
          buyer_premium?: number
          contract_signed?: boolean | null
          created_at?: string
          id?: string
          keys_handed_over?: boolean | null
          platform_revenue?: number
          released_at?: string | null
          seller_fee?: number
          seller_id: string
          status?: Database["public"]["Enums"]["escrow_status"]
          total_amount: number
          updated_at?: string
          v5c_received?: boolean | null
        }
        Update: {
          auction_id?: string
          buyer_id?: string
          buyer_premium?: number
          contract_signed?: boolean | null
          created_at?: string
          id?: string
          keys_handed_over?: boolean | null
          platform_revenue?: number
          released_at?: string | null
          seller_fee?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["escrow_status"]
          total_amount?: number
          updated_at?: string
          v5c_received?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_escrow_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          anti_snipe_extension_mins: number
          bid_count: number | null
          buyer_premium_pct: number
          collection_address: string | null
          condition_report: Json | null
          created_at: string
          current_bid: number | null
          delivery_available: boolean | null
          delivery_cost_estimate: number | null
          ends_at: string | null
          format: Database["public"]["Enums"]["auction_format"]
          hpi_clear: boolean | null
          id: string
          inspection_rating: number | null
          listing_id: string
          live_event_date: string | null
          live_event_name: string | null
          lot_number: number | null
          original_end_time: string | null
          ownership_verified: boolean | null
          reserve_price: number | null
          seller_fee_pct: number
          seller_id: string
          seller_verified: boolean | null
          starting_price: number
          starts_at: string | null
          status: Database["public"]["Enums"]["auction_status"]
          updated_at: string
          watchers_count: number | null
          winning_bid_id: string | null
        }
        Insert: {
          anti_snipe_extension_mins?: number
          bid_count?: number | null
          buyer_premium_pct?: number
          collection_address?: string | null
          condition_report?: Json | null
          created_at?: string
          current_bid?: number | null
          delivery_available?: boolean | null
          delivery_cost_estimate?: number | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["auction_format"]
          hpi_clear?: boolean | null
          id?: string
          inspection_rating?: number | null
          listing_id: string
          live_event_date?: string | null
          live_event_name?: string | null
          lot_number?: number | null
          original_end_time?: string | null
          ownership_verified?: boolean | null
          reserve_price?: number | null
          seller_fee_pct?: number
          seller_id: string
          seller_verified?: boolean | null
          starting_price?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"]
          updated_at?: string
          watchers_count?: number | null
          winning_bid_id?: string | null
        }
        Update: {
          anti_snipe_extension_mins?: number
          bid_count?: number | null
          buyer_premium_pct?: number
          collection_address?: string | null
          condition_report?: Json | null
          created_at?: string
          current_bid?: number | null
          delivery_available?: boolean | null
          delivery_cost_estimate?: number | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["auction_format"]
          hpi_clear?: boolean | null
          id?: string
          inspection_rating?: number | null
          listing_id?: string
          live_event_date?: string | null
          live_event_name?: string | null
          lot_number?: number | null
          original_end_time?: string | null
          ownership_verified?: boolean | null
          reserve_price?: number | null
          seller_fee_pct?: number
          seller_id?: string
          seller_verified?: boolean | null
          starting_price?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"]
          updated_at?: string
          watchers_count?: number | null
          winning_bid_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "enquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "inspection_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "pipeline_leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          status?: string
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
          {
            foreignKeyName: "saved_cars_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
          {
            foreignKeyName: "seller_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "car_listings_public"
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
      car_listings_public: {
        Row: {
          body_type: string | null
          color: string | null
          country: string | null
          created_at: string | null
          dealer_id: string | null
          description: string | null
          doors: number | null
          engine_size: string | null
          enquiries_count: number | null
          features: string[] | null
          finance_check_clear: boolean | null
          fuel_type: string | null
          id: string | null
          images: string[] | null
          inspection_score: number | null
          is_featured: boolean | null
          is_promoted: boolean | null
          legal_check_clear: boolean | null
          location: string | null
          make: string | null
          mileage: number | null
          model: string | null
          price: number | null
          promoted_until: string | null
          registration: string | null
          search_vector: unknown
          seller_id: string | null
          specs: Json | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string | null
          transmission: string | null
          updated_at: string | null
          verified: boolean | null
          video_url: string | null
          views_count: number | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          color?: string | null
          country?: string | null
          created_at?: string | null
          dealer_id?: string | null
          description?: string | null
          doors?: number | null
          engine_size?: string | null
          enquiries_count?: number | null
          features?: string[] | null
          finance_check_clear?: boolean | null
          fuel_type?: string | null
          id?: string | null
          images?: string[] | null
          inspection_score?: number | null
          is_featured?: boolean | null
          is_promoted?: boolean | null
          legal_check_clear?: boolean | null
          location?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          promoted_until?: string | null
          registration?: string | null
          search_vector?: unknown
          seller_id?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string | null
          transmission?: string | null
          updated_at?: string | null
          verified?: boolean | null
          video_url?: string | null
          views_count?: number | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          color?: string | null
          country?: string | null
          created_at?: string | null
          dealer_id?: string | null
          description?: string | null
          doors?: number | null
          engine_size?: string | null
          enquiries_count?: number | null
          features?: string[] | null
          finance_check_clear?: boolean | null
          fuel_type?: string | null
          id?: string | null
          images?: string[] | null
          inspection_score?: number | null
          is_featured?: boolean | null
          is_promoted?: boolean | null
          legal_check_clear?: boolean | null
          location?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          promoted_until?: string | null
          registration?: string | null
          search_vector?: unknown
          seller_id?: string | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string | null
          transmission?: string | null
          updated_at?: string | null
          verified?: boolean | null
          video_url?: string | null
          views_count?: number | null
          year?: number | null
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
    }
    Functions: {
      get_models_for_make: {
        Args: { _country?: string; _make: string }
        Returns: {
          model: string
        }[]
      }
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
      auction_format: "timed" | "live_event"
      auction_status:
        | "draft"
        | "pending_inspection"
        | "approved"
        | "live"
        | "ended"
        | "sold"
        | "reserve_not_met"
        | "cancelled"
      contract_status:
        | "draft"
        | "pending_buyer"
        | "pending_seller"
        | "signed"
        | "completed"
        | "cancelled"
      dealer_tier: "starter" | "professional" | "enterprise"
      escrow_status:
        | "pending_deposit"
        | "deposit_held"
        | "full_payment_held"
        | "released_to_seller"
        | "refunded"
        | "disputed"
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
      auction_format: ["timed", "live_event"],
      auction_status: [
        "draft",
        "pending_inspection",
        "approved",
        "live",
        "ended",
        "sold",
        "reserve_not_met",
        "cancelled",
      ],
      contract_status: [
        "draft",
        "pending_buyer",
        "pending_seller",
        "signed",
        "completed",
        "cancelled",
      ],
      dealer_tier: ["starter", "professional", "enterprise"],
      escrow_status: [
        "pending_deposit",
        "deposit_held",
        "full_payment_held",
        "released_to_seller",
        "refunded",
        "disputed",
      ],
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
