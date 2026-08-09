'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LayoutDashboard, LogOut, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function Navigation() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Jangan tampilkan header jika di halaman login
  if (pathname === '/login') return null;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xl">
      {/* Brand Header */}
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-slate-950 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          P
        </div>
        <div>
          <span className="font-black text-lg text-white tracking-tight">
            Keuangan Pribadi
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-400">
            Personal Finance Manager
          </span>
        </div>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-2 sm:gap-5 text-xs sm:text-sm font-medium">
        <Link
          href="/dashboard"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
            pathname === '/dashboard' 
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>

        <Link
          href="/reports"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
            pathname === '/reports' 
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Laporan & Statistik
        </Link>

        <Link
          href="/wallets"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
            pathname === '/wallets' 
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Wallet className="w-4 h-4" /> Dompet Saya
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition ml-2 border-l border-slate-800/80 pl-3 sm:pl-4 py-2"
          title="Keluar Akun"
        >
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
