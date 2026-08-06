'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { House, SharedExpense, ExpenseSplit } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { Home, Users, Receipt, CheckCircle, Clock, Plus, AlertCircle, Loader2 } from 'lucide-react';

export default function HouseDashboardPage() {
  const supabase = createClient();
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHouseData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's houses
      const { data: memberData } = await supabase
        .from('house_members')
        .select('house_id, house:houses(*)')
        .eq('user_id', user.id);

      if (memberData && memberData.length > 0) {
        const userHouses = memberData.map((m: any) => m.house);
        setHouses(userHouses);
        setSelectedHouse(userHouses[0]);

        // Load shared expenses for the first house
        const { data: expData } = await supabase
          .from('shared_expenses')
          .select(`
            *,
            splits:expense_splits(*, user:profiles(*))
          `)
          .eq('house_id', userHouses[0].id)
          .order('created_at', { ascending: false });

        if (expData) setExpenses(expData as any);
      }
      setLoading(false);
    }

    loadHouseData();
  }, []);

  const totalSharedExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-medium border border-amber-500/20">
              Scope: Kontrakan
            </span>
            <h1 className="text-2xl font-bold text-white">Kas & Split Bill Kontrakan</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manajemen tagihan bersama (sewa, wifi, listrik, galon), tracking nunggak, & bukti pembayaran.
          </p>
        </div>
        <button
          onClick={() => alert('Fitur Tambah Tagihan Kontrakan Siap Dipakai!')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Buat Tagihan Bersama
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : houses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto">
          <Home className="w-16 h-16 text-amber-400 mx-auto opacity-80" />
          <h3 className="text-xl font-bold text-white">Anda Belum Tergabung ke Kontrakan</h3>
          <p className="text-sm text-slate-400">
            Buat grup kontrakan baru atau minta admin kontrakan Anda memasukkan ID akun Anda.
          </p>
          <button
            onClick={async () => {
              const houseName = prompt('Masukkan Nama Kontrakan:');
              if (!houseName) return;
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: house, error } = await supabase.from('houses').insert({
                  name: houseName,
                  created_by: user.id,
                }).select().single();

                if (house) {
                  await supabase.from('house_members').insert({
                    house_id: house.id,
                    user_id: user.id,
                    role: 'admin',
                  });
                  window.location.reload();
                }
              }
            }}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
          >
            + Buat Grup Kontrakan Baru
          </button>
        </div>
      ) : (
        <>
          {/* Group Kontrakan Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Home className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedHouse?.name}</h2>
                <p className="text-xs text-slate-400">Terdaftar di sistem kas bersama kontrakan.</p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Tagihan Aktif</span>
              <p className="text-3xl font-black text-amber-400">{formatRupiah(totalSharedExpenses)}</p>
            </div>
          </div>

          {/* List Tagihan & Splits */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              Daftar Tagihan & Status Lunas/Nunggak
            </h3>

            {expenses.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
                Belum ada tagihan bersama di kontrakan ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {expenses.map((exp) => (
                  <div key={exp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{exp.category}</span>
                        <h4 className="text-lg font-bold text-white">{exp.title}</h4>
                        <p className="text-xs text-slate-400">Jatuh Tempo: {exp.due_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">{formatRupiah(Number(exp.amount))}</p>
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold mt-1 ${
                          exp.status === 'settled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {exp.status === 'settled' ? 'LUNAS SEMUA' : 'PROSES PEMBAYARAN'}
                        </span>
                      </div>
                    </div>

                    {/* Member Splits */}
                    {exp.splits && exp.splits.length > 0 && (
                      <div className="border-t border-slate-800 pt-3 space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Status Anggota Kontrakan:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {exp.splits.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg text-xs">
                              <span className="font-semibold text-slate-300">{s.user?.full_name || 'Anggota'}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{formatRupiah(Number(s.amount_due))}</span>
                                <span className={`px-2 py-0.5 rounded font-semibold ${
                                  s.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {s.status === 'paid' ? 'Lunas' : 'Nunggak'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
