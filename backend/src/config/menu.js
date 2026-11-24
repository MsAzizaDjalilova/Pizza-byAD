'use strict';

/**
 * Blush Slice Pizza — menu data (uz / ru / en).
 * Prices are in UZS and are the single source of truth (the Mini App never sends prices).
 * Photos: Unsplash (free licence). Swap `photo()` ids for your own shots any time.
 */

const photo = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=72`;

/**
 * Whole round pizza, cropped so the pie fills the circle exactly.
 * x/y = pizza centre (0–1 of the photo), z = zoom so the crust touches the circle edge.
 * `extra` can flip/rotate a photo so one shot can serve two different pizzas.
 */
const pizzaPhoto = (id, x, y, z, extra = '') =>
  `${photo(id)}&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${z}${extra ? `&${extra}` : ''}`;
const t = (uz, ru, en) => ({ uz, ru, en });

/* ───────── Ingredients (shown floating around the pizza) ───────── */
const INGREDIENTS = {
  tomato: { emoji: '🍅', name: t('Pomidor', 'Томаты', 'Tomato') },
  cherry: { emoji: '🍅', name: t('Gilos pomidor', 'Черри', 'Cherry tomato') },
  mozzarella: { emoji: '🧀', name: t('Motsarella', 'Моцарелла', 'Mozzarella') },
  burrata: { emoji: '🤍', name: t('Burrata', 'Буррата', 'Burrata') },
  parmesan: { emoji: '🧀', name: t('Parmezan', 'Пармезан', 'Parmesan') },
  ricotta: { emoji: '☁️', name: t('Rikotta', 'Рикотта', 'Ricotta') },
  gorgonzola: { emoji: '🧀', name: t('Gorgonzola', 'Горгонзола', 'Gorgonzola') },
  goat: { emoji: '🐐', name: t("Echki pishlog'i", 'Козий сыр', 'Goat cheese') },
  basil: { emoji: '🌿', name: t('Rayhon', 'Базилик', 'Basil') },
  pesto: { emoji: '🌿', name: t('Pesto', 'Песто', 'Pesto') },
  arugula: { emoji: '🥬', name: t('Rukkola', 'Руккола', 'Arugula') },
  spinach: { emoji: '🥬', name: t('Ismaloq', 'Шпинат', 'Spinach') },
  olive: { emoji: '🫒', name: t('Zaytun', 'Оливки', 'Olives') },
  oliveoil: { emoji: '💧', name: t('Zaytun moyi', 'Оливковое масло', 'Olive oil') },
  pepperoni: { emoji: '🔴', name: t('Pepperoni', 'Пепперони', 'Pepperoni') },
  chili: { emoji: '🌶️', name: t('Achchiq qalampir', 'Чили', 'Chili') },
  honey: { emoji: '🍯', name: t('Asal', 'Мёд', 'Honey') },
  mushroom: { emoji: '🍄', name: t("Qo'ziqorin", 'Грибы', 'Mushrooms') },
  truffle: { emoji: '🖤', name: t('Trufel', 'Трюфель', 'Truffle') },
  pepper: { emoji: '🫑', name: t('Bolgar qalampiri', 'Перец', 'Bell pepper') },
  corn: { emoji: '🌽', name: t("Makkajo'xori", 'Кукуруза', 'Corn') },
  onion: { emoji: '🧅', name: t('Piyoz', 'Лук', 'Onion') },
  garlic: { emoji: '🧄', name: t('Sarimsoq', 'Чеснок', 'Garlic') },
  lemon: { emoji: '🍋', name: t('Limon', 'Лимон', 'Lemon') },
  chicken: { emoji: '🍗', name: t('Tovuq', 'Курица', 'Chicken') },
  shrimp: { emoji: '🦐', name: t('Krevetka', 'Креветки', 'Shrimp') },
  prosciutto: { emoji: '🥓', name: t('Proshutto', 'Прошутто', 'Prosciutto') },
  walnut: { emoji: '🌰', name: t("Yong'oq", 'Грецкий орех', 'Walnut') },
  fig: { emoji: '🟣', name: t('Anjir', 'Инжир', 'Fig') },
  bbq: { emoji: '🔥', name: t('BBQ sousi', 'Соус BBQ', 'BBQ sauce') },
  avocado: { emoji: '🥑', name: t('Avokado', 'Авокадо', 'Avocado') },
  strawberry: { emoji: '🍓', name: t('Qulupnay', 'Клубника', 'Strawberry') },
  egg: { emoji: '🥚', name: t('Tuxum', 'Яйцо', 'Egg') },
};

const CATEGORIES = [
  { id: 'pizza', emoji: '🍕', title: t('Pitsa', 'Пицца', 'Pizza') },
  { id: 'fit', emoji: '🌿', title: t('Fit pitsa', 'Фит пицца', 'Fit pizza') },
  { id: 'combo', emoji: '🎀', title: t("To'plamlar", 'Наборы', 'Boxes') },
  { id: 'snacks', emoji: '🥗', title: t('Salat & gazak', 'Салаты & закуски', 'Salads & bites') },
  { id: 'desserts', emoji: '🧁', title: t('Desertlar', 'Десерты', 'Desserts') },
  { id: 'drinks', emoji: '🧋', title: t('Ichimliklar', 'Напитки', 'Drinks') },
];

const SIZE_DEFS = [
  { id: 'S', cm: 25, multiplier: 0.78, label: t('Kichik', 'Маленькая', 'Small') },
  { id: 'M', cm: 30, multiplier: 1, label: t("O'rta", 'Средняя', 'Medium') },
  { id: 'L', cm: 35, multiplier: 1.28, label: t('Katta', 'Большая', 'Large') },
];
const round1000 = (n) => Math.round(n / 1000) * 1000;

const BADGES = {
  hit: t('Xit', 'Хит', 'Bestseller'),
  new: t('Yangi', 'Новинка', 'New'),
  premium: t('Premium', 'Премиум', 'Premium'),
  fit: t('Fit', 'Fit', 'Fit'),
  trend: t('Trend', 'Тренд', 'Trending'),
  save: t('Tejamkor', 'Выгодно', 'Best value'),
  spicy: t('Achchiq', 'Острая', 'Spicy'),
};

const pizza = (p) => ({
  category: 'pizza',
  ...p,
  sizes: SIZE_DEFS.map((s) => ({ id: s.id, cm: s.cm, label: s.label, price: round1000(p.basePrice * s.multiplier) })),
});

const PRODUCTS = [
  /* ───────────── PIZZA ───────────── */
  pizza({
    id: 'blush-margherita',
    name: 'Blush Margherita',
    image: pizzaPhoto('1574071318508-1cdbab80d002', 0.5, 0.55, 1.05),
    basePrice: 79000,
    badge: 'hit',
    rating: 4.9,
    kcal: 680,
    ingredients: ['tomato', 'mozzarella', 'basil', 'oliveoil'],
    desc: t(
      "Klassika, lekin nafisroq: shirin pomidor sousi, yangi motsarella, rayhon va bir tomchi zaytun moyi.",
      'Классика, но изящнее: сладкий томатный соус, свежая моцарелла, базилик и капля оливкового масла.',
      'A classic, only prettier: sweet tomato sauce, fresh mozzarella, basil and a drizzle of olive oil.'
    ),
  }),
  pizza({
    id: 'pepperoni-crush',
    name: 'Pepperoni Crush',
    image: pizzaPhoto('1628840042765-356cda07504e', 0.5, 0.5, 1.05),
    basePrice: 89000,
    badge: 'hit',
    rating: 4.9,
    kcal: 820,
    ingredients: ['pepperoni', 'mozzarella', 'honey', 'chili'],
    desc: t(
      "Ikki qavat motsarella, qarsildoq pepperoni va achchiq-shirin asal tomchilari. Birinchi tishlashdayoq sevib qolasiz.",
      'Двойная моцарелла, хрустящая пепперони и капли острого мёда. Любовь с первого укуса.',
      'Double mozzarella, crispy pepperoni and hot-honey drizzle. Love at first bite.'
    ),
  }),
  pizza({
    id: 'burrata-bloom',
    name: 'Burrata Bloom',
    image: pizzaPhoto('1595854341625-f33ee10dbf94', 0.35, 0.47, 1.28),
    basePrice: 99000,
    badge: 'new',
    rating: 5.0,
    kcal: 720,
    ingredients: ['burrata', 'cherry', 'pesto', 'oliveoil'],
    desc: t(
      'Butun burrata gul kabi ochiladi: gilos pomidorlar, uy pestosi va zaytun moyi. Yumshoq va kremli.',
      'Целая буррата раскрывается как цветок: черри, домашнее песто и оливковое масло.',
      'A whole burrata blooming on top: cherry tomatoes, house pesto and olive oil.'
    ),
  }),
  pizza({
    id: 'truffle-kiss',
    name: 'Truffle Kiss',
    image: pizzaPhoto('1604917877934-07d8d248d396', 0.5, 0.5, 1.1),
    basePrice: 119000,
    badge: 'premium',
    rating: 5.0,
    kcal: 760,
    ingredients: ['truffle', 'mushroom', 'parmesan', 'arugula'],
    desc: t(
      "Trufel kremi, o'rmon qo'ziqorinlari, parmezan va rukkola. Hashamatli oqshom uchun.",
      'Трюфельный крем, лесные грибы, пармезан и руккола. Для роскошного вечера.',
      'Truffle cream, wild mushrooms, parmesan and arugula. For a luxe night in.'
    ),
  }),
  pizza({
    id: 'green-goddess',
    category: 'fit',
    name: 'Green Goddess',
    image: pizzaPhoto('1593560708920-61dd98c46a4e', 0.5, 0.52, 1),
    basePrice: 85000,
    badge: 'fit',
    rating: 4.8,
    kcal: 520,
    protein: 26,
    ingredients: ['spinach', 'ricotta', 'garlic', 'lemon'],
    desc: t(
      "Ismaloq, rikotta, sarimsoq va limon qobig'i. Yengil, yashil va juda mazali.",
      'Шпинат, рикотта, чеснок и цедра лимона. Лёгкая, зелёная и очень вкусная.',
      'Spinach, ricotta, garlic and lemon zest. Light, green and so good.'
    ),
  }),
  pizza({
    id: 'veggie-glow',
    category: 'fit',
    name: 'Veggie Glow',
    image: pizzaPhoto('1604382354936-07c5d9983bd3', 0.485, 0.5, 1.6),
    basePrice: 79000,
    badge: 'fit',
    rating: 4.7,
    kcal: 490,
    protein: 18,
    ingredients: ['pepper', 'corn', 'olive', 'tomato'],
    desc: t(
      "Rang-barang sabzavotlar, zaytun va yupqa xamir. Kaloriyasi 30% kam.",
      'Яркие овощи, оливки и тонкое тесто. На 30% меньше калорий.',
      'Rainbow veggies, olives and a thin crust. 30% fewer calories.'
    ),
  }),
  pizza({
    id: 'quattro-rose',
    name: 'Quattro Rosé',
    image: pizzaPhoto('1506354666786-959d6d497f1a', 0.38, 0.5, 1),
    basePrice: 95000,
    rating: 4.9,
    kcal: 790,
    ingredients: ['mozzarella', 'gorgonzola', 'parmesan', 'honey'],
    desc: t(
      "To'rt xil pishloq va asal. Pishloqsevarlar uchun eng yaxshi tanlov.",
      'Четыре сыра и мёд. Лучший выбор для сыроманок.',
      'Four cheeses and honey. A cheese lover’s dream.'
    ),
  }),
  pizza({
    id: 'fig-honey',
    name: 'Fig & Honey',
    image: pizzaPhoto('1627461985459-51600559fffe', 0.62, 0.5, 1.7),
    basePrice: 105000,
    badge: 'premium',
    rating: 4.8,
    kcal: 700,
    ingredients: ['fig', 'goat', 'honey', 'walnut'],
    desc: t(
      "Anjir, echki pishlog'i, tog' asali va yong'oq. Shirin va tuzli uyg'unlik.",
      'Инжир, козий сыр, горный мёд и грецкий орех. Сладко-солёная гармония.',
      'Fig, goat cheese, mountain honey and walnuts. Sweet meets salty.'
    ),
  }),
  pizza({
    id: 'pesto-princess',
    name: 'Pesto Princess',
    image: pizzaPhoto('1585238342024-78d387f4a707', 0.47, 0.47, 1.15),
    basePrice: 92000,
    rating: 4.8,
    kcal: 740,
    ingredients: ['chicken', 'pesto', 'pepper', 'mozzarella'],
    desc: t(
      "Shirali tovuq, rayhon pestosi, bolgar qalampiri va motsarella.",
      'Сочная курица, песто из базилика, перец и моцарелла.',
      'Juicy chicken, basil pesto, bell pepper and mozzarella.'
    ),
  }),
  pizza({
    id: 'shrimp-rose',
    name: 'Shrimp Rosé',
    image: pizzaPhoto('1564936281291-294551497d81', 0.45, 0.45, 1.2),
    basePrice: 125000,
    badge: 'new',
    rating: 4.9,
    kcal: 690,
    ingredients: ['shrimp', 'garlic', 'lemon', 'chili'],
    desc: t(
      "Krevetkalar, pushti rozé sousi, sarimsoq va limon. Dengiz bo'yidagi kechadek.",
      'Креветки, розовый соус розе, чеснок и лимон. Как вечер у моря.',
      'Shrimp, pink rosé sauce, garlic and lemon. A seaside evening in a box.'
    ),
  }),
  pizza({
    id: 'bbq-babe',
    name: 'BBQ Babe',
    image: pizzaPhoto('1594007654729-407eedc4be65', 0.52, 0.67, 1.25),
    basePrice: 95000,
    badge: 'spicy',
    rating: 4.7,
    kcal: 860,
    ingredients: ['chicken', 'bbq', 'onion', 'chili'],
    desc: t(
      "Dudlangan tovuq, BBQ sousi, qizil piyoz va jalapeno.",
      'Копчёная курица, соус BBQ, красный лук и халапеньо.',
      'Smoky chicken, BBQ sauce, red onion and jalapeño.'
    ),
  }),
  pizza({
    id: 'rucola-romance',
    name: 'Rucola Romance',
    image: pizzaPhoto('1590534247854-e97d5e3feef6', 0.42, 0.52, 1.45),
    basePrice: 109000,
    rating: 4.9,
    kcal: 710,
    ingredients: ['prosciutto', 'arugula', 'parmesan', 'cherry'],
    desc: t(
      "Proshutto, yangi rukkola, parmezan bo'laklari va gilos pomidorlar.",
      'Прошутто, свежая руккола, стружка пармезана и черри.',
      'Prosciutto, fresh arugula, shaved parmesan and cherry tomatoes.'
    ),
  }),

  /* ───────────── FIT PIZZA ───────────── */
  pizza({
    id: 'protein-queen',
    category: 'fit',
    name: 'Protein Queen',
    image: pizzaPhoto('1555072956-7758afb20e8f', 0.5, 0.6, 1.25),
    basePrice: 89000,
    badge: 'fit',
    rating: 4.9,
    kcal: 540,
    protein: 42,
    ingredients: ['chicken', 'spinach', 'mushroom', 'mozzarella'],
    desc: t(
      "To'liq donli xamir, grilda pishirilgan tovuq ko'kragi, ismaloq, qo'ziqorin va light motsarella. 42 g oqsil.",
      'Цельнозерновое тесто, куриная грудка гриль, шпинат, грибы и лёгкая моцарелла. 42 г белка.',
      'Whole-grain crust, grilled chicken breast, spinach, mushrooms and light mozzarella. 42 g protein.'
    ),
  }),
  pizza({
    id: 'cauli-crush',
    category: 'fit',
    name: 'Cauli Crush',
    image: pizzaPhoto('1574071318508-1cdbab80d002', 0.5, 0.55, 1.05, 'flip=hv'),
    basePrice: 92000,
    badge: 'new',
    rating: 4.8,
    kcal: 410,
    protein: 24,
    ingredients: ['tomato', 'mozzarella', 'basil', 'olive'],
    desc: t(
      'Gulkaramli xamir (glyutensiz, kam uglevod), pomidor, motsarella va rayhon.',
      'Корж из цветной капусты (без глютена, мало углеводов), томаты, моцарелла и базилик.',
      'Cauliflower crust (gluten-free, low-carb), tomato, mozzarella and basil.'
    ),
  }),
  pizza({
    id: 'zucchini-light',
    category: 'fit',
    name: 'Zucchini Light',
    image: pizzaPhoto('1595854341625-f33ee10dbf94', 0.35, 0.47, 1.28, 'flip=h&rot=90'),
    basePrice: 82000,
    badge: 'fit',
    rating: 4.7,
    kcal: 380,
    protein: 21,
    ingredients: ['ricotta', 'lemon', 'arugula', 'oliveoil'],
    desc: t(
      "Yupqa to'liq donli xamir, qovoqcha, rikotta, limon va rukkola. Eng yengil pitsamiz.",
      'Тонкое цельнозерновое тесто, цукини, рикотта, лимон и руккола. Самая лёгкая пицца.',
      'Thin whole-grain crust, zucchini, ricotta, lemon and arugula. Our lightest pizza.'
    ),
  }),

  /* ───────────── COMBOS ───────────── */
  {
    id: 'girls-night-box',
    category: 'combo',
    name: "Girls' Night Box",
    image: photo('1606787366850-de6330128bfc'),
    price: 239000,
    oldPrice: 296000,
    badge: 'save',
    rating: 5.0,
    kcal: 2400,
    desc: t(
      "2 ta o'rta pitsa + 2 ta ichimlik + Macaron Box. 3–4 dugona uchun.",
      '2 средние пиццы + 2 напитка + Macaron Box. На 3–4 подружки.',
      '2 medium pizzas + 2 drinks + Macaron Box. Serves 3–4 besties.'
    ),
  },
  {
    id: 'self-care-box',
    category: 'combo',
    name: 'Self-care Box',
    image: photo('1504674900247-0877df9cc836'),
    price: 139000,
    oldPrice: 171000,
    badge: 'hit',
    rating: 4.9,
    kcal: 1150,
    desc: t(
      "Kichik pitsa + Matcha Latte + Tiramisu. O'zingiz uchun mukammal kecha.",
      'Маленькая пицца + Matcha Latte + тирамису. Идеальный вечер для себя.',
      'Small pizza + Matcha Latte + Tiramisu. The perfect night with yourself.'
    ),
  },
  {
    id: 'movie-night-duo',
    category: 'combo',
    name: 'Movie Night Duo',
    image: photo('1513104890138-7c749659a591'),
    price: 179000,
    oldPrice: 216000,
    badge: 'save',
    rating: 4.8,
    kcal: 1900,
    desc: t(
      "Katta pitsa + trufelli kartoshka + 2 ta limonad. Kino + dugona = ideal.",
      'Большая пицца + трюфельный картофель + 2 лимонада. Кино с подругой.',
      'Large pizza + truffle fries + 2 lemonades. Film night for two.'
    ),
  },

  /* ───────────── SALADS & BITES ───────────── */
  {
    id: 'avocado-bowl',
    category: 'snacks',
    name: t('Avokado boul', 'Боул с авокадо', 'Avocado Bowl'),
    image: photo('1512621776951-a57141f2eefd'),
    price: 55000,
    badge: 'fit',
    rating: 4.9,
    kcal: 420,
    ingredients: ['avocado', 'cherry', 'egg', 'lemon'],
    desc: t("Avokado, kinoa, tuxum, gilos pomidor va limonli sous.", 'Авокадо, киноа, яйцо, черри и лимонная заправка.', 'Avocado, quinoa, egg, cherry tomatoes and lemon dressing.'),
  },
  {
    id: 'caesar',
    category: 'snacks',
    name: t('Sezar', 'Цезарь', 'Caesar'),
    image: photo('1550304943-4f24f54ddde9'),
    price: 52000,
    rating: 4.8,
    kcal: 480,
    ingredients: ['chicken', 'parmesan', 'garlic'],
    desc: t("Romen salati, tovuq, parmezan va sarimsoqli krutonlar.", 'Романо, курица, пармезан и чесночные крутоны.', 'Romaine, chicken, parmesan and garlic croutons.'),
  },
  {
    id: 'caprese',
    category: 'snacks',
    name: t('Kapreze', 'Капрезе', 'Caprese'),
    image: photo('1592417817098-8fd3d9eb14a5'),
    price: 48000,
    rating: 4.8,
    kcal: 310,
    ingredients: ['tomato', 'mozzarella', 'basil'],
    desc: t('Pomidor, motsarella, rayhon va balzamik.', 'Томаты, моцарелла, базилик и бальзамик.', 'Tomato, mozzarella, basil and balsamic.'),
  },
  {
    id: 'garden-salad',
    category: 'snacks',
    name: t('Bog‘ salati', 'Садовый салат', 'Garden Salad'),
    image: photo('1505253716362-afaea1d3d1af'),
    price: 42000,
    badge: 'fit',
    rating: 4.7,
    kcal: 220,
    desc: t('Yangi ko‘katlar, bodring, rediska va asal-xantal sousi.', 'Свежая зелень, огурец, редис и медово-горчичная заправка.', 'Fresh greens, cucumber, radish and honey-mustard dressing.'),
  },
  {
    id: 'truffle-fries',
    category: 'snacks',
    name: t('Trufelli kartoshka', 'Картофель с трюфелем', 'Truffle Fries'),
    image: photo('1573080496219-bb080dd4f877'),
    price: 32000,
    badge: 'hit',
    rating: 4.9,
    kcal: 430,
    desc: t('Qarsildoq kartoshka fri, trufel moyi va parmezan.', 'Хрустящий картофель, трюфельное масло и пармезан.', 'Crispy fries, truffle oil and parmesan.'),
  },
  {
    id: 'mozzarella-sticks',
    category: 'snacks',
    name: t('Motsarella tayoqchalari', 'Моцарелла стикс', 'Mozzarella Sticks'),
    image: photo('1531749668029-2db88e4276c7'),
    price: 38000,
    rating: 4.8,
    kcal: 460,
    desc: t('6 dona, pomidorli dip sousi bilan.', '6 штук, с томатным дипом.', '6 pieces with tomato dip.'),
  },

  /* ───────────── DESSERTS ───────────── */
  {
    id: 'strawberry-tiramisu',
    category: 'desserts',
    name: t('Tiramisu', 'Тирамису', 'Tiramisu'),
    image: photo('1571877227200-a0d98ea607e9'),
    price: 39000,
    badge: 'hit',
    rating: 5.0,
    kcal: 390,
    desc: t('Maskarpone kremi, kofe va savoyardi.', 'Крем маскарпоне, кофе и савоярди.', 'Mascarpone cream, espresso and savoiardi.'),
  },
  {
    id: 'macaron-box',
    category: 'desserts',
    name: 'Macaron Box',
    image: photo('1569864358642-9d1684040f43'),
    price: 49000,
    rating: 4.9,
    kcal: 420,
    desc: t('6 ta fransuz makaroni: malina, pista, vanil va boshqalar.', '6 французских макарон: малина, фисташка, ваниль и др.', '6 French macarons: raspberry, pistachio, vanilla & more.'),
  },
  {
    id: 'heart-tart',
    category: 'desserts',
    name: t('Qulupnayli tart', 'Клубничный тарт', 'Strawberry Heart Tart'),
    image: photo('1464305795204-6f5bbfc7fb81'),
    price: 39000,
    badge: 'new',
    rating: 4.9,
    kcal: 360,
    desc: t("Yurakcha shaklidagi qumli tart, vanil kremi va qulupnay.", 'Песочный тарт-сердечко, ванильный крем и клубника.', 'Heart-shaped shortcrust tart with vanilla cream and strawberries.'),
  },
  {
    id: 'strawberry-crepes',
    category: 'desserts',
    name: t('Qulupnayli krep', 'Крепы с клубникой', 'Strawberry Crêpes'),
    image: photo('1587314168485-3236d6710814'),
    price: 44000,
    rating: 4.8,
    kcal: 480,
    desc: t('Yupqa kreplar, qulupnay, Nutella va qaymoq.', 'Тонкие крепы, клубника, Nutella и сливки.', 'Thin crêpes, strawberries, Nutella and cream.'),
  },
  {
    id: 'berry-parfait',
    category: 'desserts',
    name: t('Qulupnay parfe', 'Клубничное парфе', 'Strawberry Parfait'),
    image: photo('1488477181946-6428a0291777'),
    price: 35000,
    badge: 'fit',
    rating: 4.7,
    kcal: 260,
    desc: t('Grek yogurti, granola va yangi qulupnay.', 'Греческий йогурт, гранола и свежая клубника.', 'Greek yoghurt, granola and fresh strawberries.'),
  },
  {
    id: 'blueberry-cheesecake',
    category: 'desserts',
    name: t('Chernika chizkeyk', 'Чизкейк с черникой', 'Blueberry Cheesecake'),
    image: photo('1533134242443-d4fd215305ad'),
    price: 45000,
    rating: 4.9,
    kcal: 450,
    desc: t('Kremli chizkeyk va chernika sousi.', 'Нежный чизкейк с черничным соусом.', 'Creamy cheesecake with blueberry compote.'),
  },
  {
    id: 'ny-cheesecake',
    category: 'desserts',
    name: t('Nyu-York chizkeyk', 'Нью-Йорк чизкейк', 'New York Cheesecake'),
    image: photo('1524351199678-941a58a3df50'),
    price: 42000,
    rating: 4.8,
    kcal: 430,
    desc: t('Klassik vanilli chizkeyk.', 'Классический ванильный чизкейк.', 'Classic vanilla cheesecake.'),
  },
  {
    id: 'pink-velvet',
    category: 'desserts',
    name: 'Pink Velvet',
    image: photo('1621303837174-89787a7d4729'),
    price: 45000,
    badge: 'trend',
    rating: 5.0,
    kcal: 470,
    desc: t('Pushti biskvit, krem-chiz va sepkilar.', 'Розовый бисквит, крем-чиз и посыпка.', 'Pink sponge, cream cheese frosting and sprinkles.'),
  },
  {
    id: 'pink-cupcake',
    category: 'desserts',
    name: t('Pushti kapkeyk', 'Розовый капкейк', 'Pink Cupcake'),
    image: photo('1599785209707-a456fc1337bb'),
    price: 25000,
    rating: 4.7,
    kcal: 320,
    desc: t('Vanilli kapkeyk va qulupnayli krem.', 'Ванильный капкейк с клубничным кремом.', 'Vanilla cupcake with strawberry frosting.'),
  },

  /* ───────────── DRINKS ───────────── */
  {
    id: 'pink-lemonade',
    category: 'drinks',
    name: 'Pink Lemonade',
    image: photo('1497534446932-c925b458314e'),
    price: 25000,
    badge: 'hit',
    rating: 4.9,
    kcal: 120,
    desc: t('Malina, limon va yalpiz. 0.4 l', 'Малина, лимон и мята. 0.4 л', 'Raspberry, lemon and mint. 0.4 l'),
  },
  {
    id: 'classic-lemonade',
    category: 'drinks',
    name: t('Klassik limonad', 'Классический лимонад', 'Classic Lemonade'),
    image: photo('1523677011781-c91d1bbe2f9e'),
    price: 22000,
    rating: 4.7,
    kcal: 110,
    desc: t('Yangi siqilgan limon va yalpiz. 0.4 l', 'Свежий лимон и мята. 0.4 л', 'Fresh lemon and mint. 0.4 l'),
  },
  {
    id: 'matcha-latte',
    category: 'drinks',
    name: 'Matcha Latte',
    image: photo('1515823064-d6e0c04616a7'),
    price: 35000,
    badge: 'trend',
    rating: 4.9,
    kcal: 180,
    desc: t('Yapon matchasi va bodom suti. 0.35 l', 'Японская матча и миндальное молоко. 0.35 л', 'Japanese matcha with almond milk. 0.35 l'),
  },
  {
    id: 'strawberry-shake',
    category: 'drinks',
    name: t('Qulupnay milkshake', 'Клубничный милкшейк', 'Strawberry Shake'),
    image: photo('1579954115545-a95591f28bfc'),
    price: 32000,
    rating: 4.8,
    kcal: 340,
    desc: t('Vanil muzqaymoq va qulupnay. 0.4 l', 'Ванильное мороженое и клубника. 0.4 л', 'Vanilla ice cream and strawberries. 0.4 l'),
  },
  {
    id: 'oreo-shake',
    category: 'drinks',
    name: 'Oreo Shake',
    image: photo('1572490122747-3968b75cc699'),
    price: 36000,
    rating: 4.8,
    kcal: 420,
    desc: t('Oreo, muzqaymoq va qaymoq. 0.4 l', 'Oreo, мороженое и сливки. 0.4 л', 'Oreo, ice cream and whipped cream. 0.4 l'),
  },
  {
    id: 'berry-smoothie',
    category: 'drinks',
    name: t('Berry smuzi', 'Ягодный смузи', 'Berry Smoothie'),
    image: photo('1553530666-ba11a7da3888'),
    price: 34000,
    badge: 'fit',
    rating: 4.8,
    kcal: 190,
    desc: t('Malina, qulupnay, banan va yogurt. 0.4 l', 'Малина, клубника, банан и йогурт. 0.4 л', 'Raspberry, strawberry, banana and yoghurt. 0.4 l'),
  },
  {
    id: 'mango-smoothie',
    category: 'drinks',
    name: t('Mango smuzi', 'Манго смузи', 'Mango Smoothie'),
    image: photo('1534353473418-4cfa6c56fd38'),
    price: 34000,
    rating: 4.7,
    kcal: 200,
    desc: t('Mango, ananas va kokos suti. 0.4 l', 'Манго, ананас и кокосовое молоко. 0.4 л', 'Mango, pineapple and coconut milk. 0.4 l'),
  },
  {
    id: 'peach-iced-tea',
    category: 'drinks',
    name: t('Shaftolili muzli choy', 'Персиковый айс-ти', 'Peach Iced Tea'),
    image: photo('1556679343-c7306c1976bc'),
    price: 24000,
    rating: 4.7,
    kcal: 90,
    desc: t('Uy muzli choyi, shaftoli va limon. 0.4 l', 'Домашний чай со льдом, персик и лимон. 0.4 л', 'House iced tea with peach and lemon. 0.4 l'),
  },
  {
    id: 'iced-latte',
    category: 'drinks',
    name: 'Iced Latte',
    image: photo('1461023058943-07fcbe16d735'),
    price: 30000,
    rating: 4.8,
    kcal: 150,
    desc: t('Espresso, sut va muz. Vanil siropi — xohishga ko‘ra.', 'Эспрессо, молоко и лёд. Ванильный сироп по желанию.', 'Espresso, milk and ice. Vanilla syrup on request.'),
  },
];

/** One-click order bump on the checkout screen. */
const ORDER_BUMP = {
  id: 'tiramisu-bump',
  productId: 'strawberry-tiramisu',
  image: photo('1571877227200-a0d98ea607e9'),
  oldPrice: 39000,
  price: 19000,
  title: t("Tiramisu qo'shasizmi? 🍰", 'Добавить тирамису? 🍰', 'Add a Tiramisu? 🍰'),
  subtitle: t(
    'Faqat shu buyurtma uchun — deyarli yarim narxda',
    'Только к этому заказу — почти за полцены',
    'This order only — almost half price'
  ),
};

module.exports = { INGREDIENTS, CATEGORIES, PRODUCTS, ORDER_BUMP, BADGES, SIZE_DEFS };
