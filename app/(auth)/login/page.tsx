'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, LogIn, Lock } from 'lucide-react';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-2xl mx-auto shadow-lg shadow-emerald-500/20">
            P
          </div>
          <h1 className="text-2xl font-bold text-white">Masuk ke Aplikasi</h1>
          <p className="text-sm text-slate-400">
            Masukkan akun terdaftar Anda untuk melanjutkan.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Masuk
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5" /> Akses Terbatas (Akun didaftarkan oleh Admin)
        </div>
      </div>
    </div>
  );
}
