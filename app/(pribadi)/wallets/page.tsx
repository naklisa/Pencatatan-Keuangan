'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, WalletType } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { 
  Wallet as WalletIcon, 
  Building2, 
  Smartphone, 
  Banknote, 
  Plus, 
  ArrowRightLeft, 
  Trash2, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';

export default function WalletsPage() {
  const supabase = createClient();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Wallet Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Internal Transfer Modal States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (data) {
      setWallets(data);
      if (data.length >= 2) {
        setFromWalletId(data[0].id);
        setToWalletId(data[1].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    const balanceNum = parseFloat(initialBalance.replace(/[^0-9]/g, '')) || 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('wallets').insert({
        user_id: user.id,
        name: name.trim(),
        type,
        balance: balanceNum,
        icon: type === 'bank' ? 'building-bank' : type === 'ewallet' ? 'smartphone' : 'wallet',
      });
      setName('');
      setInitialBalance('');
      setShowAddModal(false);
      fetchWallets();
    }
    setAddLoading(false);
  };

  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount.replace(/[^0-9]/g, ''));
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId || isNaN(amountNum) || amountNum <= 0) {
      alert('Mohon periksa kembali pilihan dompet asal, dompet tujuan, dan nominal transfer.');
      return;
    }

    setTransferLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Input personal_transactions tipe 'transfer'
      const { error } = await supabase.from('personal_transactions').insert({
        user_id: user.id,
        wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        amount: amountNum,
        type: 'transfer',
        category: 'Transfer Internal',
        notes: transferNotes.trim() || 'Internal Transfer Antar Dompet',
        date: new Date().toISOString(),
      });

      if (!error) {
        setTransferAmount('');
        setTransferNotes('');
        setShowTransferModal(false);
        fetchWallets();
      } else {
        alert(error.message);
      }
    }
    setTransferLoading(false);
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Apakah anda yakin ingin menghapus dompet ini?')) return;
    await supabase.from('wallets').update({ is_active: false }).eq('id', id);
    fetchWallets();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Dompet & Akun Saya</h1>
          <p className="text-sm text-slate-400 mt-1">Kelola akun bank, e-wallet, cash, dan lakukan transfer internal tanpa merubah total Net Worth.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 font-semibold rounded-lg transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer Antar Dompet
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Dompet
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wallets.map((w) => (
            <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 relative group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    w.type === 'bank' ? 'bg-blue-500/10 text-blue-400' :
                    w.type === 'ewallet' ? 'bg-indigo-500/10 text-indigo-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {w.type === 'bank' && <Building2 className="w-6 h-6" />}
                    {w.type === 'ewallet' && <Smartphone className="w-6 h-6" />}
                    {w.type === 'cash' && <Banknote className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{w.name}</h3>
                    <span className="text-xs uppercase font-semibold text-slate-400">{w.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteWallet(w.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg"
                  title="Hapus Dompet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-medium">Saldo</span>
                <p className="text-2xl font-black text-white">{formatRupiah(Number(w.balance))}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Dompet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-5">
            <h3 className="text-lg font-bold text-white">Tambah Dompet / Akun Baru</h3>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Nama Dompet / Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: BCA Utama, GoPay, Kas Saku..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Tipe Penyimpanan</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WalletType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value="bank">Rekening Bank</option>
                  <option value="ewallet">E-Wallet (GoPay/OVO/Dana)</option>
                  <option value="cash">Cash / Tunai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Saldo Awal (IDR)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  {addLoading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Antar Dompet */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-400" /> Transfer Antar Dompet
            </h3>
            <form onSubmit={handleInternalTransfer} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Dari Dompet (Asal)</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(Number(w.balance))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Ke Dompet (Tujuan)</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                >
                  {wallets
                    .filter((w) => w.id !== fromWalletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(Number(w.balance))})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Nominal Transfer (IDR)</label>
                <input
                  type="text"
                  required
                  placeholder="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Keterangan Transfer</label>
                <input
                  type="text"
                  placeholder="Misal: Tarik tunai dari BCA ke Wallet..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  {transferLoading && <Loader2 className="w-4 h-4 animate-spin" />} Transfer Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
