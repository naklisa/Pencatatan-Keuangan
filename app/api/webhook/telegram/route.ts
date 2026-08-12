import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseTelegramText } from '@/lib/telegram-parser';
import { formatRupiah } from '@/lib/utils';
import { Wallet } from '@/types/database';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a Supabase admin/service client using anon or service key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to send Telegram message
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

    // 1. Handle /start command (Pairing Account)
    if (cleanText.startsWith('/start')) {
      const parts = cleanText.split(' ');
      const userIdParam = parts[1]; // /start <user_id>

      if (userIdParam) {
        // Pair user_id with telegram_chat_id
        const { error } = await supabase
          .from('profiles')
          .update({ telegram_chat_id: chatId.toString() })
          .eq('id', userIdParam);

        if (!error) {
          await sendTelegramMessage(
            chatId,
            `🎉 <b>Selamat! Akun Keuangan Anda Berhasil Terhubung!</b>\n\nSekarang Anda dapat mencatat transaksi secara langsung lewat chat di bot ini.\n\n💡 <b>Contoh Cara Pakai:</b>\n• <code>Makan Nasi Padang 35rb bca</code>\n• <code>Pemasukan gaji 5jt bca</code>\n• <code>Transfer 200rb bca dana</code>\n• <code>/saldo</code> (untuk cek saldo)`
          );
          return NextResponse.json({ status: 'paired' });
        }
      }

      // Check if already paired
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_chat_id', chatId.toString())
        .single();

      if (existingUser) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Halo ${existingUser.full_name || 'Pengguna'}!</b>\nAkun Anda sudah terhubung dengan Bot @DuidNa_bot.\n\nKetik transaksi Anda kapan saja (misal: <code>Makan 35rb bca</code>) atau ketik <code>/saldo</code>.`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Akun Belum Terhubung</b>\n\nSilakan buka <b>Dashboard Aplikasi Pencatatan Keuangan</b> Anda, lalu klik tombol <b>"Hubungkan Telegram Bot"</b> untuk mengaktifkan fitur ini.`
        );
      }
      return NextResponse.json({ status: 'ok' });
    }

    // 2. Query user profile by telegram_chat_id
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_chat_id', chatId.toString())
      .single();

    if (!userProfile) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Akun Belum Terhubung</b>\n\nSilakan buka <b>Dashboard Aplikasi Pencatatan Keuangan</b> Anda, lalu klik tombol <b>"Hubungkan Telegram Bot"</b> untuk menghubungkan akun ini.`
      );
      return NextResponse.json({ status: 'unpaired' });
    }

    const userId = userProfile.id;

    // Fetch user wallets
    const { data: userWallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');

    const walletsList: Wallet[] = userWallets || [];

    // 3. Handle /saldo command
    if (cleanText.startsWith('/saldo') || cleanText.startsWith('/cek')) {
      if (walletsList.length === 0) {
        await sendTelegramMessage(chatId, `👛 <b>Belum Ada Dompet Aktif</b>`);
        return NextResponse.json({ status: 'ok' });
      }

      const totalBalance = walletsList.reduce((acc, w) => acc + Number(w.balance), 0);
      let balanceText = `📊 <b>RINGKASAN SALDO DOMPET</b>\n\n`;

      walletsList.forEach((w) => {
        balanceText += `• <b>${w.name}</b>: ${formatRupiah(w.balance)}\n`;
      });

      balanceText += `\n💰 <b>TOTAL NET WORTH: ${formatRupiah(totalBalance)}</b>`;
      await sendTelegramMessage(chatId, balanceText);
      return NextResponse.json({ status: 'ok' });
    }

    // 4. Parse transaction text
    const parsed = parseTelegramText(cleanText, walletsList);

    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        `❓ <b>Format Tidak Dikenali</b>\n\nMohon masukkan jumlah nominal transaksi.\n\n💡 <i>Contoh:</i>\n• <code>Makan Nasi Padang 35rb bca</code>\n• <code>Gaji bulanan 5jt bca</code>\n• <code>Transfer 200rb bca dana</code>`
      );
      return NextResponse.json({ status: 'parse_error' });
    }

    // 5. Insert transaction into Supabase
    const { error: insertError } = await supabase.from('personal_transactions').insert({
      user_id: userId,
      wallet_id: parsed.walletId,
      to_wallet_id: parsed.type === 'transfer' ? parsed.toWalletId : null,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      notes: parsed.notes,
      date: new Date().toISOString(),
    });

    if (insertError) {
      await sendTelegramMessage(chatId, `❌ <b>Gagal Menyimpan Transaksi:</b> ${insertError.message}`);
      return NextResponse.json({ status: 'db_error' });
    }

    // Fetch updated target wallet balance
    const { data: updatedWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', parsed.walletId)
      .single();

    const currentBalance = updatedWallet ? Number(updatedWallet.balance) : 0;

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
