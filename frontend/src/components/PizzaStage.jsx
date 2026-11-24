import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Photo from './Photo';
import { useI18n } from '../i18n';
import { haptic } from '../lib/telegram';

/* Where the four ingredients float, relative to the centre of the stage (px). */
const ANCHORS = [
  { x: -122, y: -118, align: 'left' },
  { x: 126, y: -104, align: 'right' },
  { x: -146, y: 28, align: 'left' },
  { x: 148, y: 44, align: 'right' },
];
const PIZZA = 232; // centre pizza diameter at size M
const SIZE_SCALE = { S: 0.84, M: 1, L: 1.12 };

/* Scattered crumbs, like flour on an editorial table. */
const CRUMBS = [
  [-60, -160, 5, '#FF4D79'], [40, -170, 4, '#D4AF37'], [170, -40, 4, '#7FB77E'], [-175, -60, 3, '#FF8FAB'],
  [-90, 150, 4, '#D4AF37'], [80, 160, 5, '#FF4D79'], [-20, 175, 3, '#7FB77E'], [150, 120, 3, '#FF8FAB'],
  [-150, 110, 4, '#FF4D79'], [100, -150, 3, '#7FB77E'], [-130, -150, 4, '#D4AF37'], [190, 10, 3, '#FF4D79'],
];

const pizzaVariants = {
  enter: (dir) => ({ x: dir * 260, rotate: dir * 160, scale: 0.45, opacity: 0 }),
  center: (scale) => ({ x: 0, rotate: 0, scale, opacity: 1 }),
  exit: (dir) => ({ x: -dir * 260, rotate: -dir * 160, scale: 0.45, opacity: 0 }),
};

function edgePoint(a, radius) {
  const len = Math.hypot(a.x, a.y) || 1;
  return { x: (a.x / len) * radius, y: (a.y / len) * radius };
}

export default function PizzaStage({ products, ingredients, onAdd, onDetails, inCart = {} }) {
  const { t, L, money, lang } = useI18n();
  const [[index, dir], setPage] = useState([0, 0]);
  const [sizes, setSizes] = useState({});
  const [pop, setPop] = useState(0);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-220, 220], [-70, 70]);

  useEffect(() => setPage([0, 0]), [products]);

  const n = products.length;
  const i = ((index % n) + n) % n;
  const product = products[i];
  const prev = products[(i - 1 + n) % n];
  const next = products[(i + 1) % n];
  const size = sizes[product.id] || 'M';
  const sizeObj = product.sizes.find((s) => s.id === size);
  const scale = SIZE_SCALE[size];

  const ingr = useMemo(
    () => (product.ingredients || []).slice(0, 4).map((k) => ({ key: k, ...ingredients[k] })).filter((x) => x.emoji),
    [product, ingredients]
  );

  const paginate = (d) => {
    haptic.select();
    setPage(([idx]) => [idx + d, d]);
  };

  const pickSize = (id) => {
    if (id === size) return;
    haptic.medium();
    setSizes((s) => ({ ...s, [product.id]: id }));
  };

  const add = () => {
    haptic.success();
    setPop((p) => p + 1);
    onAdd(product.id, size, 1);
  };

  return (
    <section className="stage-wrap">
      <div className="stage">
        {/* soft halo + crumbs */}
        <motion.div className="stage-halo" animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }} />
        {CRUMBS.map(([x, y, r, c], k) => (
          <motion.span
            key={k}
            className="crumb"
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, width: r * 2, height: r * 2, background: c }}
            animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3 + (k % 4), delay: k * 0.2, ease: 'easeInOut' }}
          />
        ))}

        {/* neighbours peeking from the edges */}
        <motion.button
          key={`prev-${prev.id}`}
          className="neighbour left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => paginate(-1)}
          aria-label={L(prev.name)}
        >
          <Photo src={prev.image} alt="" size={180} className="round" />
        </motion.button>
        <motion.button
          key={`next-${next.id}`}
          className="neighbour right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => paginate(1)}
          aria-label={L(next.name)}
        >
          <Photo src={next.image} alt="" size={180} className="round" />
        </motion.button>

        {/* hairlines from ingredients to the pizza edge */}
        <svg className="stage-lines" viewBox="-200 -200 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <AnimatePresence>
            {ingr.map((g, k) => {
              const a = ANCHORS[k];
              const e = edgePoint(a, (PIZZA / 2) * scale + 6);
              const s = edgePoint(a, Math.hypot(a.x, a.y) - 24);
              return (
                <motion.line
                  key={`${product.id}-${g.key}-line`}
                  x1={e.x}
                  y1={e.y}
                  x2={s.x}
                  y2={s.y}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.35 + k * 0.08, duration: 0.5 }}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* the pizza */}
        <div className="stage-center">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={product.id}
              className="pizza-holder"
              custom={dir}
              variants={pizzaVariants}
              initial="enter"
              animate={pizzaVariants.center(scale)}
              exit="exit"
              transition={{ type: 'spring', damping: 20, stiffness: 140 }}
            >
              <motion.div
                className="pizza-drag"
                drag="x"
                dragSnapToOrigin
                dragElastic={0.35}
                style={{ x: dragX, rotate: dragRotate }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 || info.velocity.x < -500) paginate(1);
                  else if (info.offset.x > 60 || info.velocity.x > 500) paginate(-1);
                }}
                onTap={() => {
                  haptic.tap();
                  onDetails(product);
                }}
              >
                <div className="plate">
                  <Photo src={product.image} alt={L(product.name)} size={480} className="round spin" eager />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* the ingredient ballet */}
        <AnimatePresence>
          {ingr.map((g, k) => {
            const a = ANCHORS[k];
            return (
              <motion.div
                key={`${product.id}-${g.key}`}
                className={`ingredient ${a.align}`}
                style={{ left: `calc(50% + ${a.x}px)`, top: `calc(50% + ${a.y}px)` }}
                initial={{ x: -a.x * 0.8, y: -a.y * 0.8, scale: 0, opacity: 0, rotate: -40 }}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
                exit={{ x: -a.x * 0.6, y: -a.y * 0.6, scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 13, stiffness: 120, delay: 0.12 + k * 0.07 }}
              >
                <motion.span
                  className="ingredient-emoji"
                  animate={{ y: [0, -7, 0], rotate: [0, k % 2 ? 8 : -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.6 + k * 0.5, ease: 'easeInOut' }}
                >
                  {g.emoji}
                </motion.span>
                <span className="ingredient-label">{L(g.name)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div className="stage-counter">
          <b>{String(i + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}
          <span className="swipe-hint">← {t('swipeHint')} →</span>
        </div>
      </div>

      {/* arched info card */}
      <motion.div className="stage-card" layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${product.id}-${lang}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="stage-card-head"
          >
            <h2 className="serif">{L(product.name)}</h2>
            <div className="stars" aria-label={`${product.rating}`}>
              {'★★★★★'.split('').map((s, k) => (
                <span key={k} className={k < Math.round(product.rating) ? 'on' : ''}>
                  {s}
                </span>
              ))}
              <em>{product.rating.toFixed(1)}</em>
            </div>
            <p className="stage-meta">
              🔥 {product.kcal} {t('kcal')}
              {product.protein ? ` · 💪 ${product.protein} ${t('protein')}` : ''}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.div key={`${product.id}-${size}`} className="stage-price serif" initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {money(sizeObj.price)}
        </motion.div>

        <div className="size-dots" role="radiogroup">
          {product.sizes.map((s) => (
            <button key={s.id} role="radio" aria-checked={size === s.id} className={size === s.id ? 'active' : ''} onClick={() => pickSize(s.id)}>
              {size === s.id && <motion.span layoutId="size-dot" className="size-dot-bg" transition={{ type: 'spring', damping: 22, stiffness: 400 }} />}
              <b>{s.id}</b>
              <small>{s.cm} cm</small>
            </button>
          ))}
        </div>

        <button className="link-btn" onClick={() => (haptic.tap(), onDetails(product))}>
          {t('details')} →
        </button>

        <motion.button className="cart-fab" whileTap={{ scale: 0.85 }} onClick={add} aria-label={t('addToCart')}>
          <motion.span key={pop} initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 8 }}>
            🛍
          </motion.span>
          {inCart[product.id] > 0 && <span className="fab-badge">{inCart[product.id]}</span>}
        </motion.button>
      </motion.div>
    </section>
  );
}
