'use client';

export const dynamic = 'force-dynamic';

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
  X
} from 'lucide-react';
import { 
  BankBuildingIllustration, 
  SmartphoneIllustration, 
  CashStackIllustration 
} from '@/components/ui/3d-illustrations';

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
      const walletList = data as Wallet[];
      setWallets(walletList);
      if (walletList.length >= 2) {
        setFromWalletId(walletList[0].id);
        setToWalletId(walletList[1].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // Keyboard Escape listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowTransferModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">Manajemen Dompet & Akun Saya</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Kelola akun bank, e-wallet, cash, dan lakukan transfer tanpa merubah total Net Worth.</p>
        </div>

        <div className="grid grid-cols-1 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md"
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span>Transfer Antar Dompet</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Dompet</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-9 h-9 text-emerald-500 animate-spin" />
        </div>
      ) : (
        /* Metallic Glassmorphism Wallet Cards Matching Mockup Image */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6">
          {wallets.map((w) => (
            <div 
              key={w.id} 
              className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-5 relative group overflow-hidden hover:border-slate-600 transition duration-300"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl border ${
                    w.type === 'bank' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    w.type === 'ewallet' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {w.type === 'bank' && <Building2 className="w-6 h-6" />}
                    {w.type === 'ewallet' && <Smartphone className="w-6 h-6" />}
                    {w.type === 'cash' && <Banknote className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight uppercase">{w.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{w.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteWallet(w.id)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-xl"
                  title="Hapus Dompet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 relative z-10">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">SALDO</span>
                <p className="text-3xl font-black text-white tracking-tight break-words drop-shadow-md">{formatRupiah(Number(w.balance))}</p>
              </div>

              {/* 3D Illustration Graphic on the right side of card matching Mockup Image */}
              <div className="absolute right-3 bottom-1 pointer-events-none opacity-80 group-hover:scale-105 transition-transform duration-300">
                {w.type === 'bank' && <BankBuildingIllustration className="w-32 h-32 md:w-36 md:h-36" />}
                {w.type === 'ewallet' && <SmartphoneIllustration className="w-32 h-32 md:w-36 md:h-36" />}
                {w.type === 'cash' && <CashStackIllustration className="w-32 h-32 md:w-36 md:h-36" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Dompet */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-gradient-to-b from-slate-800/95 via-slate-900/95 to-slate-950 border border-slate-700/80 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/80 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white">Tambah Dompet Baru</h3>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Nama Dompet / Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: BCA Utama, GoPay, Cash..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Tipe Penyimpanan</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WalletType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none font-bold"
                >
                  <option value="bank">Rekening Bank</option>
                  <option value="ewallet">E-Wallet (GoPay/OVO/Dana)</option>
                  <option value="cash">Cash / Tunai</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Saldo Awal (IDR)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none font-black text-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {addLoading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Antar Dompet */}
      {showTransferModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowTransferModal(false)}
        >
          <div 
            className="bg-gradient-to-b from-slate-800/95 via-slate-900/95 to-slate-950 border border-slate-700/80 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTransferModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/80 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-400" /> Transfer Antar Dompet
            </h3>
            <form onSubmit={handleInternalTransfer} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Dari Dompet (Asal)</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none font-bold"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(Number(w.balance))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Ke Dompet (Tujuan)</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none font-bold"
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
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Nominal Transfer (IDR)</label>
                <input
                  type="text"
                  required
                  placeholder="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none font-black text-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Keterangan Transfer</label>
                <input
                  type="text"
                  placeholder="Misal: Pindah saldo ke E-Wallet..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {transferLoading && <Loader2 className="w-4 h-4 animate-spin" />} Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
