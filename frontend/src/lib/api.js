import { tg } from './telegram';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Errors carry a machine `code`; screens translate it with i18n.errorText(). */
async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `tma ${tg?.initData || ''}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Network error'), { code: 'NETWORK' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.message || 'Request failed'), { code: data.error, status: res.status });
  }
  return data;
}

export const api = {
  session: () => request('/session', { method: 'POST' }),
  completeOnboarding: () => request('/onboarding/complete', { method: 'POST' }),
  setLanguage: (language) => request('/language', { method: 'POST', body: { language } }),
  catalog: () => request('/catalog'),
  quote: (items, orderBump) => request('/cart/quote', { method: 'POST', body: { items, orderBump } }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  orders: () => request('/orders'),
  order: (id) => request(`/orders/${id}`),
};
