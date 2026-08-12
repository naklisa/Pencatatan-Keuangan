import { TransactionType, Wallet } from '@/types/database';

export interface ParsedTelegramMessage {
  type: TransactionType;
  amount: number;
  category: string;
  notes: string;
  walletId: string;
  toWalletId?: string | null;
  walletName: string;
  toWalletName?: string | null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Makanan & Minuman': ['makan', 'minum', 'kopi', 'nasi', 'padang', 'resto', 'snack', 'gofood', 'grabfood', 'bakso', 'cafe', 'sarapan', 'dinner', 'lunch', 'ayam', 'mie', 'sate', 'resep', 'es', 'teh'],
  'Transportasi': ['bensin', 'pertalite', 'pertamax', 'gojek', 'grab', 'angkot', 'parkir', 'tol', 'tiket', 'kereta', 'bus', 'tambal', 'oli', 'service', 'servis'],
  'Belanja': ['belanja', 'baju', 'kaos', 'tokopedia', 'shopee', 'lazada', 'supermarket', 'indomaret', 'alfamart', 'diskon', 'skincare', 'celana', 'sepatu'],
  'Tagihan & Utilitas': ['tagihan', 'listrik', 'pln', 'air', 'pdam', 'wifi', 'indihome', 'pulsa', 'kuota', 'paket', 'bpjs', 'iuran', 'pajak'],
  'Hiburan': ['hiburan', 'nonton', 'bioskop', 'game', 'steam', 'netflix', 'spotify', 'yt', 'youtube', 'liburan', 'topup game', 'topup ml'],
  'Gaji': ['gaji', 'paycheck', 'salary', 'honor'],
  'Bonus': ['bonus', 'thr', 'tips', 'komisi'],
  'Investasi': ['investasi', 'saham', 'reksadana', 'crypto', 'btc', 'emas'],
  'Penjualan': ['jual', 'penjualan', 'omset', 'laku', 'cuan'],
};

export function parseTelegramText(
  text: string,
  userWallets: Wallet[]
): ParsedTelegramMessage | null {
  const cleanText = text.trim();
  if (!cleanText) return null;

  const lowerText = cleanText.toLowerCase();

  // 1. Detect Nominal Amount
  let amount = 0;

  // Patterns: 1.5jt, 1,5jt, 2juta, 35rb, 35k, 35000, 35.000, rp 35.000
  const jutaMatch = lowerText.match(/(?:rp\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/);
  const ribuMatch = lowerText.match(/(?:rp\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|k)/);
  const rawNumMatch = lowerText.match(/(?:rp\s*)?(\d{1,3}(?:\.\d{3})+|\d+)/);

  if (jutaMatch) {
    const val = parseFloat(jutaMatch[1].replace(',', '.'));
    amount = Math.round(val * 1000000);
  } else if (ribuMatch) {
    const val = parseFloat(ribuMatch[1].replace(',', '.'));
    amount = Math.round(val * 1000);
  } else if (rawNumMatch) {
    const cleanNum = rawNumMatch[1].replace(/\./g, '');
    amount = parseInt(cleanNum, 10);
  }

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  // 2. Detect Transaction Type
  let type: TransactionType = 'expense';

  const isIncome = /\b(pemasukan|gaji|bonus|dapat|masuk|terima|omset|cuan)\b/.test(lowerText);
  const isTransfer = /\b(transfer|tf|pindah|kirim)\b/.test(lowerText);

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  }

  // 3. Match Wallets
  if (userWallets.length === 0) return null;

  let walletId = userWallets[0].id;
  let walletName = userWallets[0].name;
  let toWalletId: string | null = null;
  let toWalletName: string | null = null;

  // Try matching wallet keywords
  const matchedWallets = userWallets.filter((w) => {
    const wName = w.name.toLowerCase();
    const words = wName.split(/\s+/);
    return lowerText.includes(wName) || words.some((word) => word.length > 2 && lowerText.includes(word));
  });

  if (type === 'transfer') {
    if (matchedWallets.length >= 2) {
      walletId = matchedWallets[0].id;
      walletName = matchedWallets[0].name;
      toWalletId = matchedWallets[1].id;
      toWalletName = matchedWallets[1].name;
    } else if (matchedWallets.length === 1) {
      walletId = matchedWallets[0].id;
      walletName = matchedWallets[0].name;
      const target = userWallets.find((w) => w.id !== walletId);
      if (target) {
        toWalletId = target.id;
        toWalletName = target.name;
      }
    } else {
      walletId = userWallets[0].id;
      walletName = userWallets[0].name;
      const target = userWallets.find((w) => w.id !== walletId) || userWallets[0];
      toWalletId = target.id;
      toWalletName = target.name;
    }
  } else {
    if (matchedWallets.length > 0) {
      walletId = matchedWallets[0].id;
      walletName = matchedWallets[0].name;
    }
  }

  // 4. Detect Category
  let category = type === 'income' ? 'Pemasukan' : type === 'transfer' ? 'Transfer Internal' : 'Lainnya';

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      category = cat;
      break;
    }
  }

  // 5. Clean Notes / Description
  let notes = cleanText
    .replace(/(?:rp\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta|rb|k)/gi, '')
    .replace(/(?:rp\s*)?(\d{1,3}(?:\.\d{3})+|\d+)/gi, '')
    .replace(/\b(pemasukan|pengeluaran|transfer|tf|pindah|kirim|gaji|bonus|masuk|dapat|bca|gopay|tunai|cash|mandiri|dana|ovo|jago|bri)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!notes) {
    notes = category;
  }

  return {
    type,
    amount,
    category,
    notes,
    walletId,
    toWalletId,
    walletName,
    toWalletName,
  };
}
