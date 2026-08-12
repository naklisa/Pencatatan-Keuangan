import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseTelegramText } from '@/lib/telegram-parser';
import { analyzeReceiptImage, answerFinancialQuestion } from '@/lib/gemini-ai';
import { formatRupiah } from '@/lib/utils';
import { Wallet, PersonalTransaction } from '@/types/database';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sendTelegramMessage(chatId: number | string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Error sending Telegram message:', err);
  }
}

// Download photo file from Telegram API as Base64
async function getTelegramPhotoBase64(fileId: string): Promise<string | null> {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const filePath = fileData?.result?.file_path;
    if (!filePath) return null;

    const downloadRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`);
    const arrayBuffer = await downloadRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (err) {
    console.error('Error downloading Telegram photo:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (!update || !update.message) {
      return NextResponse.json({ status: 'ok' });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const strChatId = chatId.toString();

    // Fetch User Profile by Telegram Chat ID
    let userProfile: any = null;
    const { data: rpcProfiles } = await supabase.rpc('get_profile_by_telegram_chat_id', {
      p_chat_id: strChatId,
    });

    if (rpcProfiles && rpcProfiles.length > 0) {
      userProfile = rpcProfiles[0];
    } else {
      const { data: directProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_chat_id', strChatId)
        .single();
      userProfile = directProfile;
    }

    const text: string = message.text || '';
    const cleanText = text.trim();

    // 1. Handle /start Command
    if (cleanText.startsWith('/start')) {
      const parts = cleanText.split(' ');
      const userIdParam = parts[1];

      if (userIdParam) {
        const { error: rpcErr } = await supabase.rpc('pair_telegram_chat_id', {
          p_user_id: userIdParam,
          p_chat_id: strChatId,
        });

        let isSuccess = !rpcErr;
        if (!isSuccess) {
          const { error: directErr } = await supabase
            .from('profiles')
            .update({ telegram_chat_id: strChatId })
            .eq('id', userIdParam);
          isSuccess = !directErr;
        }

        if (isSuccess) {
          await sendTelegramMessage(
            chatId,
            `🎉 <b>Selamat! Akun Keuangan Anda Berhasil Terhubung!</b>\n\nSekarang Anda dapat mencatat transaksi secara langsung lewat chat di bot ini.\n\nKetik <code>/help</code> untuk melihat daftar lengkap perintah & cara penggunaan.`
          );
          return NextResponse.json({ status: 'paired' });
        }
      }

      if (userProfile) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Halo ${userProfile.full_name || 'Pengguna'}!</b>\nAkun Anda sudah terhubung dengan Bot @DuidNa_bot.\n\nKetik <code>/help</code> untuk melihat menu bantuan lengkap.`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Akun Belum Terhubung</b>\n\nSilakan buka <b>Dashboard Aplikasi Pencatatan Keuangan</b> Anda, lalu klik tombol <b>"Bot Telegram"</b> untuk mengaktifkan fitur ini.`
        );
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Require paired user for other actions
    if (!userProfile) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Akun Belum Terhubung</b>\n\nSilakan buka <b>Dashboard Aplikasi Pencatatan Keuangan</b> Anda, lalu klik tombol <b>"Bot Telegram"</b> untuk menghubungkan akun ini.`
      );
      return NextResponse.json({ status: 'unpaired' });
    }

    const userId = userProfile.id;

    // Fetch User Wallets
    let userWallets: Wallet[] = [];
    const { data: rpcWallets } = await supabase.rpc('get_wallets_by_telegram_chat_id', {
      p_chat_id: strChatId,
    });

    if (rpcWallets && rpcWallets.length > 0) {
      userWallets = rpcWallets as any;
    } else {
      const { data: directWallets } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name');
      if (directWallets) userWallets = directWallets as any;
    }

    // 2. Handle /help Command (Menu Bantuan Lengkap)
    if (cleanText.startsWith('/help') || cleanText.startsWith('/bantuan')) {
      const helpText = `
📖 <b>MENU BANTUAN & COMMANDS @DuidNa_bot</b>

💡 <b>1. CATAT TRANSAKSI INSTAN (CHAT TEKS)</b>
• <b>Pengeluaran:</b> <code>Makan Nasi Padang 35rb bca</code>
• <b>Pemasukan:</b> <code>Pemasukan gaji 5jt bca</code>
• <b>Transfer:</b> <code>Transfer 200rb bca dana</code>

📷 <b>2. FOTO STRUK BELANJA (AI OCR)</b>
• Cukup <b>kirimkan foto struk belanjaan</b> (Indomaret, Alfamart, Resto, Tokopedia) ke chat bot ini! AI akan membaca nama toko, total bayar, & otomatis mencatatnya.

💬 <b>3. TANYA AI KEUANGAN</b>
• Bebas bertanya seputar keuangan lo, misal:
  - <code>Berapa pengeluaran makan gua bulan ini?</code>
  - <code>Kasih tips hemat mingguan dong bro</code>

📊 <b>4. PERINTAH KHUSUS (/COMMANDS)</b>
• <code>/saldo</code> - Cek ringkasan saldo seluruh dompet
• <code>/rekap</code> - Rekapitulasi pengeluaran minggu ini & bulan ini
• <code>/help</code> - Menampilkan menu bantuan ini
`;
      await sendTelegramMessage(chatId, helpText);
      return NextResponse.json({ status: 'ok' });
    }

    // 3. Handle /saldo Command
    if (cleanText.startsWith('/saldo') || cleanText.startsWith('/cek')) {
      if (userWallets.length === 0) {
        await sendTelegramMessage(chatId, `👛 <b>Belum Ada Dompet Aktif</b>`);
        return NextResponse.json({ status: 'ok' });
      }

      const totalBalance = userWallets.reduce((acc, w) => acc + Number(w.balance), 0);
      let balanceText = `📊 <b>RINGKASAN SALDO DOMPET</b>\n\n`;

      userWallets.forEach((w) => {
        balanceText += `• <b>${w.name}</b>: ${formatRupiah(Number(w.balance))}\n`;
      });

      balanceText += `\n💰 <b>TOTAL NET WORTH: ${formatRupiah(totalBalance)}</b>`;
      await sendTelegramMessage(chatId, balanceText);
      return NextResponse.json({ status: 'ok' });
    }

    // 4. Handle /rekap Command (Rekap Mingguan & Bulanan)
    if (cleanText.startsWith('/rekap')) {
      const now = new Date();
      const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: monthTxs } = await supabase
        .from('personal_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', firstDayMonth)
        .lte('date', lastDayMonth);

      const txsList: PersonalTransaction[] = monthTxs || [];

      const totalIncome = txsList.filter((t) => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
      const totalExpense = txsList.filter((t) => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
      const netCashflow = totalIncome - totalExpense;

      // Find top expense category
      const catMap: Record<string, number> = {};
      txsList.filter((t) => t.type === 'expense').forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
      });

      const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

      let rekapMsg = `📊 <b>REKAPITULASI KEUANGAN BULAN INI</b>\n\n`;
      rekapMsg += `📥 <b>Total Pemasukan:</b> ${formatRupiah(totalIncome)}\n`;
      rekapMsg += `💸 <b>Total Pengeluaran:</b> ${formatRupiah(totalExpense)}\n`;
      rekapMsg += `💼 <b>Net Cashflow:</b> ${formatRupiah(netCashflow)}\n`;
      rekapMsg += `📝 <b>Total Transaksi:</b> ${txsList.length} kali\n`;

      if (topCategory) {
        rekapMsg += `\n🔥 <b>Kategori Terboros:</b> ${topCategory[0]} (${formatRupiah(topCategory[1])})`;
      }

      await sendTelegramMessage(chatId, rekapMsg);
      return NextResponse.json({ status: 'ok' });
    }

    // 5. Handle Photo Messages (Struk Belanja OCR)
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      await sendTelegramMessage(chatId, `🔍 <i>Sedang membaca foto struk belanjaan Anda dengan AI...</i>`);

      const highestResPhoto = message.photo[message.photo.length - 1];
      const base64Photo = await getTelegramPhotoBase64(highestResPhoto.file_id);

      if (!base64Photo) {
        await sendTelegramMessage(chatId, `❌ Gagal mengunduh foto struk. Silakan coba kirim ulang.`);
        return NextResponse.json({ status: 'photo_download_err' });
      }

      const ocrResult = await analyzeReceiptImage(base64Photo, 'image/jpeg', userWallets);

      if (!ocrResult || ocrResult.totalAmount <= 0) {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Struk Tidak Dikenali:</b> Pastikan foto struk cukup terang dan tulisan total bayar terlihat jelas.`
        );
        return NextResponse.json({ status: 'ocr_failed' });
      }

      const defaultWallet = userWallets[0] || { id: '', name: 'Dompet' };

      const { data: rpcTxResult } = await supabase.rpc('insert_telegram_transaction', {
        p_chat_id: strChatId,
        p_wallet_id: defaultWallet.id,
        p_to_wallet_id: null,
        p_amount: ocrResult.totalAmount,
        p_type: 'expense',
        p_category: ocrResult.category,
        p_notes: `[OCR Struk] ${ocrResult.storeName} - ${ocrResult.notes}`,
      });

      let newBal = 0;
      if (rpcTxResult && rpcTxResult.length > 0) {
        newBal = Number(rpcTxResult[0].updated_balance);
      }

      let ocrReply = `📷 <b>STRUK BELANJA TERBACA & DICATAT!</b>\n\n`;
      ocrReply += `🏪 <b>Toko:</b> ${ocrResult.storeName}\n`;
      ocrReply += `💰 <b>Total Bayar:</b> ${formatRupiah(ocrResult.totalAmount)}\n`;
      ocrReply += `🏷️ <b>Kategori:</b> ${ocrResult.category}\n`;
      ocrReply += `👛 <b>Dompet:</b> ${defaultWallet.name}\n\n`;
      ocrReply += `📊 <b>Saldo ${defaultWallet.name} Terkini:</b> ${formatRupiah(newBal)}`;

      await sendTelegramMessage(chatId, ocrReply);
      return NextResponse.json({ status: 'ocr_success' });
    }

    // 6. Check if text is a Financial Question or Instant Transaction
    const parsedTx = parseTelegramText(cleanText, userWallets);

    if (parsedTx) {
      // Execute Instant Transaction Insertion
      let currentBalance = 0;
      const { data: rpcTxResult, error: rpcTxErr } = await supabase.rpc('insert_telegram_transaction', {
        p_chat_id: strChatId,
        p_wallet_id: parsedTx.walletId,
        p_to_wallet_id: parsedTx.type === 'transfer' ? parsedTx.toWalletId : null,
        p_amount: parsedTx.amount,
        p_type: parsedTx.type,
        p_category: parsedTx.category,
        p_notes: parsedTx.notes,
      });

      if (!rpcTxErr && rpcTxResult && rpcTxResult.length > 0) {
        currentBalance = Number(rpcTxResult[0].updated_balance);
      } else {
        await supabase.from('personal_transactions').insert({
          user_id: userId,
          wallet_id: parsedTx.walletId,
          to_wallet_id: parsedTx.type === 'transfer' ? parsedTx.toWalletId : null,
          amount: parsedTx.amount,
          type: parsedTx.type,
          category: parsedTx.category,
          notes: parsedTx.notes,
          date: new Date().toISOString(),
        });
      }

      const typeEmoji = parsedTx.type === 'income' ? '📥' : parsedTx.type === 'expense' ? '💸' : '🔄';
      const typeLabel = parsedTx.type === 'income' ? 'Pemasukan' : parsedTx.type === 'expense' ? 'Pengeluaran' : 'Transfer';

      let replyMsg = `✅ <b>TRANSAKSI BERHASIL DICATAT!</b>\n\n`;
      replyMsg += `${typeEmoji} <b>Tipe:</b> ${typeLabel}\n`;
      replyMsg += `💰 <b>Nominal:</b> ${formatRupiah(parsedTx.amount)}\n`;
      replyMsg += `🏷️ <b>Kategori:</b> ${parsedTx.category}\n`;
      replyMsg += `👛 <b>Dompet:</b> ${parsedTx.walletName}${parsedTx.type === 'transfer' ? ` ➔ ${parsedTx.toWalletName}` : ''}\n`;
      replyMsg += `📝 <b>Catatan:</b> "${parsedTx.notes}"\n\n`;
      replyMsg += `📊 <b>Saldo ${parsedTx.walletName} Terkini:</b> ${formatRupiah(currentBalance)}`;

      await sendTelegramMessage(chatId, replyMsg);
      return NextResponse.json({ status: 'tx_success' });
    }

    // 7. Handle Financial AI Chat Assistant Question
    const { data: recentTxs } = await supabase
      .from('personal_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    const aiAnswer = await answerFinancialQuestion(
      cleanText,
      userProfile.full_name,
      userWallets,
      recentTxs as any || []
    );

    await sendTelegramMessage(chatId, `🤖 <b>DuidNa AI Assistant:</b>\n\n${aiAnswer}`);
    return NextResponse.json({ status: 'ai_answered' });
  } catch (err: any) {
    console.error('Telegram Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
