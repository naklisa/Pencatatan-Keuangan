export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WalletType = 'bank' | 'ewallet' | 'cash';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  phone_number?: string | null;
  telegram_chat_id?: string | null;
  updated_at: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  icon?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  to_wallet_id?: string | null;
  amount: number;
  type: TransactionType;
  category: string;
  notes?: string | null;
  date: string;
  created_at: string;
  wallet?: { name: string; type: WalletType } | Wallet;
  to_wallet?: { name: string; type: WalletType } | Wallet;
}

export type Database = {
  public: {
    Tables: {
      personal_transactions: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          to_wallet_id: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
          wallet_id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          to_wallet_id?: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
          wallet_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          to_wallet_id?: string | null;
          type?: Database["public"]["Enums"]["transaction_type"];
          user_id?: string;
          wallet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "personal_transactions_to_wallet_id_fkey";
            columns: ["to_wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_transactions_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          phone_number: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          phone_number?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          phone_number?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: {
          balance: number;
          created_at: string;
          icon: string | null;
          id: string;
          is_active: boolean;
          name: string;
          type: Database["public"]["Enums"]["wallet_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          type: Database["public"]["Enums"]["wallet_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          type?: Database["public"]["Enums"]["wallet_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      transaction_type: "income" | "expense" | "transfer";
      wallet_type: "bank" | "ewallet" | "cash";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
