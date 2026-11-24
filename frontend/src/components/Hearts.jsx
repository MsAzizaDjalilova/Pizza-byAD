import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EMOJIS = ['💖', '💕', '🌸', '✨', '💗'];

/** Burst of floating hearts. Change `trigger` (e.g. a counter) to fire a new burst. */
export default function Hearts({ trigger, count = 10 }) {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    if (!trigger) return undefined;
    const id = trigger;
    const hearts = Array.from({ length: count }, (_, i) => ({
      key: `${id}-${i}`,
      x: (Math.random() - 0.5) * 220,
      delay: Math.random() * 0.25,
      rotate: (Math.random() - 0.5) * 60,
      scale: 0.8 + Math.random() * 0.8,
      emoji: EMOJIS[i % EMOJIS.length],
    }));
    setBursts((b) => [...b, { id, hearts }]);
    const t = setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600);
    return () => clearTimeout(t);
  }, [trigger, count]);

  return (
    <div className="hearts-layer" aria-hidden="true">
      <AnimatePresence>
        {bursts.flatMap((b) =>
          b.hearts.map((h) => (
            <motion.span
              key={h.key}
              className="heart"
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], y: -260, x: h.x, scale: h.scale, rotate: h.rotate }}
              transition={{ duration: 1.3, delay: h.delay, ease: 'easeOut' }}
            >
              {h.emoji}
            </motion.span>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
