import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'blush-slice-cart-v1';
const CartContext = createContext(null);

const load = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => i && i.productId && i.qty > 0) : [];
  } catch {
    return [];
  }
};

export const lineKey = (productId, size) => `${productId}:${size || '-'}`;

/** Look up the display price for a cart line from the catalog. */
export function unitPrice(product, size) {
  if (!product) return 0;
  if (product.sizes) return product.sizes.find((s) => s.id === size)?.price ?? 0;
  return product.price;
}

export function CartProvider({ catalog, children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const productMap = useMemo(() => new Map((catalog?.products || []).map((p) => [p.id, p])), [catalog]);

  // Drop lines whose product disappeared from the menu
  useEffect(() => {
    if (productMap.size) setItems((prev) => prev.filter((i) => productMap.has(i.productId)));
  }, [productMap]);

  const add = useCallback((productId, size, qty = 1) => {
    setItems((prev) => {
      const k = lineKey(productId, size);
      const found = prev.find((i) => lineKey(i.productId, i.size) === k);
      if (found) return prev.map((i) => (i === found ? { ...i, qty: Math.min(20, i.qty + qty) } : i));
      return [...prev, { productId, size: size || null, qty }];
    });
  }, []);

  const setQty = useCallback((productId, size, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => lineKey(i.productId, i.size) !== lineKey(productId, size))
        : prev.map((i) => (lineKey(i.productId, i.size) === lineKey(productId, size) ? { ...i, qty: Math.min(20, qty) } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo(
    () =>
      items
        .map((i) => {
          const product = productMap.get(i.productId);
          const price = unitPrice(product, i.size);
          return product ? { ...i, product, price, total: price * i.qty } : null;
        })
        .filter(Boolean),
    [items, productMap]
  );

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);

  const value = useMemo(
    () => ({ items, lines, count, subtotal, add, setQty, clear, productMap }),
    [items, lines, count, subtotal, add, setQty, clear, productMap]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
