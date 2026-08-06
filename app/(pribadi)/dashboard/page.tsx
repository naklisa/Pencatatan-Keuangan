'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, PersonalTransaction } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { 
  Wallet as WalletIcon, 
  Building2, 
  Smartphone, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Loader2
} from 'lucide-react';
import { TransactionForm } from '@/components/transactions/transaction-form';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Keuangan Pribadi</h1>
          <p className="text-sm text-slate-400 mt-1">Pantau total kekayaan bersih (Net Worth) dan arus kas real-time anda.</p>
        </div>
        <button
          onClick={() => setShowTransactionModal(!showTransactionModal)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Catat Transaksi
        </button>
      </div>

      {/* Form Modal Toggle */}
      {showTransactionModal && (
        <div className="max-w-2xl mx-auto">
          <TransactionForm
            onSuccess={() => {
              setShowTransactionModal(false);
              fetchDashboardData();
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Net Worth Summary Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Net Worth</span>
              <h2 className="text-4xl md:text-5xl font-black text-white">{formatRupiah(netWorth)}</h2>
              <p className="text-xs text-slate-400 pt-1">
                Terkonsolidasi dari {wallets.length} akun dompet aktif.
              </p>
            </div>
            <div className="absolute right-6 bottom-6 opacity-10 pointer-events-none">
              <WalletIcon className="w-44 h-44 text-emerald-400" />
            </div>
          </div>

          {/* Wallet Type Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rekening Bank</span>
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-100">{formatRupiah(totalBank)}</p>
              <div className="text-xs text-slate-500">
                {wallets.filter(w => w.type === 'bank').length} Akun Bank
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">E-Wallet</span>
                <Smartphone className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-100">{formatRupiah(totalEWallet)}</p>
              <div className="text-xs text-slate-500">
                {wallets.filter(w => w.type === 'ewallet').length} Akun E-Wallet
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash / Tunai</span>
                <Banknote className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-100">{formatRupiah(totalCash)}</p>
              <div className="text-xs text-slate-500">
                {wallets.filter(w => w.type === 'cash').length} Akun Tunai
              </div>
            </div>
          </div>

          {/* Rincian Riwayat Transaksi Terakhir */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Riwayat Transaksi Terakhir</h3>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Belum ada catatan transaksi.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' :
                        tx.type === 'expense' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {tx.type === 'income' && <ArrowDownLeft className="w-4 h-4" />}
                        {tx.type === 'expense' && <ArrowUpRight className="w-4 h-4" />}
                        {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{tx.category}</p>
                        <p className="text-xs text-slate-400">
                          {tx.type === 'transfer' 
                            ? `${tx.wallet?.name} ➔ ${tx.to_wallet?.name}`
                            : tx.wallet?.name}
                          {tx.notes ? ` • ${tx.notes}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        tx.type === 'income' ? 'text-emerald-400' :
                        tx.type === 'expense' ? 'text-rose-400' :
                        'text-slate-300'
                      }`}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatRupiah(Number(tx.amount))}
                      </p>
                      <p className="text-xs text-slate-500">
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
