import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format mata uang Rupiah Indonesia (IDR)
 * Contoh: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number, withSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (!withSymbol) {
    return formatted.replace("Rp", "").trim();
  }
  return formatted;
}

/**
 * Utility parse string input harga rupiah ke angka
 */
export function parseRupiahInput(value: string): number {
  const cleanString = value.replace(/[^0-9]/g, "");
  return cleanString ? parseInt(cleanString, 10) : 0;
}

/**
 * Mengonversi nominal angka menjadi ejaan teks Bahasa Indonesia
 * Contoh: 9000 -> "Sembilan Ribu Rupiah"
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(amount: number): string {
  if (isNaN(amount) || amount <= 0) return '';

  const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convert(n: number): string {
    if (n < 12) return angka[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return (convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10)).trim();
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000) return (convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100)).trim();
    if (n < 2000) return 'Seribu ' + convert(n - 1000);
    if (n < 1000000) return (convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000)).trim();
    if (n < 1000000000) return (convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000)).trim();
    if (n < 1000000000000) return (convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000)).trim();
    return (convert(Math.floor(n / 1000000000000)) + ' Triliun ' + convert(n % 1000000000000)).trim();
  }

  const result = convert(Math.floor(amount)).trim().replace(/\s+/g, ' ');
  return result ? `${result} Rupiah` : '';
}
