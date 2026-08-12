import { Wallet, PersonalTransaction } from '@/types/database';
import { formatRupiah } from '@/lib/utils';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export interface ReceiptAnalysisResult {
  storeName: string;
  totalAmount: number;
  category: string;
  dateStr: string;
  detectedWalletName?: string;
  notes: string;
}

/**
 * Menganalisis foto struk belanjaan menggunakan Gemini Vision AI
 */
export async function analyzeReceiptImage(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  userWallets: Wallet[]
): Promise<ReceiptAnalysisResult | null> {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Falling back to default receipt parser.');
    return {
      storeName: 'Struk Belanja',
      totalAmount: 0,
      category: 'Belanja',
      dateStr: new Date().toISOString(),
      notes: 'Struk Terdeteksi',
    };
  }

  const prompt = `
Kamu adalah asisten pengenal struk belanja profesional. Analisis gambar struk belanjaan ini dan ekstrak informasi berikut dalam format JSON murni:

JSON schema yang WAJIB dihasilkan:
{
  "storeName": "Nama Toko / Resto (misal: Indomaret, Alfamart, Solaria)",
  "totalAmount": 45000 (angka integer total bayar),
  "category": "Kategori transaksi. Pilih salah satu: 'Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas', 'Hiburan', atau 'Lainnya'",
  "notes": "Rangkuman singkat item utama (misal: Belanja bulanan Indomaret)"
}

Hasilkan HANYA JSON murni tanpa markdown wrapper.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const cleanedJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      storeName: parsed.storeName || 'Struk Belanja',
      totalAmount: Number(parsed.totalAmount) || 0,
      category: parsed.category || 'Belanja',
      dateStr: new Date().toISOString(),
      notes: parsed.notes || parsed.storeName || 'Struk Belanja',
    };
  } catch (err) {
    console.error('Error analyzing receipt with Gemini:', err);
    return null;
  }
}

/**
 * Menjawab pertanyaan finansial pengguna menggunakan Gemini AI Assistant
 */
export async function answerFinancialQuestion(
  question: string,
  userProfileName: string,
  userWallets: Wallet[],
  recentTransactions: PersonalTransaction[]
): Promise<string> {
  const totalBalance = userWallets.reduce((acc, w) => acc + Number(w.balance), 0);
  
  let walletContext = userWallets.map(w => `- ${w.name}: ${formatRupiah(Number(w.balance))}`).join('\n');
  let txContext = recentTransactions.slice(0, 10).map(t => `- [${t.type.toUpperCase()}] ${t.category}: ${formatRupiah(Number(t.amount))} (${t.notes || '-'})`).join('\n');

  const systemPrompt = `
Kamu adalah "DuidNa AI Assistant", konsultan keuangan pribadi santai, akurat, ramah, dan solutif berbahasa Indonesia untuk ${userProfileName || 'Pengguna'}.

Konteks Keuangan Pengguna Real-time:
Total Net Worth: ${formatRupiah(totalBalance)}
Daftar Saldo Dompet:
${walletContext}

10 Transaksi Terakhir Bulan Ini:
${txContext}

Pertanyaan Pengguna: "${question}"

Berikan jawaban yang ramah, santai (panggil "bro" atau "kak"), solutif, ringkas, dan langsung menjawab inti pertanyaan berdasarkan data konteks di atas. Jangan gunakan istilah rumit.
`;

  if (!GEMINI_API_KEY) {
    return `👋 Halo! Total saldo terkonsolidasi Anda saat ini adalah <b>${formatRupiah(totalBalance)}</b> dari ${userWallets.length} dompet aktif.`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
        }),
      }
    );

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return candidateText.trim();
    }
  } catch (err) {
    console.error('Error with Gemini Financial Assistant:', err);
  }

  return `👋 Total saldo terkonsolidasi Anda saat ini adalah <b>${formatRupiah(totalBalance)}</b>.`;
}
