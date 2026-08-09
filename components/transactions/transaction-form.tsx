'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, TransactionType } from '@/types/database';
import { formatRupiah, terbilang } from '@/lib/utils';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Wallet as WalletIcon, 
  Calendar, 
  Tag, 
  FileText,
  Loader2,
  Clock,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  CircleDollarSign
} from 'lucide-react';

interface TransactionFormProps {
  onSuccess?: () => void;
}

const CATEGORIES = {
  expense: ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas', 'Hiburan', 'Lainnya'],
  income: ['Gaji', 'Bonus', 'Investasi', 'Penjualan', 'Lainnya'],
  transfer: ['Transfer Internal', 'Pindah Saldo'],
};

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const supabase = createClient();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWallets, setFetchingWallets] = useState(true);

  // Form States
  const [type, setType] = useState<TransactionType>('expense');
  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORIES.expense[0]);
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadWallets() {
      setFetchingWallets(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && data) {
        setWallets(data);
        if (data.length > 0) {
          setWalletId(data[0].id);
          if (data.length > 1) {
            setToWalletId(data[1].id);
          }
        }
      }
      setFetchingWallets(false);
    }

    loadWallets();
  }, []);

  // Sync default categories on type change
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
    setErrorMsg(null);
  };

  const handleSetQuickDate = (mode: 'now' | 'today' | 'yesterday') => {
    const now = new Date();
    if (mode === 'now') {
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDate(localIso);
    } else if (mode === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
      const localIso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDate(localIso);
    } else if (mode === 'yesterday') {
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 0, 0);
      const localIso = new Date(yest.getTime() - yest.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDate(localIso);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseFloat(amountInput.replace(/[^0-9]/g, ''));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Masukkan jumlah nominal transaksi yang valid.');
      return;
    }

    if (!walletId) {
      setErrorMsg('Pilih dompet asal transaksi.');
      return;
    }

    if (type === 'transfer') {
      if (!toWalletId) {
        setErrorMsg('Pilih dompet tujuan transfer.');
        return;
      }
      if (walletId === toWalletId) {
        setErrorMsg('Dompet asal dan dompet tujuan tidak boleh sama.');
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna tidak terautentikasi.');

      const { error } = await supabase.from('personal_transactions').insert({
        user_id: user.id,
        wallet_id: walletId,
        to_wallet_id: type === 'transfer' ? toWalletId : null,
        amount: numericAmount,
        type,
        category,
        notes: notes.trim() || null,
        date: new Date(date).toISOString(),
      });

      if (error) throw error;

      // Reset form
      setAmountInput('');
      setNotes('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const rawAmount = parseFloat(amountInput.replace(/[^0-9]/g, '')) || 0;
  const terbilangText = terbilang(rawAmount);

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <span>Tambah Transaksi Baru</span>
        </h3>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Selector Tipe Transaksi (Pill buttons matching mockup) */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            type === 'expense'
              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" /> Pengeluaran
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            type === 'income'
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" /> Pemasukan
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('transfer')}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            type === 'transfer'
              ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Transfer
        </button>
      </div>

      {/* Input Nominal */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
          NOMINAL (IDR)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">Rp</span>
          <input
            type="text"
            required
            placeholder="0"
            value={amountInput}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setAmountInput(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
            }}
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-3.5 text-2xl font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
          />
        </div>
        {rawAmount > 0 && terbilangText && (
          <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
            <span className="text-slate-400 font-semibold">Terbilang: </span>
            <span className="text-emerald-400 font-bold italic">{terbilangText}</span>
          </div>
        )}
      </div>

      {/* Selection Dompet & Transfer Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-slate-400" />
            {type === 'transfer' ? 'DARI DOMPET (ASAL)' : 'DOMPET / AKUN'}
          </label>
          {fetchingWallets ? (
            <div className="h-11 bg-slate-950 border border-slate-800 rounded-2xl animate-pulse"></div>
          ) : (
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          )}
        </div>

        {type === 'transfer' && (
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              KE DOMPET (TUJUAN)
            </label>
            <select
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-blue-500"
            >
              {wallets
                .filter((w) => w.id !== walletId)
                .map((w) => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Kategori & Tanggal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" /> KATEGORI
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
          >
            {CATEGORIES[type].map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> TANGGAL & WAKTU
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSetQuickDate('now')}
                className="text-[10px] bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 px-2 py-0.5 rounded-lg transition flex items-center gap-1"
              >
                <Clock className="w-2.5 h-2.5" /> Sekarang
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('today')}
                className="text-[10px] bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 px-2 py-0.5 rounded-lg transition"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate('yesterday')}
                className="text-[10px] bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 px-2 py-0.5 rounded-lg transition"
              >
                Kemarin
              </button>
            </div>
          </div>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Catatan / Keterangan */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">CATATAN / KETERANGAN (OPSIONAL)</label>
        <input
          type="text"
          placeholder="Misal: Makan siang Nasi Padang..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Submit Button (Matching Mockup) */}
      <button
        type="submit"
        disabled={loading || fetchingWallets}
        className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan Transaksi...
          </>
        ) : (
          'Simpan Transaksi'
        )}
      </button>
    </form>
  );
}
