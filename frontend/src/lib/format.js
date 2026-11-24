/** Formats "+998901234567" → "+998 90 123 45 67" */
export function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^998/, '').slice(0, 9);
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return `+998 ${parts.join(' ')}`.trim();
}

export const phoneDigits = (value) => {
  const d = String(value || '').replace(/\D/g, '');
  return d.startsWith('998') ? `+${d}` : `+998${d}`;
};

export const isValidPhone = (value) => /^\+998\d{9}$/.test(phoneDigits(value));

export const STATUS_TONES = {
  pending: 'muted',
  paid: 'rose',
  cooking: 'gold',
  delivering: 'gold',
  delivered: 'green',
  cancelled: 'muted',
  failed: 'muted',
};

/** Unsplash-style URL with explicit size. */
export const img = (url, w, h = w) => (url ? `${url}&w=${w}&h=${h}` : '');
