'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Wallet, PersonalTransaction } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { 
  Wallet as WalletIcon, 
  Building2, 
  Smartphone, 
  Banknote, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Loader2,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { TransactionModal } from '@/components/modals/transaction-modal';

export default function DashboardPage() {
  const supabase = createClient();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch User Wallets
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    // Fetch Recent Personal Transactions
    const { data: txData } = await supabase
      .from('personal_transactions')
      .select(`
        *,
        wallet:wallets!wallet_id(name, type),
        to_wallet:wallets!to_wallet_id(name, type)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);

    if (walletData) setWallets(walletData);
    if (txData) setRecentTransactions(txData as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Aggregation Math
  const netWorth = wallets.reduce((acc, w) => acc + Number(w.balance), 0);
  const totalBank = wallets.filter(w => w.type === 'bank').reduce((acc, w) => acc + Number(w.balance), 0);
  const totalEWallet = wallets.filter(w => w.type === 'ewallet').reduce((acc, w) => acc + Number(w.balance), 0);
  const totalCash = wallets.filter(w => w.type === 'cash').reduce((acc, w) => acc + Number(w.balance), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            Dashboard Keuangan
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">Pantau total kekayaan bersih (Net Worth) dan arus kas real-time anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-200 font-semibold rounded-xl transition-all shadow-md"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Statistik & Laporan
          </Link>
          <button
            onClick={() => setShowTransactionModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" /> Catat Transaksi
          </button>
        </div>
      </div>

      {/* Transaction Modal Popup */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSuccess={fetchDashboardData}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Net Worth Summary Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/80 border border-emerald-500/30 rounded-3xl p-6 md:p-10 shadow-2xl shadow-emerald-950/30">
            <div className="relative z-10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Total Net Worth
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">{formatRupiah(netWorth)}</h2>
              <p className="text-xs md:text-sm text-slate-400 pt-1">
                Terkonsolidasi dari <span className="text-white font-bold">{wallets.length} akun dompet</span> aktif.
              </p>
            </div>
            <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
              <WalletIcon className="w-64 h-64 text-emerald-400" />
            </div>
          </div>

          {/* Wallet Type Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3 hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rekening Bank</span>
                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-100">{formatRupiah(totalBank)}</p>
              <div className="text-xs text-slate-500">
                {wallets.filter(w => w.type === 'bank').length} Akun Bank
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">E-Wallet</span>
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-100">{formatRupiah(totalEWallet)}</p>
              <div className="text-xs text-slate-500">
                {wallets.filter(w => w.type === 'ewallet').length} Akun E-Wallet
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash / Tunai</span>
                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-100">{formatRupiah(totalCash)}</p>
              <div className="text-xs text-slate-500">
                {wallets.filter(w => w.type === 'cash').length} Akun Tunai
              </div>
            </div>
          </div>

          {/* Rincian Riwayat Transaksi Terakhir */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">Riwayat Transaksi Terakhir</h3>
              <Link href="/reports" className="text-xs text-emerald-400 hover:underline font-semibold">
                Lihat Laporan Lengkap ➔
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Belum ada catatan transaksi. Klik "Catat Transaksi" untuk memulai.</p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between text-sm hover:bg-slate-800/30 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tx.type === 'expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {tx.type === 'income' && <ArrowDownLeft className="w-4 h-4" />}
                        {tx.type === 'expense' && <ArrowUpRight className="w-4 h-4" />}
                        {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{tx.category}</p>
                        <p className="text-xs text-slate-400">
                          {tx.type === 'transfer' 
                            ? `${tx.wallet?.name} ➔ ${tx.to_wallet?.name}`
                            : tx.wallet?.name}
                          {tx.notes ? ` • "${tx.notes}"` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-base ${
                        tx.type === 'income' ? 'text-emerald-400' :
                        tx.type === 'expense' ? 'text-rose-400' :
                        'text-slate-300'
                      }`}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatRupiah(Number(tx.amount))}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
