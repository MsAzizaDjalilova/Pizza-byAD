import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import Photo from '../components/Photo';
import QtyStepper from '../components/QtyStepper';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { formatPhone, isValidPhone, phoneDigits } from '../lib/format';
import { haptic, openInvoice, openTelegramLink, requestContact, useBackButton } from '../lib/telegram';
import { useCart } from '../store/cart';

/**
 * Single-page bag + checkout (fewer steps = higher conversion):
 * items → free-delivery nudge → cross-sell → order bump → contact → payment → pay.
 */
export default function Checkout({ catalog, session, onBack, onPaid, onPending, toast }) {
  const { t, L, money, errorText } = useI18n();
  const { lines, items, setQty, add, productMap } = useCart();
  const bump = catalog.orderBump;
  const methods = session?.paymentMethods || [];

  const [orderBump, setOrderBump] = useState(false);
  const [quote, setQuote] = useState(null);
  const [phone, setPhone] = useState(session?.user?.phone ? formatPhone(session.user.phone) : '+998 ');
  const [address, setAddress] = useState(session?.user?.lastAddress || '');
  const [comment, setComment] = useState('');
  const [method, setMethod] = useState(methods[0]?.id);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const formRef = useRef(null);

  useBackButton(onBack);

  // The server quote is the source of truth for totals
  const payloadItems = useMemo(() => items.map(({ productId, size, qty }) => ({ productId, size, qty })), [items]);
  useEffect(() => {
    if (!payloadItems.length) {
      setQuote(null);
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(() => {
      api
        .quote(payloadItems, orderBump)
        .then((q) => alive && setQuote(q))
        .catch(() => alive && setQuote(null));
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [payloadItems, orderBump]);

  const localSubtotal = lines.reduce((s, l) => s + l.total, 0) + (orderBump ? bump.price : 0);
  const subtotal = quote?.subtotal ?? localSubtotal;
  const { freeDeliveryFrom, deliveryFee: fee } = catalog.pricing;
  const delivery = quote?.deliveryFee ?? (localSubtotal >= freeDeliveryFrom ? 0 : fee);
  const total = quote?.totalAmount ?? localSubtotal + delivery;
  const left = Math.max(0, freeDeliveryFrom - subtotal);

  const crossSell = useMemo(
    () =>
      catalog.products
        .filter((p) => ['drinks', 'desserts', 'snacks'].includes(p.category) && p.id !== bump.productId && !items.some((i) => i.productId === p.id))
        .sort((a, b) => (b.badge === 'hit') - (a.badge === 'hit'))
        .slice(0, 8),
    [catalog, items, bump.productId]
  );

  const phoneOk = isValidPhone(phone);
  const addressOk = address.trim().length >= 5;

  async function sharePhone() {
    haptic.tap();
    const res = await requestContact();
    if (typeof res === 'string') {
      setPhone(formatPhone(res));
      haptic.success();
    } else if (res === true) {
      toast(t('phoneSaved'));
    }
  }

  async function pay() {
    setTouched(true);
    if (!phoneOk || !addressOk) {
      haptic.error();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return toast(t('fillForm'));
    }
    if (!method) return toast(t('chooseMethod'));
    haptic.heavy();
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        items: payloadItems,
        orderBump,
        paymentMethod: method,
        phone: phoneDigits(phone),
        address: address.trim(),
        comment: comment.trim() || undefined,
      });
      if (order.demo) {
        // Demo backend: payment is simulated
        haptic.success();
        onPaid(order);
        return;
      }
      if (order.method === 'crypto') {
        openTelegramLink(order.invoiceLink);
        onPending(order);
        return;
      }
      const status = await openInvoice(order.invoiceLink);
      if (status === 'paid') {
        haptic.success();
        onPaid(order);
      } else if (status === 'pending') {
        onPending(order);
      } else if (status === 'failed') {
        haptic.error();
        toast(t('payFailed'));
      } else {
        haptic.warning();
        toast(t('payCancelled'));
      }
    } catch (err) {
      haptic.error();
      toast(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!lines.length) {
    return (
      <div className="screen empty">
        <motion.div className="empty-emoji" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          🛍
        </motion.div>
        <h2 className="serif">{t('emptyCart')}</h2>
        <p>{t('emptyCartText')}</p>
        <button className="btn primary" onClick={() => (haptic.tap(), onBack())}>
          {t('backToMenu')}
        </button>
      </div>
    );
  }

  return (
    <div className="screen checkout">
      <header className="page-header">
        <button className="icon-btn" onClick={() => (haptic.tap(), onBack())} aria-label="Back">
          ←
        </button>
        <h1 className="serif">{t('cartTitle')}</h1>
        <span />
      </header>

      <section className="card list">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.div
              key={`${l.productId}:${l.size}`}
              className="line"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, x: -40 }}
            >
              <Photo src={l.product.image} alt="" size={120} className={l.product.sizes ? 'round line-photo' : 'arch line-photo'} />
              <div className="line-info">
                <strong className="serif">{L(l.product.name)}</strong>
                <small>
                  {l.size ? `${L(l.product.sizes.find((s) => s.id === l.size)?.label)} · ${l.product.sizes.find((s) => s.id === l.size)?.cm} cm` : L(l.product.desc)}
                </small>
                <span className="price">{money(l.total)}</span>
              </div>
              <QtyStepper small value={l.qty} onChange={(q) => setQty(l.productId, l.size, q)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <section className="card delivery-nudge">
        <span>{left > 0 ? t('nudgeMore', { p: money(left) }) : t('freeYes')}</span>
        <div className="bar">
          <motion.div className="bar-fill" animate={{ width: `${Math.min(100, (subtotal / freeDeliveryFrom) * 100)}%` }} />
        </div>
      </section>

      {crossSell.length > 0 && (
        <section>
          <h3 className="section-title">{t('pairsWell')}</h3>
          <div className="hscroll">
            {crossSell.map((p) => (
              <motion.button
                key={p.id}
                className="card mini-card"
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  haptic.success();
                  add(p.id, null, 1);
                  toast(t('added', { name: L(p.name) }));
                }}
              >
                <Photo src={p.image} alt="" size={160} className="arch mini-photo" />
                <span className="mini-name">{L(p.name)}</span>
                <span className="mini-price">+ {money(p.price)}</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {bump && productMap.has(bump.productId) && (
        <motion.label className={orderBump ? 'bump active' : 'bump'} whileTap={{ scale: 0.98 }} animate={orderBump ? { scale: [1, 1.03, 1] } : {}}>
          <input
            type="checkbox"
            checked={orderBump}
            onChange={(e) => {
              if (e.target.checked) haptic.success();
              else haptic.soft();
              setOrderBump(e.target.checked);
            }}
          />
          <span className="bump-check">{orderBump ? '✓' : ''}</span>
          <Photo src={bump.image} alt="" size={140} className="round bump-photo" />
          <span className="bump-text">
            <span className="sticker hit inline">{t('specialOffer')}</span>
            <strong>{L(bump.title)}</strong>
            <small>{L(bump.subtitle)}</small>
            <span className="bump-price">
              <s>{money(bump.oldPrice)}</s>
              <b>{money(bump.price)}</b>
            </span>
          </span>
        </motion.label>
      )}

      <section className="card form" ref={formRef}>
        <h3 className="section-title">📍 {t('deliveryTitle')}</h3>
        <label className={touched && !phoneOk ? 'field error' : 'field'}>
          <span>{t('phone')}</span>
          <div className="field-row">
            <input inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+998 90 123 45 67" />
            <button type="button" className="chip" onClick={sharePhone}>
              📱 {t('share')}
            </button>
          </div>
        </label>
        <label className={touched && !addressOk ? 'field error' : 'field'}>
          <span>{t('address')}</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('addressPh')} />
        </label>
        <label className="field">
          <span>{t('comment')}</span>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('commentPh')} maxLength={300} />
        </label>
      </section>

      <section className="card pad">
        <h3 className="section-title">💳 {t('payment')}</h3>
        <div className="methods">
          {methods.map((m) => (
            <motion.button
              key={m.id}
              className={m.id === method ? 'method active' : 'method'}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                haptic.select();
                setMethod(m.id);
              }}
            >
              <span className="method-emoji">{m.emoji}</span>
              {m.title}
            </motion.button>
          ))}
        </div>
        {method === 'stars' && <p className="hint">{t('starsHint')}</p>}
        {method === 'crypto' && <p className="hint">{t('cryptoHint')}</p>}
      </section>

      <section className="card summary pad">
        <div>
          <span>{t('items')}</span>
          <span>{money(subtotal)}</span>
        </div>
        <div>
          <span>{t('deliveryFee')}</span>
          <span>{delivery === 0 ? <b className="free">{t('free')}</b> : money(delivery)}</span>
        </div>
        <div className="summary-total">
          <span className="serif">{t('total')}</span>
          <motion.span key={total} className="serif" initial={{ scale: 1.15, color: '#FF4D79' }} animate={{ scale: 1, color: '#2D131E' }}>
            {money(total)}
          </motion.span>
        </div>
      </section>

      <p className="trust">{t('trust')}</p>
      <div className="bottom-spacer" />

      <div className="pay-bar">
        <motion.button className="btn primary block" whileTap={{ scale: 0.97 }} disabled={submitting || !method} onClick={pay}>
          {submitting ? <span className="spinner" /> : t('pay', { p: money(total) })}
        </motion.button>
      </div>
    </div>
  );
}
