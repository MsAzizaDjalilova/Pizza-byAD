import { motion } from 'framer-motion';
import Photo from './Photo';
import { useI18n } from '../i18n';
import { haptic } from '../lib/telegram';

export default function ProductCard({ product, badges, inCart, onOpen, onQuickAdd, index = 0 }) {
  const { t, L, money } = useI18n();
  const isPizza = Boolean(product.sizes);
  const fromPrice = isPizza ? product.sizes[0].price : product.price;

  return (
    <motion.article
      className={`card product-card ${isPizza ? 'is-pizza' : 'is-arch'}`}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ delay: Math.min(index, 8) * 0.045, type: 'spring', damping: 22 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        haptic.tap();
        onOpen(product);
      }}
    >
      {product.badge && (
        <span className={`sticker ${product.badge}`} style={{ rotate: index % 2 ? '6deg' : '-7deg' }}>
          {L(badges[product.badge])}
        </span>
      )}
      {inCart > 0 && <span className="in-cart">{inCart}</span>}

      <div className="product-photo">
        <Photo src={product.image} alt={L(product.name)} size={300} className={isPizza ? 'round spin-hover' : 'arch'} />
        <motion.button
          className="add-btn"
          aria-label={t('addToCart')}
          whileTap={{ scale: 0.8, rotate: 90 }}
          onClick={(e) => {
            e.stopPropagation();
            if (isPizza) {
              haptic.tap();
              onOpen(product);
            } else {
              haptic.success();
              onQuickAdd(product);
            }
          }}
        >
          +
        </motion.button>
      </div>

      <h3 className="serif">{L(product.name)}</h3>
      <p className="tagline">{L(product.desc)}</p>

      <div className="product-foot">
        <span className="price">
          {isPizza ? t('priceFrom', { p: money(fromPrice) }) : money(fromPrice)}
          {product.oldPrice && <s>{money(product.oldPrice)}</s>}
        </span>
      </div>
    </motion.article>
  );
}
