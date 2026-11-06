import { getCountryByCode, DEFAULT_COUNTRY } from '../data/countries';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  PKR: 'Rs. ',
  AED: 'AED ',
  SAR: 'SAR ',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  CHF: 'CHF ',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  MYR: 'RM ',
  SGD: 'S$',
  BDT: 'Tk ',
  QAR: 'QAR ',
  KWD: 'KWD ',
  OMR: 'OMR ',
  ZAR: 'R ',
  TRY: '₺',
};

export const ZERO_DECIMAL_CURRENCIES = new Set(['PKR', 'JPY', 'KRW', 'VND', 'IDR']);

/**
 * Format a USD base amount into the customer's selected currency
 * @param amountInUsd - Authoritative USD price
 * @param currency - Target ISO 4217 currency code (e.g. USD, GBP, PKR)
 * @param rates - Map of exchange rates relative to 1 USD
 */
export function formatCurrency(
  amountInUsd: number | undefined | null,
  currency: string = 'USD',
  rates: Record<string, number> = {}
): string {
  const curr = (currency && typeof currency === 'string' ? currency : 'USD').toUpperCase().trim();

  if (amountInUsd === undefined || amountInUsd === null || isNaN(Number(amountInUsd))) {
    const symbol = CURRENCY_SYMBOLS[curr] || `${curr} `;
    return `${symbol}0`;
  }
  const rate = rates[curr] || (curr === 'USD' ? 1.0 : curr === 'PKR' ? 280.0 : 1.0);
  const converted = Number(amountInUsd) * rate;

  const symbol = CURRENCY_SYMBOLS[curr] || `${curr} `;

  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    const rounded = Math.round(converted);
    return `${symbol}${rounded.toLocaleString()}`;
  }

  return `${symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert USD amount to target currency number
 */
export function convertCurrency(
  amountInUsd: number,
  currency: string = 'USD',
  rates: Record<string, number> = {}
): number {
  const curr = (currency && typeof currency === 'string' ? currency : 'USD').toUpperCase().trim();
  const rate = rates[curr] || (curr === 'USD' ? 1.0 : curr === 'PKR' ? 280.0 : 1.0);
  const converted = amountInUsd * rate;
  return ZERO_DECIMAL_CURRENCIES.has(curr)
    ? Math.round(converted)
    : Math.round(converted * 100) / 100;
}

/**
 * Format an amount that is already in the specified currency
 */
export function formatOrderAmount(
  amount: number | undefined | null,
  currency: string = 'USD'
): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
    return `${symbol}0`;
  }
  const curr = (currency || 'USD').toUpperCase().trim();
  const symbol = CURRENCY_SYMBOLS[curr] || `${curr} `;
  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return `${symbol}${Math.round(Number(amount)).toLocaleString()}`;
  }
  return `${symbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
