'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { PersonalTransaction } from '@/types/database';
import { formatRupiah } from '@/lib/utils';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  transaction: PersonalTransaction | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  transaction,
  onClose,
  onConfirm,
  loading = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl transition-all border border-slate-700/80 bg-gradient-to-b from-slate-800/95 via-slate-900/95 to-slate-950 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Hapus Transaksi</h3>
            <p className="text-xs text-slate-400">Tindakan ini akan membatalkan efek transaksi pada saldo dompet.</p>
          </div>
        </div>

        {/* Detail Ringkas Transaksi */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Kategori:</span>
            <span className="font-bold text-white">{transaction.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Tipe:</span>
            <span className="font-bold uppercase tracking-wider text-slate-300">
              {transaction.type === 'income' ? 'Pemasukan' : transaction.type === 'expense' ? 'Pengeluaran' : 'Transfer'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Nominal:</span>
            <span className="font-black text-rose-400 text-sm">{formatRupiah(Number(transaction.amount))}</span>
          </div>
          {transaction.notes && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Catatan:</span>
              <span className="italic text-slate-300">{transaction.notes}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 font-medium text-center">
          Apakah Anda yakin ingin menghapus catatan transaksi ini?
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Hapus Transaksi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
