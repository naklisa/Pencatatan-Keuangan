-- ============================================================================
-- SKEMA DATABASE & SUPABASE SETUP: PENCATATAN KEUANGAN PRIBADI
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE wallet_type AS ENUM ('bank', 'ewallet', 'cash');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');

-- 3. TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL WALLETS (DOMPET / AKUN PENYIMPANAN PRIBADI)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type wallet_type NOT NULL DEFAULT 'bank',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL PERSONAL_TRANSACTIONS (TRANSAKSI PRIBADI)
CREATE TABLE IF NOT EXISTS public.personal_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    type transaction_type NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_transfer_dest CHECK (
        type != 'transfer' OR (to_wallet_id IS NOT NULL AND to_wallet_id != wallet_id)
    )
);

-- ============================================================================
-- INDEXING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tx_user_date ON public.personal_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_tx_wallet ON public.personal_transactions(wallet_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets RLS (Hanya Pemilik Data)
CREATE POLICY "Users can manage own wallets" ON public.wallets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Personal Transactions RLS (Hanya Pemilik Data)
CREATE POLICY "Users can manage own transactions" ON public.personal_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- A. Auto Sync User Profiles & Default Personal Wallets
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Dapatkan wallet default pribadi
    INSERT INTO public.wallets (user_id, name, type, balance, icon)
    VALUES 
        (NEW.id, 'Cash / Tunai', 'cash', 0.00, 'wallet'),
        (NEW.id, 'Bank BCA', 'bank', 0.00, 'building-bank');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- B. Otomasi Balance Update Trigger
CREATE OR REPLACE FUNCTION public.handle_personal_transaction_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'income') THEN
            UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
        ELSIF (NEW.type = 'expense') THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
        ELSIF (NEW.type = 'transfer') THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
            UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.to_wallet_id;
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.type = 'income') THEN
            UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
        ELSIF (OLD.type = 'expense') THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
        ELSIF (OLD.type = 'transfer') THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = NOW() WHERE id = OLD.wallet_id;
            UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = NOW() WHERE id = OLD.to_wallet_id;
        END IF;
        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.type = 'income') THEN
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
        ELSIF (OLD.type = 'expense') THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
        ELSIF (OLD.type = 'transfer') THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.to_wallet_id;
        END IF;

        IF (NEW.type = 'income') THEN
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
        ELSIF (NEW.type = 'expense') THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
        ELSIF (NEW.type = 'transfer') THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.to_wallet_id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_manage_wallet_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.personal_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_personal_transaction_balance();
