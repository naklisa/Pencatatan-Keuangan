'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PersonalTransaction } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Loader2, 
  Calendar,
  History,
  Plus,
  RefreshCw
} from 'lucide-react';
import { EditTransactionModal } from '@/components/modals/edit-transaction-modal';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { TransactionModal } from '@/components/modals/transaction-modal';

export default function TransactionsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<PersonalTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('personal_transactions')
      .select(`
        *,
        wallet:wallets!wallet_id(name, type),
        to_wallet:wallets!to_wallet_id(name, type)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', deletingTransaction.id);

      if (error) throw error;

      setDeletingTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredTransactions = transactions.filter((tx) => {
    // Type Filter
    if (selectedType !== 'all' && tx.type !== selectedType) return false;

    // Category Filter
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCategory = tx.category.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      const matchWallet = tx.wallet?.name.toLowerCase().includes(q);
      const matchToWallet = tx.to_wallet?.name.toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      return matchCategory || matchNotes || matchWallet || matchToWallet || matchAmount;
    }

    return true;
  });

  // Extract unique categories for filter dropdown
  const categoriesList = Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <History className="w-6 h-6" />
            </div>
            Riwayat Transaksi Penuh
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Daftar rinci seluruh catatan pengeluaran, pemasukan, dan transfer dompet anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTransactions}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-2xl transition"
            title="Muat Ulang Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/90 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, catatan, dompet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center justify-between gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition ${
                selectedType === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setSelectedType('transfer')}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition ${
                selectedType === 'transfer'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Kategori ({categoriesList.length})</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950 border-t border-slate-700/70 border-b border-slate-950 border-x border-slate-800/80 rounded-3xl p-5 sm:p-7 md:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Daftar Transaksi ({filteredTransactions.length})
          </h3>
          <span className="text-xs text-slate-400">
            Total {transactions.length} transaksi tercatat
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-slate-400 font-bold text-sm">Tidak ada catatan transaksi ditemukan.</p>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter kategori Anda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-3 rounded-2xl transition group"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : tx.type === 'expense'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {tx.type === 'income' && <ArrowDownLeft className="w-5 h-5" />}
                    {tx.type === 'expense' && <ArrowUpRight className="w-5 h-5" />}
                    {tx.type === 'transfer' && <ArrowRightLeft className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-slate-100 text-sm sm:text-base">
                        {tx.category}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-300">
                        {tx.type === 'transfer'
                          ? `${tx.wallet?.name} ➔ ${tx.to_wallet?.name}`
                          : tx.wallet?.name}
                      </span>
                      {tx.notes && (
                        <span className="italic text-slate-400">
                          • "{tx.notes}"
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-800/40 sm:border-0 pt-2.5 sm:pt-0 pl-12 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p
                      className={`font-black text-base sm:text-lg ${
                        tx.type === 'income'
                          ? 'text-emerald-400'
                          : tx.type === 'expense'
                          ? 'text-rose-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatRupiah(Number(tx.amount))}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center sm:justify-end gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {new Date(tx.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingTransaction(tx)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition border border-transparent hover:border-blue-500/20"
                      title="Edit Transaksi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingTransaction(tx)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-transparent hover:border-rose-500/20"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <TransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchTransactions}
      />

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={fetchTransactions}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingTransaction}
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
