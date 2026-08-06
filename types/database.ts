export type AccountRole = 'pribadi' | 'kontrakan';
export type WalletType = 'bank' | 'ewallet' | 'cash';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type HouseMemberRole = 'admin' | 'member';
export type SharedExpenseStatus = 'pending' | 'settled';
export type SplitStatus = 'unpaid' | 'paid';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  phone_number?: string | null;
  account_role: AccountRole;
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
  wallet?: Wallet;
  to_wallet?: Wallet;
}

export interface House {
  id: string;
  name: string;
  address?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HouseMember {
  id: string;
  house_id: string;
  user_id: string;
  role: HouseMemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface SharedExpense {
  id: string;
  house_id: string;
  paid_by: string;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  status: SharedExpenseStatus;
  receipt_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  payer?: Profile;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  shared_expense_id: string;
  user_id: string;
  amount_due: number;
  status: SplitStatus;
  proof_url?: string | null;
  paid_at?: string | null;
  created_at: string;
  user?: Profile;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Wallet, 'id' | 'user_id'>>;
      };
      personal_transactions: {
        Row: PersonalTransaction;
        Insert: Omit<PersonalTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<PersonalTransaction, 'id' | 'user_id'>>;
      };
      houses: {
        Row: House;
        Insert: Omit<House, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<House, 'id' | 'created_by'>>;
      };
      house_members: {
        Row: HouseMember;
        Insert: Omit<HouseMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<HouseMember, 'id'>>;
      };
      shared_expenses: {
        Row: SharedExpense;
        Insert: Omit<SharedExpense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SharedExpense, 'id'>>;
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: Omit<ExpenseSplit, 'id' | 'created_at'>;
        Update: Partial<Omit<ExpenseSplit, 'id'>>;
      };
    };
  };
}
