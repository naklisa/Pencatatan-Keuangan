'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { TransactionForm } from '@/components/transactions/transaction-form';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Push history state to handle mobile back button closing modal
    const historyState = { modalOpen: true };
    window.history.pushState(historyState, '');

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (window.history.state?.modalOpen) {
      window.history.back();
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transition-all border border-slate-700/80 bg-gradient-to-b from-slate-800/95 via-slate-900/95 to-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular Dark Metallic Close Button (Matches Mockup) */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute right-4 top-4 z-20 p-2 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-full transition-all shadow-lg hover:scale-105"
          title="Tutup (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <TransactionForm
          onSuccess={() => {
            if (onSuccess) onSuccess();
            handleClose();
          }}
        />
      </div>
    </div>
  );
}
