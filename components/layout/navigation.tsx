'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LayoutDashboard, LogOut } from 'lucide-react';
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
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-slate-950 bg-emerald-500">
          P
        </div>
        <div>
          <span className="font-extrabold text-lg text-white">
            Keuangan Pribadi
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-400">
            Personal Finance Manager
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <Link
          href="/dashboard"
          className={`flex items-center gap-1.5 hover:text-emerald-400 transition ${
            pathname === '/dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <Link
          href="/wallets"
          className={`flex items-center gap-1.5 hover:text-emerald-400 transition ${
            pathname === '/wallets' ? 'text-emerald-400 font-bold' : 'text-slate-300'
          }`}
        >
          <Wallet className="w-4 h-4" /> Dompet Saya
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition ml-4 border-l border-slate-800 pl-4"
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>
    </header>
  );
}
