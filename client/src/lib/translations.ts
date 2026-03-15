// UI translations for Russian (ru) and Shughni (sgh)
// Shughni translations provided by native speakers
// Russian is the default/fallback language

export type UILanguage = "ru" | "sgh";

const translations = {
  // ── Navigation (BottomNav) ──────────────────────────────────────
  "nav.home": { ru: "Главная", sgh: "Pêroyak" },
  "nav.learn": { ru: "Учить", sgh: "Ẋeydo" },
  "nav.add": { ru: "Добавить", sgh: "Naw" },
  "nav.dictionary": { ru: "Словарь", sgh: "Luɣat" },
  "nav.ranks": { ru: "Рейтинг", sgh: "Рейтинг" },

  // ── Home page ───────────────────────────────────────────────────
  "home.welcome": { ru: "Добро пожаловать", sgh: "Salōmolek!" },
  "home.subtitle": { ru: "Давайте учить шугнанский", sgh: "Vet Khughnoni khoyam" },
  "home.streak": { ru: "Серия дней", sgh: "Cōndum ruz" },
  "home.learned": { ru: "Изучено", sgh: "Kheyjen" },
  "home.rank": { ru: "Ранг", sgh: "Ранг" },
  "home.wordOfDay": { ru: "Слово дня", sgh: "Nurinj kalimā" },
  "home.tapToFlip": { ru: "Нажмите, чтобы увидеть перевод", sgh: "Нажмите, чтобы увидеть перевод" },
  "home.startLesson": { ru: "Начать урок", sgh: "Sar kenām" },
  "home.level": { ru: "Уровень", sgh: "Уровень" },
  "home.xpToLevel": { ru: "XP до уровня", sgh: "XP до уровня" },

  // ── Dictionary page ─────────────────────────────────────────────
  "dict.title": { ru: "Словарь", sgh: "Luɣat" },
  "dict.search": { ru: "Поиск...", sgh: "Поиск..." },
  "dict.all": { ru: "Все", sgh: "Все" },
  "dict.noWords": { ru: "Слова не найдены", sgh: "Слова не найдены" },
  "dict.needLevel": { ru: "Нужен уровень", sgh: "Нужен уровень" },
  "dict.latin": { ru: "Латиница", sgh: "Латиница" },
  "dict.cyrillic": { ru: "Кириллица", sgh: "Кириллица" },
  "dict.source": { ru: "Источник", sgh: "Источник" },
  "dict.sourceCommunity": { ru: "сообщество", sgh: "сообщество" },
  "dict.sourceZarubin": { ru: "Зарубин", sgh: "Зарубин" },
  "dict.sourceDictionary": { ru: "словарь", sgh: "словарь" },
  "dict.suggestCorrection": { ru: "Предложить исправление", sgh: "Предложить исправление" },
  "dict.yourVariant": { ru: "Ваш вариант:", sgh: "Ваш вариант:" },
  "dict.submit": { ru: "Отправить", sgh: "Bēkhto" },
  "dict.correctionSent": { ru: "Исправление отправлено! +5 XP", sgh: "Исправление отправлено! +5 XP" },
  "dict.suggestions": { ru: "Предложения", sgh: "Предложения" },

  // ── Learn page ──────────────────────────────────────────────────
  "learn.title": { ru: "Выберите категорию", sgh: "Выберите категорию" },
  "learn.subtitle": { ru: "Проверьте свои знания", sgh: "Проверьте свои знания" },
  "learn.words": { ru: "слов", sgh: "слов" },
  "learn.match": { ru: "Матч", sgh: "Матч" },
  "learn.test": { ru: "Тест", sgh: "Тест" },
  "learn.fewWords": { ru: "мало слов", sgh: "мало слов" },
  "learn.lvl": { ru: "Ур.", sgh: "Ур." },
  "learn.back": { ru: "Назад", sgh: "Назад" },
  "learn.whatMeans": { ru: "Что означает?", sgh: "Что означает?" },
  "learn.finish": { ru: "Завершить", sgh: "Завершить" },
  "learn.next": { ru: "Далее", sgh: "Далее" },
  "learn.correct": { ru: "правильно", sgh: "правильно" },
  "learn.xpEarned": { ru: "Получено XP", sgh: "Получено XP" },
  "learn.newLevel": { ru: "Новый уровень!", sgh: "Новый уровень!" },
  "learn.newCategories": { ru: "Открыты новые категории:", sgh: "Открыты новые категории:" },
  "learn.newBadges": { ru: "Новые значки:", sgh: "Новые значки:" },
  "learn.categories": { ru: "Категории", sgh: "Категории" },
  "learn.retry": { ru: "Ещё раз", sgh: "Ещё раз" },
  "learn.round": { ru: "Раунд", sgh: "Раунд" },
  "learn.matchInstruction": { ru: "Нажмите слово слева, затем его перевод справа", sgh: "Нажмите слово слева, затем его перевод справа" },
  "learn.pairs": { ru: "пар", sgh: "пар" },

  // ── Add page ────────────────────────────────────────────────────
  "add.addWord": { ru: "Добавить слово", sgh: "Добавить слово" },
  "add.reviewWords": { ru: "Проверить слова", sgh: "Проверить слова" },
  "add.addSubtitle": { ru: "Поделитесь словом, которое вы знаете", sgh: "Поделитесь словом, которое вы знаете" },
  "add.reviewSubtitle": { ru: "Помогите сообществу проверить новые слова", sgh: "Помогите сообществу проверить новые слова" },
  "add.tabAdd": { ru: "Добавить", sgh: "Naw" },
  "add.tabReview": { ru: "Проверить", sgh: "Проверить" },
  "add.pamiriLatin": { ru: "Памирский (латиница)", sgh: "Памирский (латиница)" },
  "add.pamiriCyrillic": { ru: "Памирский (кириллица)", sgh: "Памирский (кириллица)" },
  "add.english": { ru: "Английский", sgh: "Английский" },
  "add.russian": { ru: "Русский", sgh: "Русский" },
  "add.category": { ru: "Категория", sgh: "Категория" },
  "add.selectCategory": { ru: "Выберите категорию", sgh: "Выберите категорию" },
  "add.preview": { ru: "Предпросмотр", sgh: "Предпросмотр" },
  "add.submit": { ru: "Отправить (+50 XP)", sgh: "Bēkhto (+50 XP)" },
  "add.thanks": { ru: "Спасибо!", sgh: "Спасибо!" },
  "add.sentForReview": { ru: "Ваше слово отправлено на проверку сообществу", sgh: "Ваше слово отправлено на проверку сообществу" },
  "add.error": { ru: "Что-то пошло не так", sgh: "Что-то пошло не так" },
  "add.noWordsToReview": { ru: "Нет слов для проверки", sgh: "Нет слов для проверки" },
  "add.comeBackLater": { ru: "Пока никто не добавил новых слов. Вернитесь позже!", sgh: "Пока никто не добавил новых слов. Вернитесь позже!" },
  "add.allReviewed": { ru: "Всё проверено!", sgh: "Всё проверено!" },
  "add.wordsWaiting": { ru: "слов ждут проверки", sgh: "слов ждут проверки" },
  "add.isCorrect": { ru: "Это слово верное на памирском языке?", sgh: "Это слово верное на памирском языке?" },
  "add.incorrect": { ru: "Неверно", sgh: "Неверно" },
  "add.correct": { ru: "Верно", sgh: "Верно" },
  "add.xpPerReview": { ru: "+5 XP за каждое проверенное слово", sgh: "+5 XP за каждое проверенное слово" },
  "add.xpEarned": { ru: "XP заработано", sgh: "XP заработано" },

  // ── Profile page ────────────────────────────────────────────────
  "profile.level": { ru: "Уровень", sgh: "Уровень" },
  "profile.moderator": { ru: "Модератор", sgh: "Модератор" },
  "profile.totalXp": { ru: "Всего XP", sgh: "Всего XP" },
  "profile.streak": { ru: "Серия", sgh: "Серия" },
  "profile.maxStreak": { ru: "Макс. серия", sgh: "Макс. серия" },
  "profile.learned": { ru: "Изучено", sgh: "Kheyjen" },
  "profile.contributed": { ru: "Добавлено", sgh: "Добавлено" },
  "profile.rank": { ru: "Ранг", sgh: "Ранг" },
  "profile.badges": { ru: "Значки", sgh: "Значки" },
  "profile.recentActions": { ru: "Последние действия", sgh: "Последние действия" },
  "profile.logout": { ru: "Выйти", sgh: "Nakhtidō" },

  // ── Ranks page ──────────────────────────────────────────────────
  "ranks.title": { ru: "Лучшие ученики", sgh: "Лучшие ученики" },
  "ranks.subtitle": { ru: "Таблица лидеров", sgh: "Таблица лидеров" },
  "ranks.noParticipants": { ru: "Пока нет участников", sgh: "Пока нет участников" },
  "ranks.you": { ru: "(вы)", sgh: "(вы)" },
  "ranks.level": { ru: "Уровень", sgh: "Уровень" },
  "ranks.days": { ru: "дн.", sgh: "дн." },

  // ── Language toggle ─────────────────────────────────────────────
  "lang.ru": { ru: "РУ", sgh: "РУ" },
  "lang.sgh": { ru: "ШУГ", sgh: "ШУГ" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: UILanguage): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.ru;
}
