import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const LANGS = [
  { id: 'uz', short: 'UZ', label: "O'zbekcha", flag: '🇺🇿' },
  { id: 'ru', short: 'RU', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', short: 'EN', label: 'English', flag: '🇬🇧' },
];

const D = {
  brandTag: ['qizlar uchun pitsa atelyesi', 'пицца-ателье для девушек', 'pizza atelier for girls'],
  hello: ['Salom, {name} 💕', 'Привет, {name} 💕', 'Hi, {name} 💕'],
  cravingA: ['Bugun nimani', 'Чего хочется', 'What are you'],
  cravingB: ['xohlaysiz?', 'сегодня?', 'craving?'],
  marquee: [
    ['faqat qizlar uchun', '35 daqiqada yetkazish', "150 000 so'mdan bepul", 'sevgi bilan pishiriladi', 'fit menyu'],
    ['только для девушек', 'доставка за 35 минут', 'бесплатно от 150 000 сум', 'готовим с любовью', 'фит-меню'],
    ['girls only', '35-min delivery', 'free over 150k UZS', 'baked with love', 'fit menu'],
  ],
  socialProof: ['Bugun {n} ta qiz buyurtma berdi', 'Сегодня заказали {n} девушек', '{n} girls ordered today'],
  priceFrom: ['{p} dan', 'от {p}', 'from {p}'],
  addToCart: ['Savatga', 'В корзину', 'Add to bag'],
  details: ['Tarkibi', 'Состав', 'Ingredients'],
  fullMenu: ['Butun menyu', 'Всё меню', 'The full menu'],
  swipeHint: ['Suring', 'Листайте', 'Swipe'],
  kcal: ['kkal', 'ккал', 'kcal'],
  protein: ['g oqsil', 'г белка', 'g protein'],
  fitNote: [
    "Kam kaloriya, ko'p oqsil — vijdon azobisiz pitsa 🌿",
    'Меньше калорий, больше белка — пицца без чувства вины 🌿',
    'Fewer calories, more protein — guilt-free pizza 🌿',
  ],
  ingredientsOf: ['Ingredientlar baleti', 'Балет ингредиентов', 'The ingredient ballet'],
  goCart: ["Savatga o'tish", 'Корзина', 'View bag'],
  freeLeft: ['Bepul yetkazishgacha {p}', 'До бесплатной доставки {p}', '{p} to free delivery'],
  freeYes: ['Yetkazib berish bepul! 🎉', 'Доставка бесплатно! 🎉', 'Free delivery unlocked! 🎉'],
  added: ['{name} savatda 💖', '{name} в корзине 💖', '{name} is in your bag 💖'],
  cartTitle: ['Savatingiz', 'Корзина', 'Your bag'],
  emptyCart: ["Savatingiz bo'sh", 'Корзина пуста', 'Your bag is empty'],
  emptyCartText: ["Keling, uni mazali narsalar bilan to'ldiramiz 💕", 'Давайте наполним её вкусностями 💕', "Let's fill it with something delicious 💕"],
  backToMenu: ['Menyuga qaytish', 'Вернуться в меню', 'Back to menu'],
  nudgeMore: ['Yana {p} — va yetkazib berish bepul 🛵', 'Ещё {p} — и доставка бесплатно 🛵', '{p} more for free delivery 🛵'],
  pairsWell: ['Bunga juda mos keladi 💕', 'Идеально дополнит 💕', 'Pairs perfectly 💕'],
  specialOffer: ['Maxsus taklif', 'Спецпредложение', 'Special offer'],
  deliveryTitle: ['Yetkazib berish', 'Доставка', 'Delivery'],
  phone: ['Telefon raqam', 'Телефон', 'Phone'],
  share: ['Ulashish', 'Поделиться', 'Share'],
  address: ['Manzil', 'Адрес', 'Address'],
  addressPh: ["Ko'cha, uy, xonadon, mo'ljal", 'Улица, дом, квартира, ориентир', 'Street, building, flat, landmark'],
  comment: ['Izoh (ixtiyoriy)', 'Комментарий (необязательно)', 'Note (optional)'],
  commentPh: ["Masalan: domofon 24, qo'ng'iroq qilmang 🤫", 'Например: домофон 24, не звонить 🤫', 'e.g. buzzer 24, please don’t call 🤫'],
  payment: ["To'lov usuli", 'Способ оплаты', 'Payment'],
  starsHint: ["Summa Telegram Stars'ga avtomatik hisoblanadi ⭐️", 'Сумма автоматически пересчитается в Telegram Stars ⭐️', 'The total is converted to Telegram Stars automatically ⭐️'],
  cryptoHint: ["@CryptoBot orqali USDT yoki TON bilan to'lang 🪙", 'Оплата USDT или TON через @CryptoBot 🪙', 'Pay with USDT or TON via @CryptoBot 🪙'],
  items: ['Mahsulotlar', 'Товары', 'Items'],
  deliveryFee: ['Yetkazib berish', 'Доставка', 'Delivery'],
  free: ['Bepul', 'Бесплатно', 'Free'],
  total: ['Jami', 'Итого', 'Total'],
  trust: [
    "🔒 Xavfsiz to'lov · 🛵 35–45 daqiqa · 💖 Sevgi bilan",
    '🔒 Безопасная оплата · 🛵 35–45 минут · 💖 С любовью',
    '🔒 Secure payment · 🛵 35–45 min · 💖 Made with love',
  ],
  pay: ["To'lash · {p}", 'Оплатить · {p}', 'Pay · {p}'],
  fillForm: ["Telefon va manzilni to'ldiring 🌸", 'Заполните телефон и адрес 🌸', 'Please add your phone and address 🌸'],
  chooseMethod: ["To'lov usulini tanlang", 'Выберите способ оплаты', 'Choose a payment method'],
  payCancelled: ["To'lov bekor qilindi — savatingiz saqlandi 💕", 'Оплата отменена — корзина сохранена 💕', 'Payment cancelled — your bag is saved 💕'],
  payFailed: ["To'lov amalga oshmadi. Boshqa usulni sinab ko'ring", 'Оплата не прошла. Попробуйте другой способ', "Payment didn't go through. Try another method"],
  phoneSaved: ['Rahmat! Raqam saqlandi 💖', 'Спасибо! Номер сохранён 💖', 'Thanks! Number saved 💖'],
  successTitle: ['Buyurtmangiz qabul qilindi!', 'Заказ принят!', 'Your order is in!'],
  successText: [
    'Buyurtma #{id} oshxonaga yuborildi. Pitsangiz sevgi bilan tayyorlanmoqda va taxminan 35–45 daqiqada yetib boradi 🛵',
    'Заказ #{id} уже на кухне. Готовим с любовью — доставим примерно за 35–45 минут 🛵',
    'Order #{id} is in the kitchen. Baked with love — arriving in about 35–45 minutes 🛵',
  ],
  successNote: ["Holati haqida Telegram'da xabar beramiz 💌", 'Сообщим о статусе в Telegram 💌', "We'll update you in Telegram 💌"],
  waitingTitle: ["To'lovni kutyapmiz…", 'Ждём оплату…', 'Waiting for payment…'],
  waitingText: [
    "Buyurtma #{id} · {p}. To'lovni yakunlang — tasdiqlanishi bilan shu yerda ko'rasiz ✨",
    'Заказ #{id} · {p}. Завершите оплату — подтверждение появится здесь ✨',
    "Order #{id} · {p}. Finish paying — you'll see the confirmation here ✨",
  ],
  myOrders: ['Buyurtmalarim', 'Мои заказы', 'My orders'],
  noOrders: ["Hali buyurtmalar yo'q", 'Заказов пока нет', 'No orders yet'],
  noOrdersText: ['Birinchi pitsangiz sizni kutmoqda 💕', 'Ваша первая пицца уже ждёт 💕', 'Your first pizza is waiting 💕'],
  openMenu: ['Menyuni ochish', 'Открыть меню', 'Open the menu'],
  reorder: ['Yana buyurtma berish', 'Повторить заказ', 'Order again'],
  addedToBag: ["Savatga qo'shildi 💖", 'Добавлено в корзину 💖', 'Added to your bag 💖'],
  supportLink: ['Savol bormi? Yordamga yozing', 'Есть вопрос? Напишите нам', 'Questions? Message us'],
  openInTelegram: ['Telegram orqali oching', 'Откройте в Telegram', 'Open in Telegram'],
  openInTelegramText: [
    "Blush Slice faqat Telegram ichida ishlaydi. Botga o'ting va «Menu» tugmasini bosing.",
    'Blush Slice работает только внутри Telegram. Откройте бота и нажмите «Menu».',
    'Blush Slice works inside Telegram. Open the bot and tap “Menu”.',
  ],
  cantConnect: ["Ulanib bo'lmadi", 'Не удалось подключиться', "Couldn't connect"],
  retry: ['Qayta urinish', 'Повторить', 'Try again'],
  skip: ["O'tkazib yuborish", 'Пропустить', 'Skip'],
  next: ['Davom etish', 'Далее', 'Next'],
  start: ["Menyuni ko'rish 🍕", 'Смотреть меню 🍕', 'See the menu 🍕'],
  chooseLang: ['Tilni tanlang', 'Выберите язык', 'Choose your language'],
  ob1Title: ['Pitsa, lekin pushti', 'Пицца, но розовая', 'Pizza, but make it pink'],
  ob1Text: [
    'Blush Slice — qizlar uchun yaratilgan pitsa atelyesi. Estetik, mazali va har bir bo‘lakda mehr.',
    'Blush Slice — пицца-ателье, созданное для девушек. Эстетично, вкусно и с любовью в каждом кусочке.',
    'Blush Slice is a pizza atelier made for girls. Aesthetic, delicious and love in every slice.',
  ],
  ob2Kicker: ["Girls' night in", 'Девичник дома', "Girls' night in"],
  ob2Title: ['Kino, dugonalar va issiq pitsa', 'Кино, подружки и горячая пицца', 'Films, besties & hot pizza'],
  ob2Text: [
    'To‘plamlarimiz 3–4 dugona uchun mo‘ljallangan — 35–45 daqiqada eshigingizda.',
    'Наборы рассчитаны на 3–4 подружки — у двери через 35–45 минут.',
    'Our boxes feed 3–4 besties — at your door in 35–45 minutes.',
  ],
  ob3Kicker: ['Fit & shirin', 'Фит & сладкое', 'Fit & sweet'],
  ob3Title: ['Vijdon azobisiz huzur', 'Удовольствие без чувства вины', 'Guilt-free pleasure'],
  ob3Text: [
    "Fit pitsalar, desertlar va trend ichimliklar. 150 000 so'mdan yetkazish bepul!",
    'Фит-пиццы, десерты и трендовые напитки. Доставка бесплатно от 150 000 сум!',
    'Fit pizzas, desserts and trending drinks. Free delivery over 150 000 UZS!',
  ],
  status_pending: ["To'lov kutilmoqda", 'Ожидает оплаты', 'Awaiting payment'],
  status_paid: ['Qabul qilindi', 'Принят', 'Confirmed'],
  status_cooking: ['Tayyorlanmoqda 👩‍🍳', 'Готовится 👩‍🍳', 'Baking 👩‍🍳'],
  status_delivering: ["Yo'lda 🛵", 'В пути 🛵', 'On the way 🛵'],
  status_delivered: ['Yetkazildi 💖', 'Доставлен 💖', 'Delivered 💖'],
  status_cancelled: ['Bekor qilindi', 'Отменён', 'Cancelled'],
  status_failed: ['Xatolik', 'Ошибка', 'Failed'],
  err_NETWORK: ['Internet aloqasini tekshiring', 'Проверьте подключение к интернету', 'Check your internet connection'],
  err_INVALID_PHONE: ['Telefon raqamni +998 XX XXX XX XX formatida kiriting', 'Введите номер в формате +998 XX XXX XX XX', 'Enter your phone as +998 XX XXX XX XX'],
  err_INVALID_ADDRESS: ['Yetkazib berish manzilini kiriting', 'Укажите адрес доставки', 'Please enter a delivery address'],
  err_INVALID_PAYMENT_METHOD: ["To'lov usulini tanlang", 'Выберите способ оплаты', 'Choose a payment method'],
  err_INVOICE_FAILED: ["To'lovni yaratib bo'lmadi. Boshqa usulni sinab ko'ring", 'Не удалось создать платёж. Попробуйте другой способ', "Couldn't start the payment. Try another method"],
  err_UNKNOWN_PRODUCT: ["Menyu yangilandi — savatni tekshiring", 'Меню обновилось — проверьте корзину', 'The menu changed — please check your bag'],
  err_default: ["Nimadir xato ketdi. Qayta urinib ko'ring", 'Что-то пошло не так. Попробуйте ещё раз', 'Something went wrong. Please try again'],
  currency: ["so'm", 'сум', 'UZS'],
};

const IDX = { uz: 0, ru: 1, en: 2 };
const STORAGE_KEY = 'blush-slice-lang';

export function detectLang(fallback) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && IDX[saved] !== undefined) return saved;
  } catch {
    /* storage unavailable */
  }
  const tgCode = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.slice(0, 2);
  const code = fallback || tgCode;
  return IDX[code] !== undefined ? code : 'uz';
}

const I18nContext = createContext(null);

export function I18nProvider({ initial, onChange, children }) {
  const [lang, setLangState] = useState(() => detectLang(initial));

  const setLang = useCallback(
    (l) => {
      if (IDX[l] === undefined) return;
      setLangState(l);
      document.documentElement.lang = l;
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* ignore */
      }
      onChange?.(l);
    },
    [onChange]
  );

  const value = useMemo(() => {
    const i = IDX[lang];
    const t = (key, vars) => {
      const entry = D[key];
      if (!entry) return key;
      const s = entry[i] ?? entry[0];
      if (!vars || typeof s !== 'string') return s;
      return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
    };
    /** Localize a catalog value: {uz,ru,en} object or plain string. */
    const L = (v) => (v == null ? '' : typeof v === 'string' ? v : v[lang] || v.uz || v.en || '');
    const money = (n) => {
      const num = Math.round(Number(n) || 0)
        .toLocaleString('ru-RU')
        .replace(/ |,/g, ' ');
      return `${num} ${D.currency[i]}`;
    };
    const errorText = (err) => (err?.code && D[`err_${err.code}`] ? t(`err_${err.code}`) : t('err_default'));
    return { lang, setLang, t, L, money, errorText };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
