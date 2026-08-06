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
