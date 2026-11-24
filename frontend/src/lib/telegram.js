import { useEffect, useRef } from 'react';

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
export const isTelegram = Boolean(tg?.initData);

const supports = (v) => {
  try {
    return Boolean(tg?.isVersionAtLeast?.(v));
  } catch {
    return false;
  }
};

const safe = (fn) => {
  try {
    fn();
  } catch {
    /* older clients / outside Telegram */
  }
};

/** Haptics on every meaningful interaction. No-ops outside Telegram. */
export const haptic = {
  tap: () => supports('6.1') && safe(() => tg.HapticFeedback.impactOccurred('light')),
  soft: () => supports('6.1') && safe(() => tg.HapticFeedback.impactOccurred('soft')),
  medium: () => supports('6.1') && safe(() => tg.HapticFeedback.impactOccurred('medium')),
  heavy: () => supports('6.1') && safe(() => tg.HapticFeedback.impactOccurred('heavy')),
  select: () => supports('6.1') && safe(() => tg.HapticFeedback.selectionChanged()),
  success: () => supports('6.1') && safe(() => tg.HapticFeedback.notificationOccurred('success')),
  warning: () => supports('6.1') && safe(() => tg.HapticFeedback.notificationOccurred('warning')),
  error: () => supports('6.1') && safe(() => tg.HapticFeedback.notificationOccurred('error')),
};

export function initTelegram() {
  if (!tg) return;
  safe(() => tg.ready());
  safe(() => tg.expand());
  if (supports('6.1')) {
    safe(() => tg.setHeaderColor('#FFF6F3'));
    safe(() => tg.setBackgroundColor('#FFF6F3'));
  }
  if (supports('7.10')) safe(() => tg.setBottomBarColor('#FFF6F3'));
  if (supports('7.7')) safe(() => tg.disableVerticalSwipes());
}

/** Shows Telegram's native back button while `handler` is set. */
export function useBackButton(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!tg?.BackButton || !supports('6.1') || !handler) return undefined;
    const cb = () => {
      haptic.tap();
      ref.current?.();
    };
    tg.BackButton.onClick(cb);
    tg.BackButton.show();
    return () => {
      tg.BackButton.offClick(cb);
      tg.BackButton.hide();
    };
  }, [Boolean(handler)]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Ask Telegram to share the user's phone. Resolves to true if shared. */
export function requestContact() {
  return new Promise((resolve) => {
    if (!tg?.requestContact || !supports('6.9')) return resolve(false);
    tg.requestContact((ok, res) => resolve(ok ? res?.responseUnsafe?.contact?.phone_number || true : false));
  });
}

/** Open a Telegram Payments invoice. Resolves with 'paid' | 'cancelled' | 'failed' | 'pending'. */
export function openInvoice(link) {
  return new Promise((resolve) => {
    if (!tg?.openInvoice || !supports('6.1')) {
      window.open(link, '_blank');
      return resolve('pending');
    }
    tg.openInvoice(link, (status) => resolve(status));
  });
}

export function openTelegramLink(link) {
  if (tg?.openTelegramLink && /^https:\/\/t\.me\//.test(link)) tg.openTelegramLink(link);
  else if (tg?.openLink) tg.openLink(link);
  else window.open(link, '_blank');
}

export function openSupport(username) {
  openTelegramLink(`https://t.me/${username}`);
}
