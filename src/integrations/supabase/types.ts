export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      alerts: {
        Row: {
          business_id: string;
          created_at: string;
          dedupe_day: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          message: string;
          read: boolean;
          severity: string;
          title: string;
          type: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          dedupe_day?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          message?: string;
          read?: boolean;
          severity?: string;
          title: string;
          type: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          dedupe_day?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          message?: string;
          read?: boolean;
          severity?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          average_ticket_cents: number | null;
          business_type: string | null;
          created_at: string;
          critical_margin_percentage: number;
          id: string;
          monthly_revenue_cents: number | null;
          monthly_sales: number | null;
          name: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          pro_labore_cents: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          average_ticket_cents?: number | null;
          business_type?: string | null;
          created_at?: string;
          critical_margin_percentage?: number;
          id?: string;
          monthly_revenue_cents?: number | null;
          monthly_sales?: number | null;
          name?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          pro_labore_cents?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          average_ticket_cents?: number | null;
          business_type?: string | null;
          created_at?: string;
          critical_margin_percentage?: number;
          id?: string;
          monthly_revenue_cents?: number | null;
          monthly_sales?: number | null;
          name?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          pro_labore_cents?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fixed_costs: {
        Row: {
          amount_cents: number;
          business_id: string;
          category: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          amount_cents?: number;
          business_id: string;
          category?: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          business_id?: string;
          category?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fixed_costs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          base_quantity: number;
          base_unit: string;
          business_id: string;
          category: string;
          created_at: string;
          id: string;
          name: string;
          purchase_date: string | null;
          purchase_price_cents: number;
          purchase_quantity: number;
          purchase_unit: string;
          supplier: string | null;
          unit_cost_cents: number;
          updated_at: string;
        };
        Insert: {
          base_quantity?: number;
          base_unit?: string;
          business_id: string;
          category?: string;
          created_at?: string;
          id?: string;
          name: string;
          purchase_date?: string | null;
          purchase_price_cents?: number;
          purchase_quantity?: number;
          purchase_unit?: string;
          supplier?: string | null;
          unit_cost_cents?: number;
          updated_at?: string;
        };
        Update: {
          base_quantity?: number;
          base_unit?: string;
          business_id?: string;
          category?: string;
          created_at?: string;
          id?: string;
          name?: string;
          purchase_date?: string | null;
          purchase_price_cents?: number;
          purchase_quantity?: number;
          purchase_unit?: string;
          supplier?: string | null;
          unit_cost_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingredients_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      product_channels: {
        Row: {
          created_at: string;
          current_price_cents: number;
          healthy_price_cents: number;
          id: string;
          minimum_price_cents: number;
          product_id: string;
          sales_channel_id: string;
          strategic_price_cents: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_price_cents?: number;
          healthy_price_cents?: number;
          id?: string;
          minimum_price_cents?: number;
          product_id: string;
          sales_channel_id: string;
          strategic_price_cents?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_price_cents?: number;
          healthy_price_cents?: number;
          id?: string;
          minimum_price_cents?: number;
          product_id?: string;
          sales_channel_id?: string;
          strategic_price_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_channels_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_channels_sales_channel_id_fkey";
            columns: ["sales_channel_id"];
            isOneToOne: false;
            referencedRelation: "sales_channels";
            referencedColumns: ["id"];
          },
        ];
      };
      product_direct_costs: {
        Row: {
          amount_cents: number;
          created_at: string;
          id: string;
          kind: string;
          name: string;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          amount_cents?: number;
          created_at?: string;
          id?: string;
          kind?: string;
          name: string;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_direct_costs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_ingredients: {
        Row: {
          calculated_cost_cents: number;
          created_at: string;
          id: string;
          ingredient_id: string;
          product_id: string;
          quantity_used: number;
          unit_used: string;
          updated_at: string;
        };
        Insert: {
          calculated_cost_cents?: number;
          created_at?: string;
          id?: string;
          ingredient_id: string;
          product_id: string;
          quantity_used?: number;
          unit_used?: string;
          updated_at?: string;
        };
        Update: {
          calculated_cost_cents?: number;
          created_at?: string;
          id?: string;
          ingredient_id?: string;
          product_id?: string;
          quantity_used?: number;
          unit_used?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          adjusted_cost_cents: number;
          business_id: string;
          category: string;
          created_at: string;
          current_price_cents: number;
          description: string;
          direct_cost_cents: number;
          id: string;
          image_url: string | null;
          name: string;
          status: string;
          target_margin: number;
          updated_at: string;
          waste_cost_cents: number;
          waste_percentage: number;
        };
        Insert: {
          adjusted_cost_cents?: number;
          business_id: string;
          category?: string;
          created_at?: string;
          current_price_cents?: number;
          description?: string;
          direct_cost_cents?: number;
          id?: string;
          image_url?: string | null;
          name: string;
          status?: string;
          target_margin?: number;
          updated_at?: string;
          waste_cost_cents?: number;
          waste_percentage?: number;
        };
        Update: {
          adjusted_cost_cents?: number;
          business_id?: string;
          category?: string;
          created_at?: string;
          current_price_cents?: number;
          description?: string;
          direct_cost_cents?: number;
          id?: string;
          image_url?: string | null;
          name?: string;
          status?: string;
          target_margin?: number;
          updated_at?: string;
          waste_cost_cents?: number;
          waste_percentage?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string;
          id: string;
          name?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales_channels: {
        Row: {
          business_id: string;
          card_fee_percentage: number;
          commission_percentage: number;
          created_at: string;
          delivery_fee_percentage: number;
          id: string;
          marketplace_fee_percentage: number;
          name: string;
          other_fee_percentage: number;
          tax_percentage: number;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          card_fee_percentage?: number;
          commission_percentage?: number;
          created_at?: string;
          delivery_fee_percentage?: number;
          id?: string;
          marketplace_fee_percentage?: number;
          name: string;
          other_fee_percentage?: number;
          tax_percentage?: number;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          card_fee_percentage?: number;
          commission_percentage?: number;
          created_at?: string;
          delivery_fee_percentage?: number;
          id?: string;
          marketplace_fee_percentage?: number;
          name?: string;
          other_fee_percentage?: number;
          tax_percentage?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_channels_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          billing_cycle: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          plan: string;
          provider: string;
          provider_subscription_id: string | null;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          billing_cycle?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan?: string;
          provider?: string;
          provider_subscription_id?: string | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          billing_cycle?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan?: string;
          provider?: string;
          provider_subscription_id?: string | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_my_workspace: {
        Args: { business_name?: string };
        Returns: {
          average_ticket_cents: number | null;
          business_type: string | null;
          created_at: string;
          critical_margin_percentage: number;
          id: string;
          monthly_revenue_cents: number | null;
          monthly_sales: number | null;
          name: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          pro_labore_cents: number;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "businesses";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_onboarding_step: {
        Args: {
          average_ticket_value_cents?: number;
          business_kind?: string;
          complete_onboarding?: boolean;
          monthly_revenue_value_cents?: number;
          monthly_sales_value?: number;
          pro_labore_value_cents?: number;
          step_number: number;
          target_business_id: string;
        };
        Returns: {
          average_ticket_cents: number | null;
          business_type: string | null;
          created_at: string;
          critical_margin_percentage: number;
          id: string;
          monthly_revenue_cents: number | null;
          monthly_sales: number | null;
          name: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          pro_labore_cents: number;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "businesses";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
