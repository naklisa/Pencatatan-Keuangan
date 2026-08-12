import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseTelegramText } from '@/lib/telegram-parser';
import { formatRupiah } from '@/lib/utils';
import { Wallet } from '@/types/database';

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

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (!update || !update.message) {
      return NextResponse.json({ status: 'ok' });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text: string = message.text || '';
    const cleanText = text.trim();

    if (!cleanText) {
      return NextResponse.json({ status: 'ok' });
    }

    const strChatId = chatId.toString();

    // 1. Handle /start command (Pairing Account)
    if (cleanText.startsWith('/start')) {
      const parts = cleanText.split(' ');
      const userIdParam = parts[1]; // /start <user_id>

      if (userIdParam) {
        // Try RPC first, fallback to direct update
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
            `🎉 <b>Selamat! Akun Keuangan Anda Berhasil Terhubung!</b>\n\nSekarang Anda dapat mencatat transaksi secara langsung lewat chat di bot ini.\n\n💡 <b>Contoh Cara Pakai:</b>\n• <code>Makan Nasi Padang 35rb bca</code>\n• <code>Pemasukan gaji 5jt bca</code>\n• <code>Transfer 200rb bca dana</code>\n• <code>/saldo</code> (untuk cek saldo)`
          );
          return NextResponse.json({ status: 'paired' });
        }
      }

      // Check if already paired via RPC or direct query
      let existingUser: any = null;
      const { data: rpcProfile } = await supabase.rpc('get_profile_by_telegram_chat_id', {
        p_chat_id: strChatId,
      });

      if (rpcProfile && rpcProfile.length > 0) {
        existingUser = rpcProfile[0];
      } else {
        const { data: directProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_chat_id', strChatId)
          .single();
        existingUser = directProfile;
      }

      if (existingUser) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Halo ${existingUser.full_name || 'Pengguna'}!</b>\nAkun Anda sudah terhubung dengan Bot @DuidNa_bot.\n\nKetik transaksi Anda kapan saja (misal: <code>Makan 35rb bca</code>) atau ketik <code>/saldo</code>.`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Akun Belum Terhubung</b>\n\nSilakan buka <b>Dashboard Aplikasi Pencatatan Keuangan</b> Anda, lalu klik tombol <b>"Bot Telegram"</b> untuk mengaktifkan fitur ini.`
        );
      }
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Fetch User Profile by Telegram Chat ID
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

    if (!userProfile) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Akun Belum Terhubung</b>\n\nSilakan buka <b>Dashboard Aplikasi Pencatatan Keuangan</b> Anda, lalu klik tombol <b>"Bot Telegram"</b> untuk menghubungkan akun ini.`
      );
      return NextResponse.json({ status: 'unpaired' });
    }

    const userId = userProfile.id;

    // Fetch user wallets
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

    // 3. Handle /saldo command
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

    // 4. Parse transaction text
    const parsed = parseTelegramText(cleanText, userWallets);

    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        `❓ <b>Format Tidak Dikenali</b>\n\nMohon masukkan jumlah nominal transaksi.\n\n💡 <i>Contoh:</i>\n• <code>Makan Nasi Padang 35rb bca</code>\n• <code>Gaji bulanan 5jt bca</code>\n• <code>Transfer 200rb bca dana</code>`
      );
      return NextResponse.json({ status: 'parse_error' });
    }

    // 5. Insert transaction into Supabase via RPC or Direct
    let isTxInserted = false;
    let currentBalance = 0;

    const { data: rpcTxResult, error: rpcTxErr } = await supabase.rpc('insert_telegram_transaction', {
      p_chat_id: strChatId,
      p_wallet_id: parsed.walletId,
      p_to_wallet_id: parsed.type === 'transfer' ? parsed.toWalletId : null,
      p_amount: parsed.amount,
      p_type: parsed.type,
      p_category: parsed.category,
      p_notes: parsed.notes,
    });

    if (!rpcTxErr && rpcTxResult && rpcTxResult.length > 0) {
      isTxInserted = true;
      currentBalance = Number(rpcTxResult[0].updated_balance);
    } else {
      const { error: directTxErr } = await supabase.from('personal_transactions').insert({
        user_id: userId,
        wallet_id: parsed.walletId,
        to_wallet_id: parsed.type === 'transfer' ? parsed.toWalletId : null,
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        notes: parsed.notes,
        date: new Date().toISOString(),
      });

      if (!directTxErr) {
        isTxInserted = true;
        const { data: updatedW } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', parsed.walletId)
          .single();
        if (updatedW) currentBalance = Number(updatedW.balance);
      } else {
        await sendTelegramMessage(chatId, `❌ <b>Gagal Menyimpan Transaksi:</b> ${directTxErr.message}`);
        return NextResponse.json({ status: 'db_error' });
      }
    }

    const typeEmoji = parsed.type === 'income' ? '📥' : parsed.type === 'expense' ? '💸' : '🔄';
    const typeLabel = parsed.type === 'income' ? 'Pemasukan' : parsed.type === 'expense' ? 'Pengeluaran' : 'Transfer';

    let replyMsg = `✅ <b>TRANSAKSI BERHASIL DICATAT!</b>\n\n`;
    replyMsg += `${typeEmoji} <b>Tipe:</b> ${typeLabel}\n`;
    replyMsg += `💰 <b>Nominal:</b> ${formatRupiah(parsed.amount)}\n`;
    replyMsg += `🏷️ <b>Kategori:</b> ${parsed.category}\n`;
    replyMsg += `👛 <b>Dompet:</b> ${parsed.walletName}${parsed.type === 'transfer' ? ` ➔ ${parsed.toWalletName}` : ''}\n`;
    replyMsg += `📝 <b>Catatan:</b> "${parsed.notes}"\n\n`;
    replyMsg += `📊 <b>Saldo ${parsed.walletName} Terkini:</b> ${formatRupiah(currentBalance)}`;

    await sendTelegramMessage(chatId, replyMsg);
    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error('Telegram Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
