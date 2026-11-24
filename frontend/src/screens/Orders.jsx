import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Photo from '../components/Photo';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { STATUS_TONES } from '../lib/format';
import { haptic, openSupport, useBackButton } from '../lib/telegram';
import { useCart } from '../store/cart';

export default function Orders({ session, onBack, onReorder }) {
  const { t, L, money, lang, errorText } = useI18n();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const { add, productMap } = useCart();

  useBackButton(onBack);

  useEffect(() => {
    api
      .orders()
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(errorText(e)));
  }, [errorText]);

  const reorder = (order) => {
    haptic.success();
    order.items.filter((i) => !i.isBump && productMap.has(i.productId)).forEach((i) => add(i.productId, i.size, i.qty));
    onReorder();
  };

  const locale = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' }[lang];

  return (
    <div className="screen orders">
      <header className="page-header">
        <button className="icon-btn" onClick={() => (haptic.tap(), onBack())} aria-label="Back">
          ←
        </button>
        <h1 className="serif">{t('myOrders')}</h1>
        <span />
      </header>

      {error && <p className="muted center">{error}</p>}
      {!orders && !error && (
        <div className="center">
          <span className="spinner dark" />
        </div>
      )}
      {orders?.length === 0 && (
        <div className="empty">
          <div className="empty-emoji">🍕</div>
          <h2 className="serif">{t('noOrders')}</h2>
          <p>{t('noOrdersText')}</p>
          <button className="btn primary" onClick={() => (haptic.tap(), onBack())}>
            {t('openMenu')}
          </button>
        </div>
      )}

      {orders?.map((o, idx) => {
        const photos = o.items.map((i) => productMap.get(i.productId)).filter(Boolean).slice(0, 4);
        return (
          <motion.article key={o.id} className="card order-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="order-head">
              <strong className="serif">#{o.id}</strong>
              <span className={`status ${STATUS_TONES[o.status] || 'muted'}`}>{t(`status_${o.status}`)}</span>
            </div>
            <div className="order-photos">
              {photos.map((p, k) => (
                <Photo key={k} src={p.image} alt="" size={100} className="round order-photo" />
              ))}
            </div>
            <p className="order-items">
              {o.items.map((i) => `${L(productMap.get(i.productId)?.name) || i.name} × ${i.qty}`).join(' · ')}
            </p>
            <div className="order-foot">
              <span className="muted">{new Date(o.createdAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="price">{money(o.totalAmount)}</span>
            </div>
            <motion.button className="btn soft block" whileTap={{ scale: 0.96 }} onClick={() => reorder(o)}>
              🔁 {t('reorder')}
            </motion.button>
          </motion.article>
        );
      })}

      {session?.support && (
        <button className="support-link" onClick={() => (haptic.tap(), openSupport(session.support))}>
          💌 {t('supportLink')}
        </button>
      )}
    </div>
  );
}
