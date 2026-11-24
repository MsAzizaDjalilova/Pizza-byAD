import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';
import Photo from './Photo';
import QtyStepper from './QtyStepper';
import { useI18n } from '../i18n';
import { haptic } from '../lib/telegram';
import { unitPrice } from '../store/cart';

const SIZE_SCALE = { S: 0.86, M: 1, L: 1.1 };

export default function ProductSheet({ product, ingredients, badges, onClose, onAdd }) {
  const { t, L, money } = useI18n();
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setSize(product.sizes ? 'M' : null);
      setQty(1);
    }
  }, [product]);

  const price = product ? unitPrice(product, size) : 0;
  const isPizza = Boolean(product?.sizes);

  return (
    <BottomSheet open={Boolean(product)} onClose={onClose}>
      {product && (
        <div className="product-sheet">
          <div className={`sheet-hero ${isPizza ? 'pizza' : 'arch'}`}>
            <motion.div
              initial={{ scale: 0.7, rotate: isPizza ? -90 : 0, opacity: 0 }}
              animate={{ scale: isPizza ? SIZE_SCALE[size] : 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 140 }}
            >
              <Photo src={product.image} alt={L(product.name)} size={560} className={isPizza ? 'round spin' : 'arch'} eager />
            </motion.div>
            {product.badge && <span className={`sticker big ${product.badge}`}>{L(badges[product.badge])}</span>}
          </div>

          <div className="product-sheet-head">
            <h2 className="serif">{L(product.name)}</h2>
            <div className="meta-row">
              <span>⭐ {product.rating.toFixed(1)}</span>
              <span>
                🔥 {product.kcal} {t('kcal')}
              </span>
              {product.protein && (
                <span>
                  💪 {product.protein} {t('protein')}
                </span>
              )}
            </div>
            <p className="desc">{L(product.desc)}</p>
            {product.category === 'fit' && <p className="fit-note">{t('fitNote')}</p>}
          </div>

          {product.ingredients?.length > 0 && (
            <div className="ingredient-chips">
              {product.ingredients.map((k, i) =>
                ingredients[k] ? (
                  <motion.span
                    key={k}
                    className="chip-ingr"
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                  >
                    {ingredients[k].emoji} <em>{L(ingredients[k].name)}</em>
                  </motion.span>
                ) : null
              )}
            </div>
          )}

          {isPizza && (
            <div className="segmented" role="radiogroup">
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={size === s.id}
                  className={size === s.id ? 'active' : ''}
                  onClick={() => {
                    haptic.select();
                    setSize(s.id);
                  }}
                >
                  {size === s.id && <motion.span layoutId="size-pill" className="segmented-pill" transition={{ type: 'spring', damping: 26, stiffness: 380 }} />}
                  <span className="segmented-label">
                    {L(s.label)} · {s.cm} cm
                  </span>
                  <span className="segmented-price">{money(s.price)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="sheet-actions">
            <QtyStepper value={qty} onChange={setQty} min={1} />
            <motion.button
              className="btn primary grow"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                haptic.success();
                onAdd(product.id, size, qty);
              }}
            >
              {t('addToCart')} · {money(price * qty)}
            </motion.button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
