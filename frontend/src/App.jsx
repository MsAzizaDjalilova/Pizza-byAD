import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import Hearts from './components/Hearts';
import ProductSheet from './components/ProductSheet';
import Toast from './components/Toast';
import { I18nProvider, useI18n } from './i18n';
import { api } from './lib/api';
import { haptic, isTelegram } from './lib/telegram';
import Checkout from './screens/Checkout';
import Menu, { BrandMark } from './screens/Menu';
import Onboarding from './screens/Onboarding';
import Orders from './screens/Orders';
import Success from './screens/Success';
import { CartProvider, useCart } from './store/cart';

const pageMotion = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { type: 'spring', damping: 28, stiffness: 260 },
};

function Splash() {
  return (
    <div className="splash">
      <motion.div className="splash-slice" animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        🍕
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <BrandMark />
      </motion.div>
    </div>
  );
}

function BackgroundBlobs() {
  return (
    <div className="bg-blobs" aria-hidden="true">
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
    </div>
  );
}

function Shell({ catalog, session, setSession }) {
  const { t, L } = useI18n();
  const initial = window.location.hash === '#/orders' ? 'orders' : 'menu';
  const [screen, setScreen] = useState(session.user.hasSeenOnboarding ? initial : 'onboarding');
  const [sheetProduct, setSheetProduct] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [burst, setBurst] = useState(0);
  const toastTimer = useRef();
  const { add, clear } = useCart();

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const finishOnboarding = () => {
    setScreen('menu');
    setSession((s) => ({ ...s, user: { ...s.user, hasSeenOnboarding: true } }));
    api.completeOnboarding().catch(() => {});
  };

  const addAndCelebrate = (productId, size, qty) => {
    add(productId, size, qty);
    setBurst((b) => b + 1);
    const p = catalog.products.find((x) => x.id === productId);
    if (p) toast(t('added', { name: L(p.name) }));
  };

  const goMenu = useCallback(() => setScreen('menu'), []);

  let page;
  switch (screen) {
    case 'onboarding':
      page = <Onboarding name={session.user.firstName} catalog={catalog} onDone={finishOnboarding} />;
      break;
    case 'checkout':
      page = (
        <Checkout
          catalog={catalog}
          session={session}
          toast={toast}
          onBack={goMenu}
          onPaid={(order) => {
            clear();
            setLastOrder(order);
            setScreen('success');
          }}
          onPending={(order) => {
            setLastOrder({ ...order, awaiting: true });
            setScreen('success');
          }}
        />
      );
      break;
    case 'success':
      page = <Success order={lastOrder} onMenu={goMenu} onOrders={() => setScreen('orders')} onConfirmed={clear} />;
      break;
    case 'orders':
      page = (
        <Orders
          session={session}
          onBack={goMenu}
          onReorder={() => {
            toast(t('addedToBag'));
            setScreen('checkout');
          }}
        />
      );
      break;
    default:
      page = (
        <Menu
          catalog={catalog}
          session={session}
          onOpenProduct={setSheetProduct}
          onQuickAdd={(p) => addAndCelebrate(p.id, null, 1)}
          onAddFromStage={addAndCelebrate}
          onCheckout={() => setScreen('checkout')}
          onOrders={() => setScreen('orders')}
        />
      );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.main key={screen} {...pageMotion}>
          {page}
        </motion.main>
      </AnimatePresence>
      <ProductSheet
        product={sheetProduct}
        ingredients={catalog.ingredients}
        badges={catalog.badges}
        onClose={() => setSheetProduct(null)}
        onAdd={(id, size, qty) => {
          setSheetProduct(null);
          addAndCelebrate(id, size, qty);
        }}
      />
      <Hearts trigger={burst} count={8} />
      <Toast message={toastMsg} />
    </>
  );
}

function Loader() {
  const { t, setLang, errorText } = useI18n();
  const [catalog, setCatalog] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([api.catalog(), api.session()])
      .then(([c, s]) => {
        setCatalog(c);
        setSession(s);
        let saved = null;
        try {
          saved = localStorage.getItem('blush-slice-lang');
        } catch {
          /* ignore */
        }
        if (!saved && s.user?.language) setLang(s.user.language);
      })
      .catch((e) => {
        haptic.error();
        setError(e);
      });
  }, [setLang]);

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    const notInTelegram = error.status === 401 && !isTelegram;
    return (
      <div className="screen empty">
        <div className="empty-emoji">{notInTelegram ? '📱' : '🥺'}</div>
        <h2 className="serif">{notInTelegram ? t('openInTelegram') : t('cantConnect')}</h2>
        <p>{notInTelegram ? t('openInTelegramText') : errorText(error)}</p>
        {!notInTelegram && (
          <button className="btn primary" onClick={() => (haptic.tap(), load())}>
            {t('retry')}
          </button>
        )}
      </div>
    );
  }

  if (!catalog || !session) return <Splash />;

  return (
    <CartProvider catalog={catalog}>
      <Shell catalog={catalog} session={session} setSession={setSession} />
    </CartProvider>
  );
}

const saveLanguage = (l) => api.setLanguage(l).catch(() => {});

export default function App() {
  return (
    <I18nProvider onChange={saveLanguage}>
      <BackgroundBlobs />
      <Loader />
    </I18nProvider>
  );
}
