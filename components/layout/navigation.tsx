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
    if (!confirm('Apakah Anda yakin ingin keluar dari akun?')) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Jangan tampilkan header/bottom nav jika di halaman login
  if (pathname === '/login') return null;

  return (
    <>
      {/* Top Header (Desktop & Mobile Header) */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3 sticky top-0 z-40 shadow-xl flex items-center justify-between">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-black text-slate-950 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            P
          </div>
          <div>
            <span className="font-black text-base md:text-lg text-white tracking-tight leading-none block">
              Keuangan Pribadi
            </span>
            <span className="block text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-emerald-400 mt-0.5">
              Personal Finance
            </span>
          </div>
        </Link>

        {/* Nav Links Desktop (md:flex) */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
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
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition ml-2 border-l border-slate-800/80 pl-4 py-2"
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {/* Mobile Top Actions (Logout Button on Mobile Top Header) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/60 rounded-xl transition"
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 flex items-center justify-around py-2 px-3 md:hidden shadow-2xl">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/dashboard'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Dashboard</span>
        </Link>

        <Link
          href="/reports"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/reports'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Laporan</span>
        </Link>

        <Link
          href="/wallets"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/wallets'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Dompet</span>
        </Link>
      </nav>
    </>
  );
}
