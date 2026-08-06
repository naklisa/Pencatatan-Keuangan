'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, TransactionType } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Wallet as WalletIcon, 
  Calendar, 
  Tag, 
  FileText,
  Loader2
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

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          Tambah Transaksi Baru
        </h3>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
          Scope: Personal
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Selector Tipe Transaksi */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
            type === 'expense'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" /> Pengeluaran
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
            type === 'income'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" /> Pemasukan
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('transfer')}
          className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
            type === 'transfer'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Transfer
        </button>
      </div>

      {/* Input Nominal */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Nominal (IDR)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
          <input
            type="text"
            required
            placeholder="0"
            value={amountInput}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setAmountInput(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        {rawAmount > 0 && (
          <p className="text-xs text-slate-400 mt-1">Terbilang: <span className="text-emerald-400 font-semibold">{formatRupiah(rawAmount)}</span></p>
        )}
      </div>

      {/* Selection Dompet & Transfer Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-slate-400" />
            {type === 'transfer' ? 'Dari Dompet (Asal)' : 'Dompet / Akun'}
          </label>
          {fetchingWallets ? (
            <div className="h-10 bg-slate-950 border border-slate-800 rounded-lg animate-pulse"></div>
          ) : (
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          )}
        </div>

        {type === 'transfer' && (
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              Ke Dompet (Tujuan)
            </label>
            <select
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {wallets
                .filter((w) => w.id !== walletId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
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
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" /> Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {CATEGORIES[type].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal & Waktu
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Catatan / Keterangan */}
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Catatan / Keterangan (Opsional)</label>
        <input
          type="text"
          placeholder="Misal: Makan siang Nasi Padang..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || fetchingWallets}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
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
