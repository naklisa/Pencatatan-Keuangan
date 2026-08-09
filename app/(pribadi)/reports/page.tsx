'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PersonalTransaction, Wallet } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar, 
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  GreenChartIllustration, 
  RedChartIllustration, 
  LeatherWalletIllustration 
} from '@/components/ui/3d-illustrations';

const CATEGORY_COLORS: Record<string, string> = {
  'Makanan & Minuman': 'bg-orange-500 text-orange-400 border-orange-500/30',
  'Transportasi': 'bg-blue-500 text-blue-400 border-blue-500/30',
  'Belanja': 'bg-purple-500 text-purple-400 border-purple-500/30',
  'Tagihan & Utilitas': 'bg-rose-500 text-rose-400 border-rose-500/30',
  'Hiburan': 'bg-amber-500 text-amber-400 border-amber-500/30',
  'Gaji': 'bg-emerald-500 text-emerald-400 border-emerald-500/30',
  'Bonus': 'bg-teal-500 text-teal-400 border-teal-500/30',
  'Investasi': 'bg-cyan-500 text-cyan-400 border-cyan-500/30',
  'Penjualan': 'bg-indigo-500 text-indigo-400 border-indigo-500/30',
  'Transfer Internal': 'bg-slate-500 text-slate-400 border-slate-500/30',
  'Lainnya': 'bg-slate-400 text-slate-300 border-slate-400/30',
};

export default function ReportsPage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const fetchMonthData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First and last day of selected month
    const firstDay = new Date(year, month, 1).toISOString();
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id);

    const { data: txData } = await supabase
      .from('personal_transactions')
      .select(`
        *,
        wallet:wallets!wallet_id(name, type),
        to_wallet:wallets!to_wallet_id(name, type)
      `)
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: true });

    if (walletData) setWallets(walletData);
    if (txData) setTransactions(txData as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Math Aggregation
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netCashflow = totalIncome - totalExpense;

  // Category Breakdown (for Expenses)
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
    });

  const categoryList = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Daily Breakdown Map (Group by day date)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyMap: Record<number, { income: number; expense: number; txs: PersonalTransaction[] }> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap[d] = { income: 0, expense: 0, txs: [] };
  }

  transactions.forEach(t => {
    const d = new Date(t.date).getDate();
    if (dailyMap[d]) {
      if (t.type === 'income') dailyMap[d].income += Number(t.amount);
      if (t.type === 'expense') dailyMap[d].expense += Number(t.amount);
      dailyMap[d].txs.push(t);
    }
  });

  const activeDays = Object.entries(dailyMap)
    .filter(([_, data]) => data.txs.length > 0)
    .map(([day, data]) => ({ day: Number(day), ...data }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header & Month Selector (Matching Mockup Image) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 shrink-0" />
            <span>Laporan & Statistik Keuangan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Analisis arus kas harian dan rincian pengeluaran per kategori.</p>
        </div>

        {/* Month Picker Controls (Metallic Charcoal Chip) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 bg-gradient-to-r from-slate-800/90 to-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 sm:p-2 shadow-xl w-full sm:w-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl transition"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 px-2 sm:px-3 font-extrabold text-white text-xs sm:text-base">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{monthName}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl transition"
            title="Bulan Selanjutnya"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-9 h-9 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Monthly Ringkasan Cards with 3D Illustrations (Matching Mockup Image) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Total Pemasukan Card */}
            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-emerald-400 relative z-10">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">TOTAL PEMASUKAN</span>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 break-words relative z-10">{formatRupiah(totalIncome)}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 pt-0.5 relative z-10">Total uang masuk di {monthName}</p>

              {/* 3D Green Chart Illustration */}
              <div className="absolute right-1 bottom-1 pointer-events-none opacity-80 group-hover:scale-105 transition-transform duration-300">
                <GreenChartIllustration className="w-24 h-24" />
              </div>
            </div>

            {/* Total Pengeluaran Card */}
            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-2 relative overflow-hidden group hover:border-rose-500/40 transition">
              <div className="flex items-center justify-between text-rose-400 relative z-10">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">TOTAL PENGELUARAN</span>
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-400 break-words relative z-10">{formatRupiah(totalExpense)}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 pt-0.5 relative z-10">Total uang keluar di {monthName}</p>

              {/* 3D Red Chart Illustration */}
              <div className="absolute right-1 bottom-1 pointer-events-none opacity-80 group-hover:scale-105 transition-transform duration-300">
                <RedChartIllustration className="w-24 h-24" />
              </div>
            </div>

            {/* Net Cashflow Card */}
            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-2 relative overflow-hidden group hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between text-blue-400 relative z-10">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">NET CASHFLOW</span>
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black break-words relative z-10 ${netCashflow >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                {formatRupiah(netCashflow)}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 pt-0.5 relative z-10">Selisih arus kas periode ini</p>

              {/* 3D Wallet Illustration */}
              <div className="absolute right-1 bottom-1 pointer-events-none opacity-80 group-hover:scale-105 transition-transform duration-300">
                <LeatherWalletIllustration className="w-24 h-24" />
              </div>
            </div>
          </div>

          {/* Lower Grid: Pengeluaran Berdasarkan Kategori & Cash Flow (Matching Mockup Image) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Pengeluaran Berdasarkan Kategori */}
            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>Pengeluaran Berdasarkan Kategori</span>
                </h3>
              </div>

              {categoryList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold">no data</p>
                  <p className="text-slate-400 text-xs">Belum ada pengeluaran pada bulan ini.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Visual Progress Bar */}
                  <div className="h-5 sm:h-6 w-full bg-slate-950 rounded-full overflow-hidden flex p-1 border border-slate-800 shadow-inner">
                    {categoryList.map(([catName, amount]) => {
                      const pct = (amount / totalExpense) * 100;
                      const styleClass = CATEGORY_COLORS[catName] || 'bg-slate-600';
                      const bgOnly = styleClass.split(' ')[0];
                      return (
                        <div
                          key={catName}
                          style={{ width: `${pct}%` }}
                          className={`h-full ${bgOnly} transition-all duration-500`}
                          title={`${catName}: ${formatRupiah(amount)} (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Legenda Kategori Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {categoryList.map(([catName, amount]) => {
                      const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                      const styleClass = CATEGORY_COLORS[catName] || 'bg-slate-600 text-slate-300 border-slate-600/30';
                      const bgDot = styleClass.split(' ')[0];

                      return (
                        <div key={catName} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${bgDot}`} />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-100 truncate">{catName}</p>
                              <span className="text-[10px] text-slate-400 font-medium block">{pct.toFixed(1)}% dari total</span>
                            </div>
                          </div>
                          <span className="font-black text-xs text-rose-400 shrink-0">{formatRupiah(amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Cash Flow (Arus Kas Per Tanggal) */}
            <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Cash Flow</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Legenda & Persentase</span>
              </div>

              {activeDays.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold">no data</p>
                  <p className="text-slate-400 text-xs">Belum ada riwayat transaksi pada bulan {monthName}.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {activeDays.map(({ day, income, expense, txs }) => {
                    const dayDate = new Date(year, month, day).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    });

                    return (
                      <div key={day} className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 space-y-2.5 shadow-md">
                        {/* Date Title Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/60 pb-2 gap-1">
                          <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            {dayDate}
                          </span>
                          <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold">
                            {income > 0 && <span className="text-emerald-400">+ {formatRupiah(income)}</span>}
                            {expense > 0 && <span className="text-rose-400">- {formatRupiah(expense)}</span>}
                          </div>
                        </div>

                        {/* Transactions List on this day */}
                        <div className="divide-y divide-slate-800/60">
                          {txs.map((t) => (
                            <div key={t.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-xl shrink-0 ${
                                  t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' :
                                  t.type === 'expense' ? 'bg-rose-500/10 text-rose-400' :
                                  'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {t.type === 'income' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                                  {t.type === 'expense' && <ArrowUpRight className="w-3.5 h-3.5" />}
                                  {t.type === 'transfer' && <WalletIcon className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-200 truncate">{t.category}</p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {t.wallet?.name || 'Dompet'}
                                    {t.type === 'transfer' && t.to_wallet ? ` ➔ ${t.to_wallet.name}` : ''}
                                  </p>
                                </div>
                              </div>

                              <span className={`font-black text-xs shrink-0 ${
                                t.type === 'income' ? 'text-emerald-400' :
                                t.type === 'expense' ? 'text-rose-400' :
                                'text-slate-300'
                              }`}>
                                {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                                {formatRupiah(Number(t.amount))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
