import { AnimatePresence, motion } from 'framer-motion';

export default function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast"
          initial={{ y: -40, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: -40, opacity: 0, x: '-50%' }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
