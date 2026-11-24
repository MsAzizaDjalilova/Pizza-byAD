'use strict';

const LANGS = ['uz', 'ru', 'en'];
const DEFAULT_LANG = 'uz';

/** Pick a supported language from a Telegram language_code or stored value. */
function resolveLang(code) {
  const c = String(code || '').slice(0, 2).toLowerCase();
  return LANGS.includes(c) ? c : DEFAULT_LANG;
}

/** Localise a {uz,ru,en} object (or pass plain strings through). */
function L(value, lang = DEFAULT_LANG) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value[DEFAULT_LANG] || value.en || '';
}

/** Bot & server-side texts. `{name}`-style placeholders are filled by tr(). */
const TEXTS = {
  welcome: {
    uz: "Salom, {name}! 💕\n\n<b>Blush Slice Pizza</b> — qizlar uchun pitsa atelyesi 🍕✨\n\n🌸 Estetik pitsalar, fit menyu va shirin desertlar\n🛵 35–45 daqiqada eshigingizgacha\n💖 Girls' night, self-care yoki shunchaki o'zingizni erkalash uchun\n\nPastdagi tugmani bosing 👇",
    ru: "Привет, {name}! 💕\n\n<b>Blush Slice Pizza</b> — пицца-ателье для девушек 🍕✨\n\n🌸 Эстетичная пицца, фит-меню и десерты\n🛵 Доставка за 35–45 минут\n💖 Для девичника, self-care вечера или просто чтобы побаловать себя\n\nНажми кнопку ниже 👇",
    en: "Hi, {name}! 💕\n\n<b>Blush Slice Pizza</b> — the pizza atelier for girls 🍕✨\n\n🌸 Aesthetic pizza, a fit menu and sweet treats\n🛵 At your door in 35–45 minutes\n💖 For girls' night, self-care or just treating yourself\n\nTap the button below 👇",
  },
  openMenu: { uz: '🍕 Menyuni ochish', ru: '🍕 Открыть меню', en: '🍕 Open the menu' },
  menuShort: { uz: '🍕 Menyu', ru: '🍕 Меню', en: '🍕 Menu' },
  myOrders: { uz: '📦 Buyurtmalarim', ru: '📦 Мои заказы', en: '📦 My orders' },
  support: { uz: '💌 Yordam', ru: '💌 Поддержка', en: '💌 Support' },
  supportLong: { uz: "💌 Qo'llab-quvvatlash", ru: '💌 Написать в поддержку', en: '💌 Contact support' },
  sharePhone: { uz: '📱 Raqamni ulashish', ru: '📱 Поделиться номером', en: '📱 Share my number' },
  ordersHint: { uz: 'Buyurtmalaringiz tarixi ilovada 📦', ru: 'История заказов — в приложении 📦', en: 'Your order history lives in the app 📦' },
  help: {
    uz: "Savolingiz bormi? Yordam xizmatimiz har kuni 10:00 – 02:00 ishlaydi 💌",
    ru: 'Есть вопрос? Поддержка работает ежедневно с 10:00 до 02:00 💌',
    en: 'Questions? Our support team is here daily, 10:00 – 02:00 💌',
  },
  phoneSaved: { uz: 'Rahmat! Raqamingiz saqlandi 💖', ru: 'Спасибо! Номер сохранён 💖', en: 'Thank you! Your number is saved 💖' },
  fallback: { uz: 'Buyurtma berish uchun menyuni oching 🍕', ru: 'Чтобы заказать, откройте меню 🍕', en: 'Open the menu to place an order 🍕' },
  chooseLang: { uz: 'Tilni tanlang 🌍', ru: 'Выберите язык 🌍', en: 'Choose your language 🌍' },
  langSaved: { uz: "Til o'zgartirildi ✅", ru: 'Язык изменён ✅', en: 'Language updated ✅' },
  paid: {
    uz: "💖 <b>To'lov qabul qilindi!</b>\n\nBuyurtma <b>#{id}</b> oshxonaga yuborildi. Pitsangiz sevgi bilan tayyorlanmoqda — taxminan 35–45 daqiqada yetib boradi 🛵\n\n{lines}\n\nJami: <b>{total}</b>",
    ru: '💖 <b>Оплата получена!</b>\n\nЗаказ <b>#{id}</b> уже на кухне. Готовим с любовью — доставим примерно за 35–45 минут 🛵\n\n{lines}\n\nИтого: <b>{total}</b>',
    en: '💖 <b>Payment received!</b>\n\nOrder <b>#{id}</b> is in the kitchen. Made with love — arriving in about 35–45 minutes 🛵\n\n{lines}\n\nTotal: <b>{total}</b>',
  },
  orderTitle: { uz: 'Buyurtma #{id}', ru: 'Заказ #{id}', en: 'Order #{id}' },
  delivery: { uz: 'Yetkazib berish', ru: 'Доставка', en: 'Delivery' },
  currency: { uz: "so'm", ru: 'сум', en: 'UZS' },
  // pre-checkout errors
  errNotFound: { uz: 'Buyurtma topilmadi', ru: 'Заказ не найден', en: 'Order not found' },
  errNotYours: { uz: 'Bu buyurtma sizga tegishli emas', ru: 'Это не ваш заказ', en: 'This order is not yours' },
  errNotPending: { uz: "Buyurtma allaqachon to'langan yoki bekor qilingan", ru: 'Заказ уже оплачен или отменён', en: 'This order is already paid or cancelled' },
  errPriceChanged: { uz: "Narx o'zgargan, qaytadan buyurtma bering", ru: 'Цена изменилась, оформите заказ заново', en: 'The price changed — please order again' },
  errTech: { uz: "Texnik xatolik, birozdan so'ng urinib ko'ring", ru: 'Техническая ошибка, попробуйте позже', en: 'Technical error, please try again shortly' },
};

function tr(key, lang, vars = {}) {
  const template = L(TEXTS[key], resolveLang(lang));
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

const money = (n, lang) =>
  `${Number(n).toLocaleString('ru-RU').replace(/ |,/g, ' ')} ${L(TEXTS.currency, resolveLang(lang))}`;

module.exports = { LANGS, DEFAULT_LANG, resolveLang, L, tr, money };
