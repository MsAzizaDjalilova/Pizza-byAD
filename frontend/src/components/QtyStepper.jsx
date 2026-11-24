import { motion } from 'framer-motion';
import { haptic } from '../lib/telegram';

export default function QtyStepper({ value, onChange, min = 0, max = 20, small = false }) {
  const change = (d) => {
    const next = Math.max(min, Math.min(max, value + d));
    if (next === value) return haptic.warning();
    haptic.select();
    onChange(next);
  };
  return (
    <div className={small ? 'stepper small' : 'stepper'}>
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => change(-1)} aria-label="Kamaytirish">
        −
      </motion.button>
      <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {value}
      </motion.span>
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => change(1)} aria-label="Ko'paytirish">
        +
      </motion.button>
    </div>
  );
}
