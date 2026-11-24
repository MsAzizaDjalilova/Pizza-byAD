import { motion } from 'framer-motion';
import { LANGS, useI18n } from '../i18n';
import { haptic } from '../lib/telegram';

export default function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-switch" role="radiogroup" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.id}
          role="radio"
          aria-checked={lang === l.id}
          className={lang === l.id ? 'active' : ''}
          onClick={() => {
            if (lang === l.id) return;
            haptic.select();
            setLang(l.id);
          }}
        >
          {lang === l.id && <motion.span layoutId="lang-pill" className="lang-pill" transition={{ type: 'spring', damping: 26, stiffness: 400 }} />}
          <span>{l.short}</span>
        </button>
      ))}
    </div>
  );
}
