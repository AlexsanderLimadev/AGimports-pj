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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      automacoes: {
        Row: {
          acao: string
          ativo: boolean
          config: Json
          created_at: string
          deleted_at: string | null
          gatilho: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acao: string
          ativo?: boolean
          config?: Json
          created_at?: string
          deleted_at?: string | null
          gatilho: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acao?: string
          ativo?: boolean
          config?: Json
          created_at?: string
          deleted_at?: string | null
          gatilho?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bi_snapshots: {
        Row: {
          computed_at: string
          created_at: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calculadora_historico: {
        Row: {
          created_at: string
          custo_cents: number
          frete_cents: number
          id: string
          impostos_pct: number
          margem_pct: number
          nome: string | null
          params: Json
          preco_final_cents: number
          user_id: string
        }
        Insert: {
          created_at?: string
          custo_cents?: number
          frete_cents?: number
          id?: string
          impostos_pct?: number
          margem_pct?: number
          nome?: string | null
          params?: Json
          preco_final_cents?: number
          user_id: string
        }
        Update: {
          created_at?: string
          custo_cents?: number
          frete_cents?: number
          id?: string
          impostos_pct?: number
          margem_pct?: number
          nome?: string | null
          params?: Json
          preco_final_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          budget_cents: number
          canal: string
          created_at: string
          deleted_at: string | null
          ends_at: string | null
          gasto_cents: number
          id: string
          nome: string
          receita_cents: number
          starts_at: string | null
          status: Database["public"]["Enums"]["campanha_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_cents?: number
          canal?: string
          created_at?: string
          deleted_at?: string | null
          ends_at?: string | null
          gasto_cents?: number
          id?: string
          nome: string
          receita_cents?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campanha_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_cents?: number
          canal?: string
          created_at?: string
          deleted_at?: string | null
          ends_at?: string | null
          gasto_cents?: number
          id?: string
          nome?: string
          receita_cents?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campanha_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          deleted_at: string | null
          documento: string | null
          email: string | null
          id: string
          nome: string
          notes: string | null
          tags: string[]
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          notes?: string | null
          tags?: string[]
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          notes?: string | null
          tags?: string[]
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_negocio: {
        Row: {
          dias_estoque_parado: number
          margem_minima_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          dias_estoque_parado?: number
          margem_minima_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          dias_estoque_parado?: number
          margem_minima_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          all_day: boolean
          cliente_id: string | null
          created_at: string
          deleted_at: string | null
          descricao: string | null
          ends_at: string | null
          id: string
          pedido_id: string | null
          product_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["evento_status"]
          tipo: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          cliente_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          ends_at?: string | null
          id?: string
          pedido_id?: string | null
          product_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["evento_status"]
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          cliente_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          ends_at?: string | null
          id?: string
          pedido_id?: string | null
          product_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["evento_status"]
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_lancamentos: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          deleted_at: string | null
          descricao: string
          id: string
          pedido_id: string | null
          status: Database["public"]["Enums"]["fin_status"]
          tipo: Database["public"]["Enums"]["fin_tipo"]
          updated_at: string
          user_id: string
          valor_cents: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data?: string
          deleted_at?: string | null
          descricao: string
          id?: string
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["fin_status"]
          tipo: Database["public"]["Enums"]["fin_tipo"]
          updated_at?: string
          user_id: string
          valor_cents: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          deleted_at?: string | null
          descricao?: string
          id?: string
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["fin_status"]
          tipo?: Database["public"]["Enums"]["fin_tipo"]
          updated_at?: string
          user_id?: string
          valor_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_lancamentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      funil_etapas: {
        Row: {
          conv: number
          cor: string | null
          created_at: string
          funil_id: string
          id: string
          nome: string
          ordem: number
          pessoas: number
          updated_at: string
          user_id: string
          valor_cents: number
        }
        Insert: {
          conv?: number
          cor?: string | null
          created_at?: string
          funil_id: string
          id?: string
          nome: string
          ordem?: number
          pessoas?: number
          updated_at?: string
          user_id: string
          valor_cents?: number
        }
        Update: {
          conv?: number
          cor?: string | null
          created_at?: string
          funil_id?: string
          id?: string
          nome?: string
          ordem?: number
          pessoas?: number
          updated_at?: string
          user_id?: string
          valor_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "funil_etapas_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
        ]
      }
      funis: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          alvo: number
          atual: number
          created_at: string
          deleted_at: string | null
          ends_at: string | null
          id: string
          nome: string
          periodo: Database["public"]["Enums"]["meta_periodo"]
          starts_at: string
          tipo: Database["public"]["Enums"]["meta_tipo"]
          updated_at: string
          user_id: string
        }
        Insert: {
          alvo: number
          atual?: number
          created_at?: string
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          nome: string
          periodo?: Database["public"]["Enums"]["meta_periodo"]
          starts_at?: string
          tipo: Database["public"]["Enums"]["meta_tipo"]
          updated_at?: string
          user_id: string
        }
        Update: {
          alvo?: number
          atual?: number
          created_at?: string
          deleted_at?: string | null
          ends_at?: string | null
          id?: string
          nome?: string
          periodo?: Database["public"]["Enums"]["meta_periodo"]
          starts_at?: string
          tipo?: Database["public"]["Enums"]["meta_tipo"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          created_at: string
          descricao_snapshot: string
          id: string
          pedido_id: string
          product_id: string | null
          qty: number
          subtotal_cents: number
          unit_price_cents: number
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao_snapshot: string
          id?: string
          pedido_id: string
          product_id?: string | null
          qty?: number
          subtotal_cents?: number
          unit_price_cents?: number
          user_id: string
        }
        Update: {
          created_at?: string
          descricao_snapshot?: string
          id?: string
          pedido_id?: string
          product_id?: string | null
          qty?: number
          subtotal_cents?: number
          unit_price_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          canal: Database["public"]["Enums"]["pedido_canal"]
          cliente_id: string | null
          cliente_nome_snapshot: string | null
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          numero: number
          status: Database["public"]["Enums"]["pedido_status"]
          total_cents: number
          updated_at: string
          user_id: string
          vendedor_nome: string | null
        }
        Insert: {
          canal?: Database["public"]["Enums"]["pedido_canal"]
          cliente_id?: string | null
          cliente_nome_snapshot?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          numero: number
          status?: Database["public"]["Enums"]["pedido_status"]
          total_cents?: number
          updated_at?: string
          user_id: string
          vendedor_nome?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["pedido_canal"]
          cliente_id?: string | null
          cliente_nome_snapshot?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          numero?: number
          status?: Database["public"]["Enums"]["pedido_status"]
          total_cents?: number
          updated_at?: string
          user_id?: string
          vendedor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          barcode: string | null
          category_id: string | null
          cost_cents: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          min_stock: number
          name: string
          price_cents: number
          sku: string
          stock_qty: number
          supplier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          category_id?: string | null
          cost_cents?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number
          name: string
          price_cents?: number
          sku: string
          stock_qty?: number
          supplier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          barcode?: string | null
          category_id?: string | null
          cost_cents?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number
          name?: string
          price_cents?: number
          sku?: string
          stock_qty?: number
          supplier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          bucket: string
          count: number
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          created_at?: string
          id?: string
          user_id: string
          window_start: string
        }
        Update: {
          bucket?: string
          count?: number
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          move_type: Database["public"]["Enums"]["stock_move_type"]
          note: string | null
          product_id: string
          qty: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          move_type: Database["public"]["Enums"]["stock_move_type"]
          note?: string | null
          product_id: string
          qty: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          move_type?: Database["public"]["Enums"]["stock_move_type"]
          note?: string | null
          product_id?: string
          qty?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_international: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_international?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_international?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          created_at: string
          deleted_at: string | null
          descricao: string | null
          due_at: string | null
          id: string
          prioridade: Database["public"]["Enums"]["tarefa_prioridade"]
          status: Database["public"]["Enums"]["tarefa_status"]
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          due_at?: string | null
          id?: string
          prioridade?: Database["public"]["Enums"]["tarefa_prioridade"]
          status?: Database["public"]["Enums"]["tarefa_status"]
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          due_at?: string | null
          id?: string
          prioridade?: Database["public"]["Enums"]["tarefa_prioridade"]
          status?: Database["public"]["Enums"]["tarefa_status"]
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      purge_old_rate_limit_hits: { Args: never; Returns: undefined }
    }
    Enums: {
      campanha_status: "rascunho" | "ativa" | "pausada" | "finalizada"
      evento_status: "pendente" | "concluido" | "cancelado"
      evento_tipo:
        | "compromisso"
        | "entrega"
        | "cobranca"
        | "reposicao"
        | "reuniao"
        | "outro"
      fin_status: "pendente" | "pago" | "atrasado" | "cancelado"
      fin_tipo: "receita" | "despesa"
      meta_periodo: "mes" | "trimestre" | "ano"
      meta_tipo:
        | "faturamento"
        | "pedidos"
        | "clientes"
        | "lucro"
        | "ticket_medio"
      pedido_canal: "site" | "whatsapp" | "marketplace" | "loja" | "outro"
      pedido_status:
        | "novo"
        | "separacao"
        | "expedicao"
        | "entregue"
        | "cancelado"
      stock_move_type: "in" | "out" | "adjust"
      tarefa_prioridade: "baixa" | "media" | "alta"
      tarefa_status: "todo" | "doing" | "done"
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
      campanha_status: ["rascunho", "ativa", "pausada", "finalizada"],
      evento_status: ["pendente", "concluido", "cancelado"],
      evento_tipo: [
        "compromisso",
        "entrega",
        "cobranca",
        "reposicao",
        "reuniao",
        "outro",
      ],
      fin_status: ["pendente", "pago", "atrasado", "cancelado"],
      fin_tipo: ["receita", "despesa"],
      meta_periodo: ["mes", "trimestre", "ano"],
      meta_tipo: [
        "faturamento",
        "pedidos",
        "clientes",
        "lucro",
        "ticket_medio",
      ],
      pedido_canal: ["site", "whatsapp", "marketplace", "loja", "outro"],
      pedido_status: [
        "novo",
        "separacao",
        "expedicao",
        "entregue",
        "cancelado",
      ],
      stock_move_type: ["in", "out", "adjust"],
      tarefa_prioridade: ["baixa", "media", "alta"],
      tarefa_status: ["todo", "doing", "done"],
    },
  },
} as const
