// UI translations for Russian (ru), Shughni (sgh), and Tajik (tj)
// Shughni translations provided by native speakers
// Russian is the default/fallback language

export type UILanguage = "ru" | "sgh" | "tj";

const translations = {
  // ── Navigation (BottomNav) ──────────────────────────────────────
  "nav.home": { ru: "Главная", sgh: "Pêroyak", tj: "Асосӣ" },
  "nav.learn": { ru: "Учить", sgh: "Ẋeydo", tj: "Омӯзиш" },
  "nav.add": { ru: "Добавить", sgh: "Naw", tj: "Илова" },
  "nav.dictionary": { ru: "Словарь", sgh: "Luɣat", tj: "Луғат" },
  "nav.ranks": { ru: "Рейтинг", sgh: "Рейтинг", tj: "Рейтинг" },

  // ── Home page ───────────────────────────────────────────────────
  "home.welcome": { ru: "Добро пожаловать", sgh: "Salōmolek!", tj: "Хуш омадед" },
  "home.subtitle": { ru: "Давайте учить шугнанский", sgh: "Vet Khughnoni khoyam", tj: "Биёед забони шуғнонӣро омӯзем" },
  "home.streak": { ru: "Серия дней", sgh: "Cōndum ruz", tj: "Силсилаи рӯзҳо" },
  "home.learned": { ru: "Изучено", sgh: "Kheyjen", tj: "Омӯхта шуд" },
  "home.rank": { ru: "Ранг", sgh: "Ранг", tj: "Рутба" },
  "home.wordOfDay": { ru: "Слово дня", sgh: "Nurinj kalimā", tj: "Калимаи рӯз" },
  "home.tapToFlip": { ru: "Нажмите, чтобы увидеть перевод", sgh: "Нажмите, чтобы увидеть перевод", tj: "Барои дидани тарҷума пахш кунед" },
  "home.startLesson": { ru: "Начать урок", sgh: "Sar kenām", tj: "Дарсро оғоз кунед" },
  "home.level": { ru: "Уровень", sgh: "Уровень", tj: "Сатҳ" },
  "home.xpToLevel": { ru: "XP до уровня", sgh: "XP до уровня", tj: "XP то сатҳи" },
  "home.nextLesson": { ru: "Следующий урок", sgh: "Pêsh ẋeydo", tj: "Дарси навбатӣ" },
  "home.dailyGoal": { ru: "Цель на день", sgh: "Cōndum hisob", tj: "Ҳадафи рӯзона" },
  "home.nextUnlock": { ru: "Следующий: ", sgh: "Vēy: ", tj: "Баъдӣ: " },
  "home.atLevel": { ru: "на уровне", sgh: "darsoh", tj: "дар сатҳи" },

  // ── Dictionary page ─────────────────────────────────────────────
  "dict.title": { ru: "Словарь", sgh: "Luɣat", tj: "Луғат" },
  "dict.search": { ru: "Поиск...", sgh: "Поиск...", tj: "Ҷустуҷӯ..." },
  "dict.all": { ru: "Все", sgh: "Все", tj: "Ҳама" },
  "dict.noWords": { ru: "Слова не найдены", sgh: "Слова не найдены", tj: "Калимае ёфт нашуд" },
  "dict.needLevel": { ru: "Нужен уровень", sgh: "Нужен уровень", tj: "Сатҳи зарурӣ" },
  "dict.latin": { ru: "Латиница", sgh: "Латиница", tj: "Лотинӣ" },
  "dict.cyrillic": { ru: "Кириллица", sgh: "Кириллица", tj: "Кириллӣ" },
  "dict.source": { ru: "Источник", sgh: "Источник", tj: "Манбаъ" },
  "dict.sourceCommunity": { ru: "сообщество", sgh: "сообщество", tj: "ҷомеа" },
  "dict.sourceZarubin": { ru: "Зарубин", sgh: "Зарубин", tj: "Зарубин" },
  "dict.sourceDictionary": { ru: "словарь", sgh: "словарь", tj: "луғат" },
  "dict.suggestCorrection": { ru: "Предложить исправление", sgh: "Предложить исправление", tj: "Пешниҳоди ислоҳ" },
  "dict.yourVariant": { ru: "Ваш вариант:", sgh: "Ваш вариант:", tj: "Варианти шумо:" },
  "dict.submit": { ru: "Отправить", sgh: "Bēkhto", tj: "Фиристодан" },
  "dict.correctionSent": { ru: "Исправление отправлено! +5 XP", sgh: "Исправление отправлено! +5 XP", tj: "Ислоҳ фиристода шуд! +5 XP" },
  "dict.suggestions": { ru: "Предложения", sgh: "Предложения", tj: "Пешниҳодҳо" },
  "dict.tajik": { ru: "Тадж.", sgh: "Тадж.", tj: "Тоҷ." },

  // ── Learn page ──────────────────────────────────────────────────
  "learn.title": { ru: "Выберите категорию", sgh: "Выберите категорию", tj: "Категорияро интихоб кунед" },
  "learn.subtitle": { ru: "Проверьте свои знания", sgh: "Проверьте свои знания", tj: "Дониши худро санҷед" },
  "learn.words": { ru: "слов", sgh: "слов", tj: "калима" },
  "learn.match": { ru: "Матч", sgh: "Матч", tj: "Мувофиқат" },
  "learn.test": { ru: "Тест", sgh: "Тест", tj: "Санҷиш" },
  "learn.fewWords": { ru: "мало слов", sgh: "мало слов", tj: "калимаи кам" },
  "learn.lvl": { ru: "Ур.", sgh: "Ур.", tj: "Сатҳ." },
  "learn.back": { ru: "Назад", sgh: "Назад", tj: "Бозгашт" },
  "learn.whatMeans": { ru: "Что означает?", sgh: "Что означает?", tj: "Чӣ маъно дорад?" },
  "learn.finish": { ru: "Завершить", sgh: "Завершить", tj: "Хатм кунед" },
  "learn.next": { ru: "Далее", sgh: "Далее", tj: "Баъдӣ" },
  "learn.correct": { ru: "правильно", sgh: "правильно", tj: "дуруст" },
  "learn.xpEarned": { ru: "Получено XP", sgh: "Получено XP", tj: "XP гирифта шуд" },
  "learn.newLevel": { ru: "Новый уровень!", sgh: "Новый уровень!", tj: "Сатҳи нав!" },
  "learn.newCategories": { ru: "Открыты новые категории:", sgh: "Открыты новые категории:", tj: "Категорияҳои нав кушода шуданд:" },
  "learn.newBadges": { ru: "Новые значки:", sgh: "Новые значки:", tj: "Нишонаҳои нав:" },
  "learn.categories": { ru: "Категории", sgh: "Категории", tj: "Категорияҳо" },
  "learn.retry": { ru: "Ещё раз", sgh: "Ещё раз", tj: "Бори дигар" },
  "learn.round": { ru: "Раунд", sgh: "Раунд", tj: "Давра" },
  "learn.matchInstruction": { ru: "Нажмите слово слева, затем его перевод справа", sgh: "Нажмите слово слева, затем его перевод справа", tj: "Калимаи чапро пахш кунед, сипас тарҷумаи ростро" },
  "learn.pairs": { ru: "пар", sgh: "пар", tj: "ҷуфт" },

  // ── Add page ────────────────────────────────────────────────────
  "add.addWord": { ru: "Добавить слово", sgh: "Добавить слово", tj: "Илова кардани калима" },
  "add.reviewWords": { ru: "Проверить слова", sgh: "Проверить слова", tj: "Баррасии калимаҳо" },
  "add.addSubtitle": { ru: "Поделитесь словом, которое вы знаете", sgh: "Поделитесь словом, которое вы знаете", tj: "Калимаеро, ки медонед, мубодила кунед" },
  "add.reviewSubtitle": { ru: "Помогите сообществу проверить новые слова", sgh: "Помогите сообществу проверить новые слова", tj: "Ба ҷомеа дар санҷидани калимаҳои нав кӯмак кунед" },
  "add.tabAdd": { ru: "Добавить", sgh: "Naw", tj: "Илова" },
  "add.tabReview": { ru: "Проверить", sgh: "Проверить", tj: "Баррасӣ" },
  "add.pamiriLatin": { ru: "Памирский (латиница)", sgh: "Памирский (латиница)", tj: "Помирӣ (лотинӣ)" },
  "add.pamiriCyrillic": { ru: "Памирский (кириллица)", sgh: "Памирский (кириллица)", tj: "Помирӣ (кириллӣ)" },
  "add.english": { ru: "Английский", sgh: "Английский", tj: "Англисӣ" },
  "add.russian": { ru: "Русский", sgh: "Русский", tj: "Русӣ" },
  "add.tajik": { ru: "Таджикский", sgh: "Таджикский", tj: "Тоҷикӣ" },
  "add.category": { ru: "Категория", sgh: "Категория", tj: "Категория" },
  "add.selectCategory": { ru: "Выберите категорию", sgh: "Выберите категорию", tj: "Категорияро интихоб кунед" },
  "add.preview": { ru: "Предпросмотр", sgh: "Предпросмотр", tj: "Пешнамоиш" },
  "add.submit": { ru: "Отправить (+50 XP)", sgh: "Bēkhto (+50 XP)", tj: "Фиристодан (+50 XP)" },
  "add.thanks": { ru: "Спасибо!", sgh: "Спасибо!", tj: "Ташаккур!" },
  "add.sentForReview": { ru: "Ваше слово отправлено на проверку сообществу", sgh: "Ваше слово отправлено на проверку сообществу", tj: "Калимаи шумо барои баррасии ҷомеа фиристода шуд" },
  "add.error": { ru: "Что-то пошло не так", sgh: "Что-то пошло не так", tj: "Чизе хато рафт" },
  "add.noWordsToReview": { ru: "Нет слов для проверки", sgh: "Нет слов для проверки", tj: "Калимае барои баррасӣ нест" },
  "add.comeBackLater": { ru: "Пока никто не добавил новых слов. Вернитесь позже!", sgh: "Пока никто не добавил новых слов. Вернитесь позже!", tj: "Ҳоло ҳеҷ кас калимаи нав илова накардааст. Баъдтар баргардед!" },
  "add.allReviewed": { ru: "Всё проверено!", sgh: "Всё проверено!", tj: "Ҳама баррасӣ шуд!" },
  "add.wordsWaiting": { ru: "слов ждут проверки", sgh: "слов ждут проверки", tj: "калима интизор аст" },
  "add.isCorrect": { ru: "Это слово верное на памирском языке?", sgh: "Это слово верное на памирском языке?", tj: "Оё ин калима дар забони помирӣ дуруст аст?" },
  "add.incorrect": { ru: "Неверно", sgh: "Неверно", tj: "Нодуруст" },
  "add.correct": { ru: "Верно", sgh: "Верно", tj: "Дуруст" },
  "add.xpPerReview": { ru: "+5 XP за каждое проверенное слово", sgh: "+5 XP за каждое проверенное слово", tj: "+5 XP барои ҳар калимаи баррасишуда" },
  "add.xpEarned": { ru: "XP заработано", sgh: "XP заработано", tj: "XP гирифта шуд" },
  "add.voteRecorded": { ru: "Голос записан! У слова теперь {n} голосов", sgh: "Голос записан! У слова теперь {n} голосов", tj: "Овоз сабт шуд! Ҳоло калима {n} овоз дорад" },
  "add.sessionSummary": { ru: "Вы проверили {x} слов. {y} из них близки к одобрению!", sgh: "Вы проверили {x} слов. {y} из них близки к одобрению!", tj: "Шумо {x} калима баррасӣ кардед. {y} аз онҳо ба тасдиқ наздиканд!" },
  "add.markReady": { ru: "Добавить в словарь", sgh: "Добавить в словарь", tj: "Ба луғат илова кунед" },

  // ── Profile page ────────────────────────────────────────────────
  "profile.level": { ru: "Уровень", sgh: "Уровень", tj: "Сатҳ" },
  "profile.moderator": { ru: "Модератор", sgh: "Модератор", tj: "Модератор" },
  "profile.totalXp": { ru: "Всего XP", sgh: "Всего XP", tj: "Ҳамаи XP" },
  "profile.streak": { ru: "Серия", sgh: "Серия", tj: "Силсила" },
  "profile.maxStreak": { ru: "Макс. серия", sgh: "Макс. серия", tj: "Ҳадди аксар. силсила" },
  "profile.learned": { ru: "Изучено", sgh: "Kheyjen", tj: "Омӯхта шуд" },
  "profile.contributed": { ru: "Добавлено", sgh: "Добавлено", tj: "Илова карда шуд" },
  "profile.rank": { ru: "Ранг", sgh: "Ранг", tj: "Рутба" },
  "profile.badges": { ru: "Значки", sgh: "Значки", tj: "Нишонаҳо" },
  "profile.script": { ru: "Памирское письмо", sgh: "Памирское письмо", tj: "Хати помирӣ" },
  "profile.recentActions": { ru: "Последние действия", sgh: "Последние действия", tj: "Амалҳои охирин" },
  "profile.logout": { ru: "Выйти", sgh: "Nakhtidō", tj: "Баромадан" },

  // ── Ranks page ──────────────────────────────────────────────────
  "ranks.title": { ru: "Лучшие ученики", sgh: "Лучшие ученики", tj: "Беҳтарин донишҷӯён" },
  "ranks.subtitle": { ru: "Таблица лидеров", sgh: "Таблица лидеров", tj: "Ҷадвали пешсафон" },
  "ranks.noParticipants": { ru: "Пока нет участников", sgh: "Пока нет участников", tj: "Ҳоло иштирокчие нест" },
  "ranks.you": { ru: "(вы)", sgh: "(вы)", tj: "(шумо)" },
  "ranks.level": { ru: "Уровень", sgh: "Уровень", tj: "Сатҳ" },
  "ranks.days": { ru: "дн.", sgh: "дн.", tj: "рӯз" },

  // ── Language toggle ─────────────────────────────────────────────
  "lang.ru": { ru: "РУ", sgh: "РУ", tj: "РУ" },
  "lang.sgh": { ru: "ШУГ", sgh: "ШУГ", tj: "ШУГ" },
  "lang.tj": { ru: "ТОҶ", sgh: "ТОҶ", tj: "ТОҶ" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: UILanguage): string {
  const entry = translations[key];
  if (!entry) return key;
  return (entry as Record<string, string>)[lang] || entry.ru;
}
