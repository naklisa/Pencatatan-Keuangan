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
import { 
  LeatherWalletIllustration, 
  BankBuildingIllustration, 
  SmartphoneIllustration, 
  CashStackIllustration 
} from '@/components/ui/3d-illustrations';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Dashboard Keuangan
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Pantau total kekayaan bersih (Net Worth) dan arus kas real-time anda.</p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/reports"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md text-center"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Statistik & Laporan</span>
          </Link>
          <button
            onClick={() => setShowTransactionModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] text-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Catat Transaksi</span>
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
          <Loader2 className="w-9 h-9 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Net Worth Summary Card (Matching Mockup Image) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-4">
            <div className="relative z-10 max-w-xl space-y-3">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full inline-block">
                TOTAL NET WORTH
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight break-words drop-shadow-md">
                {formatRupiah(netWorth)}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 pt-1">
                Terkonsolidasi dari <span className="text-slate-200 font-bold">{wallets.length} akun dompet</span> aktif.
              </p>
            </div>

            {/* 3D Leather Wallet Illustration on Right Side */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none opacity-90 transition-transform hover:scale-105">
              <LeatherWalletIllustration className="w-44 h-44 md:w-56 md:h-56 drop-shadow-2xl" />
            </div>
          </div>

          {/* Wallet Type Breakdown (Brushed Platinum Metallic Cards matching mockup) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/90 to-slate-950 border-t border-slate-700/60 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">REKENING BANK</span>
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-black text-white tracking-tight mt-3 break-words">{formatRupiah(totalBank)}</p>
              <div className="text-xs font-medium text-slate-400 mt-1">
                {wallets.filter(w => w.type === 'bank').length} Akun Bank
              </div>
              
              <div className="absolute right-2 -bottom-2 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
                <BankBuildingIllustration className="w-20 h-20" />
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/90 to-slate-950 border-t border-slate-700/60 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">E-WALLET</span>
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <p className="text-2xl font-black text-white tracking-tight mt-3 break-words">{formatRupiah(totalEWallet)}</p>
              <div className="text-xs font-medium text-slate-400 mt-1">
                {wallets.filter(w => w.type === 'ewallet').length} Akun E-Wallet
              </div>

              <div className="absolute right-2 -bottom-2 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
                <SmartphoneIllustration className="w-20 h-20" />
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/90 to-slate-950 border-t border-slate-700/60 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">CASH / TUNAI</span>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-black text-white tracking-tight mt-3 break-words">{formatRupiah(totalCash)}</p>
              <div className="text-xs font-medium text-slate-400 mt-1">
                {wallets.filter(w => w.type === 'cash').length} Akun Tunai
              </div>

              <div className="absolute right-2 -bottom-2 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
                <CashStackIllustration className="w-20 h-20" />
              </div>
            </div>
          </div>

          {/* Rincian Riwayat Transaksi Terakhir */}
          <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-7 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Riwayat Transaksi Terakhir</h3>
              <Link href="/reports" className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1">
                Lihat Laporan Lengkap ➔
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Belum ada catatan transaksi. Klik "Catat Transaksi" untuk memulai.</p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/40 px-3 rounded-2xl transition">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-2xl shrink-0 ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tx.type === 'expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {tx.type === 'income' && <ArrowDownLeft className="w-4 h-4" />}
                        {tx.type === 'expense' && <ArrowUpRight className="w-4 h-4" />}
                        {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-100 text-sm truncate">{tx.category}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {tx.type === 'transfer' 
                            ? `${tx.wallet?.name} ➔ ${tx.to_wallet?.name}`
                            : tx.wallet?.name}
                          {tx.notes ? ` • "${tx.notes}"` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between items-baseline sm:items-end border-t border-slate-800/40 sm:border-0 pt-1.5 sm:pt-0 pl-11 sm:pl-0">
                      <p className={`font-black text-sm sm:text-base ${
                        tx.type === 'income' ? 'text-emerald-400' :
                        tx.type === 'expense' ? 'text-rose-400' :
                        'text-slate-300'
                      }`}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatRupiah(Number(tx.amount))}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
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
