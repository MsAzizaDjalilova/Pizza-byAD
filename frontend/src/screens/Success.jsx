import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Hearts from '../components/Hearts';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

const COLORS = ['#FF4D79', '#FFC2D4', '#D4AF37', '#FFFFFF', '#FF8FAB'];

function celebrate() {
  const heart = confetti.shapeFromText ? confetti.shapeFromText({ text: '💖', scalar: 2 }) : null;
  const end = Date.now() + 1300;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS, shapes: ['circle'] });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS, shapes: ['circle'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 90, spread: 100, startVelocity: 38, origin: { y: 0.45 }, colors: COLORS, scalar: 1.1 });
  if (heart) confetti({ particleCount: 24, spread: 120, startVelocity: 30, origin: { y: 0.5 }, shapes: [heart], scalar: 2 });
}

/** `order.awaiting` = true for external payments (crypto) — poll until the webhook marks it paid. */
export default function Success({ order, onMenu, onOrders, onConfirmed }) {
  const { t, money } = useI18n();
  const [paid, setPaid] = useState(!order.awaiting);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!paid) return undefined;
    haptic.success();
    celebrate();
    setBurst(1);
    const timer = setTimeout(() => setBurst(2), 700);
    return () => clearTimeout(timer);
  }, [paid]);

  useEffect(() => {
    if (paid) return undefined;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try {
        const o = await api.order(order.orderId);
        if (o.status !== 'pending' && o.status !== 'failed') {
          clearInterval(timer);
          setPaid(true);
          onConfirmed?.();
        }
      } catch {
        /* keep polling */
      }
      if (tries > 150) clearInterval(timer); // ~10 min
    }, 4000);
    return () => clearInterval(timer);
  }, [paid, order.orderId, onConfirmed]);

  return (
    <div className="screen success">
      <Hearts trigger={burst} count={14} />
      <motion.div className="success-badge" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 9, stiffness: 140 }}>
        {paid ? '💖' : '⏳'}
      </motion.div>

      {paid ? (
        <>
          <h1 className="serif display">{t('successTitle')}</h1>
          <p>{t('successText', { id: order.orderId })}</p>
          <p className="muted">{t('successNote')}</p>
        </>
      ) : (
        <>
          <h1 className="serif display">{t('waitingTitle')}</h1>
          <p>{t('waitingText', { id: order.orderId, p: money(order.totalAmount) })}</p>
          <span className="spinner dark" />
        </>
      )}

      <div className="success-actions">
        <motion.button className="btn primary block" whileTap={{ scale: 0.96 }} onClick={() => (haptic.tap(), onOrders())}>
          📦 {t('myOrders')}
        </motion.button>
        <motion.button className="btn ghost block" whileTap={{ scale: 0.96 }} onClick={() => (haptic.tap(), onMenu())}>
          {t('backToMenu')}
        </motion.button>
      </div>
    </div>
  );
}
