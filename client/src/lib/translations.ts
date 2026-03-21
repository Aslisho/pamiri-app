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
  "nav.ranks": { ru: "Рейтинг", sgh: "Fāmchin", tj: "Рейтинг" },
  "nav.profile": { ru: "Профиль", sgh: "Wuz", tj: "Профил" },

  // ── Home page ───────────────────────────────────────────────────
  "home.welcome": { ru: "Добро пожаловать", sgh: "Salōmolek!", tj: "Хуш омадед" },
  "home.subtitle": { ru: "Давайте учить шугнанский", sgh: "Vet Khughnoni khoyam", tj: "Биёед забони шуғнонӣро омӯзем" },
  "home.streak": { ru: "Серия дней", sgh: "Cōndum ruz", tj: "Силсилаи рӯзҳо" },
  "home.learned": { ru: "Изучено", sgh: "Kheyjen", tj: "Омӯхта шуд" },
  "home.rank": { ru: "Ранг", sgh: "Zurê", tj: "Рутба" },
  "home.wordOfDay": { ru: "Слово дня", sgh: "Nurinj kalimā", tj: "Калимаи рӯз" },
  "home.tapToFlip": { ru: "Нажмите, чтобы увидеть перевод", sgh: "Žaqet, lākin tarjumā winet", tj: "Барои дидани тарҷума пахш кунед" },
  "home.startLesson": { ru: "Начать урок", sgh: "Sar kenām", tj: "Дарсро оғоз кунед" },
  "home.level": { ru: "Уровень", sgh: "Uroven", tj: "Сатҳ" },
  "home.xpToLevel": { ru: "XP до уровня", sgh: "XP ga reδj", tj: "XP то сатҳи" },
  "home.nextLesson": { ru: "Следующий урок", sgh: "Tar pêro ẋêydo", tj: "Дарси навбатӣ" },
  "home.dailyGoal": { ru: "Цель на день", sgh: "Cōndum hisob", tj: "Ҳадафи рӯзона" },
  "home.nextUnlock": { ru: "Следующий: ", sgh: "Yega", tj: "Баъдӣ: " },
  "home.atLevel": { ru: "на уровне", sgh: "Urovente", tj: "дар сатҳи" },

  // ── Dictionary page ─────────────────────────────────────────────
  "dict.title": { ru: "Словарь", sgh: "Luɣat", tj: "Луғат" },
  "dict.search": { ru: "Поиск...", sgh: "Ẋikido", tj: "Ҷустуҷӯ..." },
  "dict.all": { ru: "Все", sgh: "Fukaϑ", tj: "Ҳама" },
  "dict.noWords": { ru: "Слова не найдены", sgh: "Def kalimāenum nāvêrud", tj: "Калимае ёфт нашуд" },
  "dict.needLevel": { ru: "Нужен уровень", sgh: "Darkor uroven", tj: "Сатҳи зарурӣ" },
  "dict.latin": { ru: "Латиница", sgh: "Latincê", tj: "Лотинӣ" },
  "dict.cyrillic": { ru: "Кириллица", sgh: "Kirilcê", tj: "Кириллӣ" },
  "dict.source": { ru: "Источник", sgh: "Jōydod", tj: "Манбаъ" },
  "dict.sourceCommunity": { ru: "сообщество", sgh: "Jamoat", tj: "ҷомеа" },
  "dict.sourceZarubin": { ru: "Зарубин", sgh: "Zarubin", tj: "Зарубин" },
  "dict.sourceDictionary": { ru: "словарь", sgh: "Luɣat", tj: "луғат" },
  "dict.suggestCorrection": { ru: "Предложить исправление", sgh: "Rost chido", tj: "Пешниҳоди ислоҳ" },
  "dict.yourVariant": { ru: "Ваш вариант:", sgh: "Tama muslat", tj: "Варианти шумо:" },
  "dict.submit": { ru: "Отправить", sgh: "Bēkhto", tj: "Фиристодан" },
  "dict.correctionSent": { ru: "Исправление отправлено! +5 XP", sgh: "Tama muslat bokhchak sut! +5 XP", tj: "Ислоҳ фиристода шуд! +5 XP" },
  "dict.suggestions": { ru: "Предложения", sgh: "Muslat", tj: "Пешниҳодҳо" },
  "dict.tajik": { ru: "Тадж.", sgh: "Toj", tj: "Тоҷ." },

  // ── Learn page ──────────────────────────────────────────────────
  "learn.title": { ru: "Выберите категорию", sgh: "Kategoriya zet", tj: "Категорияро интихоб кунед" },
  "learn.subtitle": { ru: "Проверьте свои знания", sgh: "Xu famchin chiset", tj: "Дониши худро санҷед" },
  "learn.words": { ru: "слов", sgh: "kalimā", tj: "калима" },
  "learn.match": { ru: "Матч", sgh: "Monande", tj: "Мувофиқат" },
  "learn.test": { ru: "Тест", sgh: "Imtihun", tj: "Санҷиш" },
  "learn.fewWords": { ru: "мало слов", sgh: "Kam kalimā", tj: "калимаи кам" },
  "learn.lvl": { ru: "Ур.", sgh: "Uroven", tj: "Сатҳ." },
  "learn.back": { ru: "Назад", sgh: "Tar zibo", tj: "Бозгашт" },
  "learn.whatMeans": { ru: "Что означает?", sgh: "De mane chiz?", tj: "Чӣ маъно дорад?" },
  "learn.finish": { ru: "Завершить", sgh: "Tayor", tj: "Хатм кунед" },
  "learn.next": { ru: "Далее", sgh: "Iga", tj: "Баъдӣ" },
  "learn.correct": { ru: "правильно", sgh: "Rost", tj: "дуруст" },
  "learn.xpEarned": { ru: "Получено XP", sgh: "Zokhchin XP", tj: "XP гирифта шуд" },
  "learn.newLevel": { ru: "Новый уровень!", sgh: "Naw maqům!", tj: "Сатҳи нав!" },
  "learn.newCategories": { ru: "Открыты новые категории:", sgh: "Naw soxt yet sut:", tj: "Категорияҳои нав кушода шуданд:" },
  "learn.newBadges": { ru: "Новые значки:", sgh: "Naw niẋůnen:", tj: "Нишонаҳои нав:" },
  "learn.categories": { ru: "Категории", sgh: "Namud", tj: "Категорияҳо" },
  "learn.retry": { ru: "Ещё раз", sgh: "Ipithga", tj: "Бори дигар" },
  "learn.round": { ru: "Раунд", sgh: "Raund", tj: "Давра" },
  "learn.matchInstruction": { ru: "Нажмите слово слева, затем его перевод справа", sgh: "Kalimāte az chap žaget, bād we tarjimā az xez", tj: "Калимаи чапро пахш кунед, сипас тарҷумаи ростро" },
  "learn.pairs": { ru: "пар", sgh: "Juft", tj: "ҷуфт" },

  // ── Add page ────────────────────────────────────────────────────
  "add.addWord": { ru: "Добавить слово", sgh: "Kalimā jamet", tj: "Илова кардани калима" },
  "add.reviewWords": { ru: "Проверить слова", sgh: "Kalimaen rostê chiẋto", tj: "Баррасии калимаҳо" },
  "add.addSubtitle": { ru: "Поделитесь словом, которое вы знаете", sgh: "Arčidom kalimā ca fāmet nivišet", tj: "Калимаеро, ки медонед, мубодила кунед" },
  "add.reviewSubtitle": { ru: "Помогите сообществу проверить новые слова", sgh: "Jamoatard yordam kinet naw kalimāen čiẋto", tj: "Ба ҷомеа дар санҷидани калимаҳои нав кӯмак кунед" },
  "add.tabAdd": { ru: "Добавить", sgh: "Naw", tj: "Илова" },
  "add.tabReview": { ru: "Проверить", sgh: "Čiẋto", tj: "Баррасӣ" },
  "add.pamiriLatin": { ru: "Памирский (латиница)", sgh: "Памирский (латиница)", tj: "Помирӣ (лотинӣ)" },
  "add.pamiriCyrillic": { ru: "Памирский (кириллица)", sgh: "Памирский (кириллица)", tj: "Помирӣ (кириллӣ)" },
  "add.english": { ru: "Английский", sgh: "Anglise", tj: "Англисӣ" },
  "add.russian": { ru: "Русский", sgh: "Ruse", tj: "Русӣ" },
  "add.tajik": { ru: "Таджикский", sgh: "Tojike", tj: "Тоҷикӣ" },
  "add.category": { ru: "Категория", sgh: "Kategoriya", tj: "Категория" },
  "add.selectCategory": { ru: "Выберите категорию", sgh: "Kategoriya zet", tj: "Категорияро интихоб кунед" },
  "add.preview": { ru: "Предпросмотр", sgh: "Pero Čiẋto", tj: "Пешнамоиш" },
  "add.submit": { ru: "Отправить (+50 XP)", sgh: "Bēkhto (+50 XP)", tj: "Фиристодан (+50 XP)" },
  "add.thanks": { ru: "Спасибо!", sgh: "Quluɣ!", tj: "Ташаккур!" },
  "add.sentForReview": { ru: "Ваше слово отправлено на проверку сообществу", sgh: "Tamā kalimāta jamoat proverka kiẋt", tj: "Калимаи шумо барои баррасии ҷомеа фиристода шуд" },
  "add.error": { ru: "Что-то пошло не так", sgh: "Archizca xato sut", tj: "Чизе хато рафт" },
  "add.noWordsToReview": { ru: "Нет слов для проверки", sgh: "Kalimā nist", tj: "Калимае барои баррасӣ нест" },
  "add.comeBackLater": { ru: "Пока никто не добавил новых слов. Вернитесь позже!", sgh: "Gali ichāy kalimā nanivišč. Taredira vo yadet!", tj: "Ҳоло ҳеҷ кас калимаи нав илова накардааст. Баъдтар баргардед!" },
  "add.allReviewed": { ru: "Всё проверено!", sgh: "Fukaϑ čuẋčin!", tj: "Ҳама баррасӣ шуд!" },
  "add.wordsWaiting": { ru: "слов ждут проверки", sgh: "Kalimāta čisen", tj: "калима интизор аст" },
  "add.isCorrect": { ru: "Это слово верное на памирском языке?", sgh: "Ik yam kalimā pomerite rosto?", tj: "Оё ин калима дар забони помирӣ дуруст аст?" },
  "add.incorrect": { ru: "Неверно", sgh: "Ɣalat", tj: "Нодуруст" },
  "add.correct": { ru: "Верно", sgh: "Rost", tj: "Дуруст" },
  "add.xpPerReview": { ru: "+5 XP за каждое проверенное слово", sgh: "+5 XP arčidom kalimā ca nivišet", tj: "+5 XP барои ҳар калимаи баррасишуда" },
  "add.xpEarned": { ru: "XP заработано", sgh: "XP jam čud", tj: "XP гирифта шуд" },
  "add.voteRecorded": { ru: "Голос записан! У слова теперь {n} голосов", sgh: "Tama awoz qabul sut! Me kalimāyand šič {n} awoz!", tj: "Овоз сабт шуд! Ҳоло калима {n} овоз дорад" },
  "add.sessionSummary": { ru: "Вы проверили {x} слов. {y} из них близки к одобрению!", sgh: "Tamet {x} kalimā cuẋt. {y} qarib sic qabul chidard!", tj: "Шумо {x} калима баррасӣ кардед. {y} аз онҳо ба тасдиқ наздиканд!" },
  "add.markReady": { ru: "Добавить в словарь", sgh: "Ar luɣat patewdo", tj: "Ба луғат илова кунед" },

  // ── Profile page ────────────────────────────────────────────────
  "profile.level": { ru: "Уровень", sgh: "Uroven", tj: "Сатҳ" },
  "profile.moderator": { ru: "Модератор", sgh: "Moderator", tj: "Модератор" },
  "profile.totalXp": { ru: "Всего XP", sgh: "Hama XP", tj: "Ҳамаи XP" },
  "profile.streak": { ru: "Серия", sgh: "Pes yakdigarath", tj: "Силсила" },
  "profile.maxStreak": { ru: "Макс. серия", sgh: "Sar daroz", tj: "Ҳадди аксар. силсила" },
  "profile.learned": { ru: "Изучено", sgh: "Kheyjen", tj: "Омӯхта шуд" },
  "profile.contributed": { ru: "Добавлено", sgh: "Yast", tj: "Илова карда шуд" },
  "profile.rank": { ru: "Ранг", sgh: "Zurê", tj: "Рутба" },
  "profile.badges": { ru: "Значки", sgh: "Značoken", tj: "Нишонаҳо" },
  "profile.script": { ru: "Памирское письмо", sgh: "Khati Pamiri", tj: "Хати помирӣ" },
  "profile.latin": { ru: "Латиница", sgh: "Latincê", tj: "Лотинӣ" },
  "profile.cyrillic": { ru: "Кириллица", sgh: "Kirilcê", tj: "Кириллӣ" },
  "profile.recentActions": { ru: "Последние действия", sgh: "Korhoi Oxar", tj: "Амалҳои охирин" },
  "profile.logout": { ru: "Выйти", sgh: "Nakhtidō", tj: "Баромадан" },

  // ── Ranks page ──────────────────────────────────────────────────
  "ranks.title": { ru: "Лучшие ученики", sgh: "Sarvari Kheyjenon", tj: "Беҳтарин донишҷӯён" },
  "ranks.subtitle": { ru: "Таблица лидеров", sgh: "Jadwali Peshgamon", tj: "Ҷадвали пешсафон" },
  "ranks.noParticipants": { ru: "Пока нет участников", sgh: "Hali Ishtirokchinest", tj: "Ҳоло иштирокчие нест" },
  "ranks.you": { ru: "(вы)", sgh: "(Wuz)", tj: "(шумо)" },
  "ranks.level": { ru: "Уровень", sgh: "Uroven", tj: "Сатҳ" },
  "ranks.days": { ru: "дн.", sgh: "ruz", tj: "рӯз" },

  // ── Language toggle ─────────────────────────────────────────────
  "lang.ru": { ru: "РУ", sgh: "RU", tj: "РУ" },
  "lang.sgh": { ru: "ШУГ", sgh: "SHU", tj: "ШУГ" },
  "lang.tj": { ru: "ТОҶ", sgh: "TOJ", tj: "ТОҶ" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: UILanguage): string {
  const entry = translations[key];
  if (!entry) return key;
  return (entry as Record<string, string>)[lang] || entry.ru;
}
