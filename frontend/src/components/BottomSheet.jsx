import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { haptic } from '../lib/telegram';

/** Spring-loaded bottom sheet with drag-to-dismiss. */
export default function BottomSheet({ open, onClose, children }) {
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              haptic.soft();
              onClose();
            }}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) {
                haptic.soft();
                onClose();
              }
            }}
          >
            <div className="sheet-handle-zone" onPointerDown={(e) => controls.start(e)}>
              <div className="sheet-handle" />
            </div>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
