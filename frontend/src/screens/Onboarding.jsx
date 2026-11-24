import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import Photo from '../components/Photo';
import { LANGS, useI18n } from '../i18n';
import { haptic } from '../lib/telegram';
import { BrandMark } from './Menu';

const FLOATERS = [
  ['🍓', -120, -110],
  ['🌿', 120, -90],
  ['🧀', -130, 90],
  ['🍅', 125, 100],
  ['✨', 0, -150],
];

export default function Onboarding({ name, catalog, onDone }) {
  const { t, lang, setLang } = useI18n();
  const [i, setI] = useState(0);
  const pick = (id) => catalog.products.find((p) => p.id === id)?.image;

  const slides = [
    { kind: 'lang', image: pick('pepperoni-crush'), round: true },
    { kicker: t('ob2Kicker'), title: t('ob2Title'), text: t('ob2Text'), image: pick('girls-night-box') },
    { kicker: t('ob3Kicker'), title: t('ob3Title'), text: t('ob3Text'), image: pick('heart-tart') },
  ];
  const last = i === slides.length - 1;
  const slide = slides[i];

  const next = () => {
    if (last) {
      haptic.success();
      onDone();
    } else {
      haptic.tap();
      setI(i + 1);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-top">
        <BrandMark small />
        <button className="skip" onClick={() => (haptic.soft(), onDone())}>
          {t('skip')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          className="onboarding-slide"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) next();
            else if (info.offset.x > 60 && i > 0) {
              haptic.tap();
              setI(i - 1);
            }
          }}
        >
          <div className="ob-visual">
            <motion.div
              className="ob-photo-wrap"
              initial={{ scale: 0.6, rotate: slide.round ? -120 : -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 120 }}
            >
              <Photo src={slide.image} alt="" size={520} className={slide.round ? 'round spin' : 'arch'} eager />
            </motion.div>
            {FLOATERS.map(([e, x, y], k) => (
              <motion.span
                key={k}
                className="ob-floater"
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
                transition={{ scale: { delay: 0.2 + k * 0.08, type: 'spring' }, y: { repeat: Infinity, duration: 2.5 + k * 0.4 } }}
              >
                {e}
              </motion.span>
            ))}
          </div>

          {slide.kind === 'lang' ? (
            <>
              <span className="kicker">{name ? `${name}, ${t('chooseLang').toLowerCase()}` : t('chooseLang')}</span>
              <h1 className="serif display">{t('ob1Title')}</h1>
              <p>{t('ob1Text')}</p>
              <div className="lang-cards">
                {LANGS.map((l) => (
                  <motion.button
                    key={l.id}
                    whileTap={{ scale: 0.94 }}
                    className={lang === l.id ? 'lang-card active' : 'lang-card'}
                    onClick={() => {
                      haptic.select();
                      setLang(l.id);
                    }}
                  >
                    <span className="flag">{l.flag}</span>
                    {l.label}
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <>
              <span className="kicker">{slide.kicker}</span>
              <h1 className="serif display">{slide.title}</h1>
              <p>{slide.text}</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="onboarding-foot">
        <div className="dots">
          {slides.map((_, d) => (
            <motion.span key={d} animate={{ width: d === i ? 26 : 8, opacity: d === i ? 1 : 0.3 }} />
          ))}
        </div>
        <motion.button className="btn primary block" whileTap={{ scale: 0.96 }} onClick={next}>
          {last ? t('start') : t('next')}
        </motion.button>
      </div>
    </div>
  );
}
