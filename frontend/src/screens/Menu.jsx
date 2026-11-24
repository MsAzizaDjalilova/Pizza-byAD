import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import LangSwitch from '../components/LangSwitch';
import Marquee from '../components/Marquee';
import PizzaStage from '../components/PizzaStage';
import ProductCard from '../components/ProductCard';
import { useI18n } from '../i18n';
import { haptic } from '../lib/telegram';
import { useCart } from '../store/cart';

export function BrandMark({ small = false }) {
  const { t } = useI18n();
  return (
    <div className={small ? 'brandmark small' : 'brandmark'}>
      <h1 className="serif">
        Blush <em>Slice.</em>
      </h1>
      <span className="brand-tag">PIZZA · {t('brandTag')}</span>
    </div>
  );
}

export default function Menu({ catalog, session, onOpenProduct, onQuickAdd, onAddFromStage, onCheckout, onOrders }) {
  const { t, L, money } = useI18n();
  const { count, subtotal, items } = useCart();
  const [category, setCategory] = useState(catalog.categories[0]?.id);
  const { freeDeliveryFrom } = catalog.pricing;

  const products = useMemo(() => catalog.products.filter((p) => p.category === category), [catalog, category]);
  const hasStage = products.length > 0 && products.every((p) => p.sizes);
  const qtyById = useMemo(() => {
    const m = {};
    items.forEach((i) => (m[i.productId] = (m[i.productId] || 0) + i.qty));
    return m;
  }, [items]);

  const left = Math.max(0, freeDeliveryFrom - subtotal);
  const progress = Math.min(1, subtotal / freeDeliveryFrom);
  const ordersToday = session?.socialProof?.ordersToday || 0;
  const name = session?.user?.firstName;

  return (
    <div className="screen menu">
      <header className="menu-header">
        <BrandMark />
        <div className="header-actions">
          <LangSwitch />
          <motion.button className="icon-btn" whileTap={{ scale: 0.88 }} onClick={() => (haptic.tap(), onOrders())} aria-label={t('myOrders')}>
            📦
          </motion.button>
        </div>
      </header>

      <Marquee />

      <section className="intro">
        {name && <span className="hello">{t('hello', { name })}</span>}
        <h2 className="serif display">
          {t('cravingA')} <em>{t('cravingB')}</em>
        </h2>
        {ordersToday >= 10 && (
          <div className="social-proof">
            <span className="pulse" /> {t('socialProof', { n: ordersToday })}
          </div>
        )}
      </section>

      <nav className="tabs" aria-label="Categories">
        {catalog.categories.map((c) => (
          <button
            key={c.id}
            className={c.id === category ? 'tab active' : 'tab'}
            onClick={() => {
              if (c.id === category) return;
              haptic.select();
              setCategory(c.id);
            }}
          >
            {c.id === category && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', damping: 26, stiffness: 380 }} />}
            <span className="tab-label">
              {c.emoji} {L(c.title)}
            </span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div key={category} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          {hasStage && (
            <>
              {category === 'fit' && <p className="fit-banner">{t('fitNote')}</p>}
              <p className="eyebrow center-text">— {t('ingredientsOf')} —</p>
              <PizzaStage products={products} ingredients={catalog.ingredients} onAdd={onAddFromStage} onDetails={onOpenProduct} inCart={qtyById} />
              <h3 className="section-heading serif">
                {t('fullMenu')} <em>· {products.length}</em>
              </h3>
            </>
          )}
          <div className="grid">
            {products.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                badges={catalog.badges}
                index={idx}
                inCart={qtyById[p.id] || 0}
                onOpen={onOpenProduct}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="bottom-spacer" />

      <AnimatePresence>
        {count > 0 && (
          <motion.div className="cart-bar" initial={{ y: 140 }} animate={{ y: 0 }} exit={{ y: 140 }} transition={{ type: 'spring', damping: 24, stiffness: 260 }}>
            <div className="cart-bar-progress">
              <span>{left > 0 ? t('freeLeft', { p: money(left) }) : t('freeYes')}</span>
              <div className="bar">
                <motion.div className="bar-fill" animate={{ width: `${progress * 100}%` }} />
              </div>
            </div>
            <motion.button className="btn primary block cart-btn" whileTap={{ scale: 0.97 }} onClick={() => (haptic.medium(), onCheckout())}>
              <motion.span key={count} className="cart-count" initial={{ scale: 1.7 }} animate={{ scale: 1 }}>
                {count}
              </motion.span>
              <span>{t('goCart')}</span>
              <span className="cart-total">{money(subtotal)}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
