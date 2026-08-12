# 💰 Pencatatan Keuangan Pribadi (Personal Finance App)

Aplikasi manajemen dan pencatatan keuangan pribadi modern, responsif, dan kaya fitur yang dibangun menggunakan **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase PostgreSQL**, serta terintegrasi penuh dengan **Telegram Bot (`@DuidNa_bot`)** dan **Gemini AI**.

---

## ✨ Fitur-Fitur Utama (Key Features)

### 📊 1. Dashboard Keuangan Interaktif & Real-Time
- **Total Net Worth Consolidation**: Menghitung akumulasi seluruh kekayaan bersih secara otomatis dari akun dompet aktif.
- **Independent Balance Eye Toggle (Fitur Sembunyikan Saldo)**: Setiap kartu nominal (**Net Worth**, **Rekening Bank**, **E-Wallet**, **Cash/Tunai**) memiliki ikon mata (*Eye / EyeOff*) independen untuk menyembunyikan saldo (`Rp ••••••••`). Status tersimpan di `localStorage`.
- **Breakdown Kategori Dompet**: Kartu metallic bergaya platinum untuk Rekening Bank, E-Wallet, dan Cash/Tunai dengan ilustrasi 3D yang elegan.

### 📝 2. Modal Form Catat Transaksi (Auto-Close)
- Mendukung 3 kategori transaksi utama: **Pengeluaran**, **Pemasukan**, dan **Transfer Internal**.
- Pilihan tanggal cepat (*Sekarang*, *Hari Ini*, *Kemarin*) dan fitur terbilang otomatis (misal: *Tiga Puluh Lima Ribu Rupiah*).
- **Auto-Close Modal**: Popup modal otomatis langsung tertutup begitu transaksi berhasil disimpan.

### 📜 3. Halaman Detail Riwayat Transaksi Lengkap (`/transactions`)
- Dashboard membatasi tampilan ringkasan menjadi **3 transaksi paling baru**.
- Halaman dedicated baru `/transactions` menampilkan seluruh riwayat transaksi secara rinci.
- **Filter & Pencarian**: Filter tipe transaksi (*Pengeluaran*, *Pemasukan*, *Transfer*), filter dropdown kategori, serta pencarian teks (*catatan, nama dompet, atau nominal*).

### ✏️ 4. Edit & Hapus Transaksi (Otomasi Saldo Database)
- Tombol aksi **Edit** (ikon pensil) dan **Hapus** (ikon tempat sampah) pada setiap item transaksi.
- Didukung oleh trigger PostgreSQL Supabase (`trg_manage_wallet_balance`) yang secara otomatis menghitung ulang dan menyesuaikan saldo dompet saat transaksi di-edit atau di-hapus.

---

## 🤖 Integrasi Telegram Bot (@DuidNa_bot)

Aplikasi terhubung langsung dengan **Bot Telegram `@DuidNa_bot`**, memungkinkan pencatatan tanpa perlu membuka aplikasi web!

### 💬 Perintah & Fitur Telegram Bot:
| Perintah / Format Chat | Deskripsi & Contoh |
| :--- | :--- |
| **Catat Pengeluaran** | `Makan Nasi Padang 35rb bca` |
| **Catat Pemasukan** | `Pemasukan gaji 5jt bca` |
| **Catat Transfer** | `Transfer 200rb bca dana` |
| 📷 **Foto Struk Belanja (AI OCR)** | Cukup kirimkan foto struk kasir (Indomaret, Alfamart, Resto) $\rightarrow$ AI membaca toko, nominal, & mencatat otomatis. |
| 💬 **Tanya AI Keuangan** | Chat santai dengan bot: *"Berapa pengeluaran makan gua bulan ini?"* atau *"Tips hemat dong bro"*. |
| 📊 `/saldo` | Menampilkan ringkasan saldo seluruh dompet aktif dan Total Net Worth. |
| 📈 `/rekap` | Menampilkan rekapitulasi pengeluaran bulanan, net cashflow, & kategori terboros. |
| 📖 `/help` | Menampilkan menu bantuan lengkap dan panduan perintah bot. |

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

- **Frontend / Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend & Database**: Supabase PostgreSQL (RLS & SECURITY DEFINER Functions)
- **AI & OCR**: Google Gemini 1.5 Flash Vision & Chat API
- **Bot Integration**: Telegram Bot API (Webhook)

---

## ⚙️ Panduan Instalasi & Konfigurasi (Setup Guide)

### 1. Clone Repositori & Install Dependensi
```bash
git clone https://github.com/naklisa/Pencatatan-Keuangan.git
cd Pencatatan-Keuangan
npm install
```

### 2. Konfigurasi File `.env.local`
Buat berkas `.env.local` di *root project* dan isi konfigurasi berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
TELEGRAM_BOT_TOKEN=8842472261:AAEzgnmqZj41BjTV3LeSbmgGUav-P5rX5LA
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Setup Database Supabase
Jalankan query SQL berikut di **Supabase SQL Editor** untuk membuat tabel, trigger saldo, dan fungsi RPC bypass RLS Telegram:

```sql
-- Tambah kolom telegram_chat_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);

-- Fungsi RPC Telegram Bypass RLS
CREATE OR REPLACE FUNCTION public.pair_telegram_chat_id(p_user_id UUID, p_chat_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles SET telegram_chat_id = p_chat_id, updated_at = NOW() WHERE id = p_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_profile_by_telegram_chat_id(p_chat_id TEXT)
RETURNS TABLE (id UUID, full_name TEXT, avatar_url TEXT, phone_number TEXT, telegram_chat_id TEXT) AS $$
BEGIN
    RETURN QUERY SELECT p.id, p.full_name, p.avatar_url, p.phone_number, p.telegram_chat_id FROM public.profiles p WHERE p.telegram_chat_id = p_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_wallets_by_telegram_chat_id(p_chat_id TEXT)
RETURNS TABLE (id UUID, user_id UUID, name TEXT, type wallet_type, balance NUMERIC, icon TEXT, is_active BOOLEAN) AS $$
BEGIN
    RETURN QUERY SELECT w.id, w.user_id, w.name, w.type, w.balance, w.icon, w.is_active FROM public.wallets w JOIN public.profiles p ON p.id = w.user_id WHERE p.telegram_chat_id = p_chat_id AND w.is_active = TRUE ORDER BY w.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.insert_telegram_transaction(
    p_chat_id TEXT, p_wallet_id UUID, p_to_wallet_id UUID, p_amount NUMERIC, p_type transaction_type, p_category TEXT, p_notes TEXT
)
RETURNS TABLE (transaction_id UUID, updated_balance NUMERIC) AS $$
DECLARE v_user_id UUID; v_tx_id UUID; v_new_bal NUMERIC;
BEGIN
    SELECT p.id INTO v_user_id FROM public.profiles p WHERE p.telegram_chat_id = p_chat_id;
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
    INSERT INTO public.personal_transactions (user_id, wallet_id, to_wallet_id, amount, type, category, notes, date)
    VALUES (v_user_id, p_wallet_id, p_to_wallet_id, p_amount, p_type, p_category, p_notes, NOW()) RETURNING id INTO v_tx_id;
    SELECT balance INTO v_new_bal FROM public.wallets WHERE id = p_wallet_id;
    RETURN QUERY SELECT v_tx_id, v_new_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Jalankan Aplikasi Server Lokal
```bash
npm run dev
```
Akses aplikasi di browser pada: `http://localhost:3000`

---

## 📄 Lisensi
Hak Cipta © 2026 **Pencatatan Keuangan Pribadi**. Dikembangkan untuk pengelolaan finansial yang lebih mudah dan cerdas.
