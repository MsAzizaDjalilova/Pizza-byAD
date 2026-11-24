import { useI18n } from '../i18n';

/** Endless editorial ticker strip. */
export default function Marquee() {
  const { t } = useI18n();
  const items = t('marquee');
  const row = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div className="marquee-group" key={k}>
            {row.map((text, i) => (
              <span key={i}>
                {text} <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
