// The laws of UX as a reference inside the tool. Source: lawsofux.com (Jon Yablonski).
// The same rules with project-specific notes: docs/UX_LAWS.md (codes UX-01…UX-30 match).

export type UxLawGroup = { id: string; title: string; lede: string };

export const UX_LAW_GROUPS: UxLawGroup[] = [
  { id: "familiar", title: "Привычность", lede: "Люди приходят со своим опытом — интерфейс должен ему соответствовать." },
  { id: "choice", title: "Выбор и решения", lede: "Меньше вариантов и меньше лишней сложности — быстрее и увереннее решение." },
  { id: "memory", title: "Память и внимание", lede: "Внимание и рабочая память ограничены — не тратьте их на интерфейс." },
  { id: "gestalt", title: "Восприятие (гештальт)", lede: "Как глаз группирует элементы: по близости, рамкам, сходству и связям." },
  { id: "motion", title: "Цели и точность", lede: "Как быстро человек попадает в цель, доходит до конца и сохраняет темп." },
  { id: "quality", title: "Ожидания и качество", lede: "Что определяет впечатление и доверие к продукту." },
];

export type UxLaw = {
  code: string;
  name: string;
  original: string;
  group: UxLawGroup["id"];
  /** What the law says, in one or two sentences. */
  essence: string;
  /** A question to ask of a screen or flow. */
  check: string;
  /** Page on lawsofux.com. */
  slug: string;
};

export const UX_LAWS: UxLaw[] = [
  { code: "UX-01", name: "Закон Якоба", original: "Jakob's Law", group: "familiar", slug: "jakobs-law",
    essence: "Большую часть времени люди проводят на других сайтах и ждут, что ваш работает так же.",
    check: "Есть ли своё поведение там, где у всех одинаковое: иконки, клавиши, порядок кнопок?" },
  { code: "UX-02", name: "Ментальная модель", original: "Mental Model", group: "familiar", slug: "mental-model",
    essence: "Человек действует по своей картине системы; интерфейс, который ей соответствует, понятен без объяснений.",
    check: "Сможет ли новичок сказать, где он в процессе и что дальше?" },
  { code: "UX-03", name: "Парадокс активного пользователя", original: "Paradox of the Active User", group: "familiar", slug: "paradox-of-the-active-user",
    essence: "Инструкции не читают — сразу начинают пользоваться. Помощь нужна в месте действия.",
    check: "Говорит ли пустое состояние, что сюда положить и какой кнопкой?" },

  { code: "UX-04", name: "Закон Хика", original: "Hick's Law", group: "choice", slug: "hicks-law",
    essence: "Время решения растёт с числом и сложностью вариантов.",
    check: "Сколько вариантов в этой точке решения? Больше 7 — сгруппировать или спрятать редкие." },
  { code: "UX-05", name: "Перегрузка выбором", original: "Choice Overload", group: "choice", slug: "choice-overload",
    essence: "Слишком много вариантов парализует и снижает удовлетворённость выбором.",
    check: "Есть ли рекомендованный вариант или значение по умолчанию?" },
  { code: "UX-06", name: "Бритва Оккама", original: "Occam's Razor", group: "choice", slug: "occams-razor",
    essence: "Из равных решений выбирайте самое простое; лишние элементы — лишняя сложность.",
    check: "Что сломается, если убрать этот элемент?" },
  { code: "UX-07", name: "Закон Теслера", original: "Tesler's Law", group: "choice", slug: "teslers-law",
    essence: "Сложность нельзя убрать, только перенести — пусть её несёт система, а не пользователь.",
    check: "Просим ли мы ввести то, что система уже знает или может вычислить?" },
  { code: "UX-08", name: "Когнитивное искажение", original: "Cognitive Bias", group: "choice", slug: "cognitive-bias",
    essence: "Систематические ошибки мышления влияют на решения — и пользователей, и команды.",
    check: "Можно ли проследить этот вывод до исходных данных? Сколько людей его подтверждают?" },

  { code: "UX-09", name: "Когнитивная нагрузка", original: "Cognitive Load", group: "memory", slug: "cognitive-load",
    essence: "Умственные ресурсы на работу с интерфейсом ограничены; всё лишнее их съедает.",
    check: "Если прищуриться — видно ли первым заголовок и главное действие?" },
  { code: "UX-10", name: "Закон Миллера", original: "Miller's Law", group: "memory", slug: "millers-law",
    essence: "В рабочей памяти помещается около 7 ± 2 элементов. Это про запоминание, а не про длину меню.",
    check: "Нужно ли помнить что-то с предыдущего экрана?" },
  { code: "UX-11", name: "Рабочая память", original: "Working Memory", group: "memory", slug: "working-memory",
    essence: "Временное хранилище для текущей задачи — маленькое и быстро стирается.",
    check: "Видно ли то, с чем связываем или сравниваем, прямо в момент действия?" },
  { code: "UX-12", name: "Разбиение на части", original: "Chunking", group: "memory", slug: "chunking",
    essence: "Информацию, сгруппированную в осмысленные блоки, легче воспринимать и запоминать.",
    check: "Есть ли «простыни» из 7+ однородных полей или абзацев без заголовка?" },
  { code: "UX-13", name: "Избирательное внимание", original: "Selective Attention", group: "memory", slug: "selective-attention",
    essence: "Люди видят то, что связано с их целью, и пропускают остальное — особенно похожее на рекламу.",
    check: "Стоит ли предупреждение там, куда смотрят в момент действия?" },
  { code: "UX-14", name: "Эффект последовательной позиции", original: "Serial Position Effect", group: "memory", slug: "serial-position-effect",
    essence: "Лучше запоминаются первые и последние элементы ряда.",
    check: "Не спрятано ли главное в середине длинного списка?" },
  { code: "UX-15", name: "Эффект фон Ресторфф", original: "Von Restorff Effect", group: "memory", slug: "von-restorff-effect",
    essence: "Из ряда похожих запоминается отличающийся — выделяйте только главное.",
    check: "Сколько залитых кнопок видно одновременно? Цвет продублирован формой или текстом?" },

  { code: "UX-16", name: "Закон близости", original: "Law of Proximity", group: "gestalt", slug: "law-of-proximity",
    essence: "Близко расположенное воспринимается как связанное.",
    check: "Отступ внутри группы заметно меньше, чем между группами?" },
  { code: "UX-17", name: "Закон общей области", original: "Law of Common Region", group: "gestalt", slug: "law-of-common-region",
    essence: "Элементы внутри общей рамки или фона воспринимаются как группа.",
    check: "Каждая рамка объединяет элементы одного смысла? Вложенность не глубже двух уровней?" },
  { code: "UX-18", name: "Закон сходства", original: "Law of Similarity", group: "gestalt", slug: "law-of-similarity",
    essence: "Похожие элементы воспринимаются как однотипные.",
    check: "Нет ли элементов, похожих на кликабельные, но не кликабельных, — и наоборот?" },
  { code: "UX-19", name: "Закон единой связанности", original: "Law of Uniform Connectedness", group: "gestalt", slug: "law-of-uniform-connectedness",
    essence: "Соединённые линией или общим фоном элементы связаны сильнее, чем просто близкие.",
    check: "Важная связь показана соединением, а не только соседством?" },
  { code: "UX-20", name: "Закон Прегнанца", original: "Law of Prägnanz", group: "gestalt", slug: "law-of-pragnanz",
    essence: "Сложное изображение воспринимается в самой простой форме.",
    check: "Узнают ли иконку без подписи за секунду? Если нет — добавить подпись." },

  { code: "UX-21", name: "Закон Фиттса", original: "Fitts's Law", group: "motion", slug: "fittss-law",
    essence: "Время попадания в цель зависит от расстояния до неё и её размера.",
    check: "Цели не меньше 24 px на десктопе и 44 px на касание? Опасное действие не вплотную к частому?" },
  { code: "UX-22", name: "Эффект градиента цели", original: "Goal-Gradient Effect", group: "motion", slug: "goal-gradient-effect",
    essence: "Чем ближе цель, тем быстрее к ней движутся — покажите прогресс.",
    check: "Виден ли прогресс и следующий шаг в многошаговом процессе?" },
  { code: "UX-23", name: "Эффект Зейгарник", original: "Zeigarnik Effect", group: "motion", slug: "zeigarnik-effect",
    essence: "Незавершённое помнится лучше завершённого.",
    check: "Вернувшись, человек сразу видит, что не доделал?" },
  { code: "UX-24", name: "Порог Доэрти", original: "Doherty Threshold", group: "motion", slug: "doherty-threshold",
    essence: "Продуктивность резко растёт, когда система отвечает быстрее ~400 мс.",
    check: "Есть ли действия без видимой реакции в первые 400 мс?" },
  { code: "UX-25", name: "Поток", original: "Flow", group: "motion", slug: "flow",
    essence: "Полная погружённость: задача по силам, цель ясна, обратная связь мгновенная.",
    check: "Делается ли основной рабочий цикл без переключения экранов и лишних подтверждений?" },

  { code: "UX-26", name: "Эффект эстетики-удобства", original: "Aesthetic-Usability Effect", group: "quality", slug: "aesthetic-usability-effect",
    essence: "Красивый интерфейс кажется удобнее, и ему прощают больше — но проблемы он не отменяет.",
    check: "Нет ли «почти одинаковых» отступов, шрифтов и оттенков?" },
  { code: "UX-27", name: "Правило пика и конца", original: "Peak-End Rule", group: "quality", slug: "peak-end-rule",
    essence: "Опыт оценивают по самому яркому моменту и по концу.",
    check: "Что человек видит в конце сценария — успех и следующий шаг или тупик?" },
  { code: "UX-28", name: "Закон Постела", original: "Postel's Law", group: "quality", slug: "postels-law",
    essence: "Будьте терпимы к тому, что принимаете, и строги к тому, что отдаёте.",
    check: "Примет ли поле пробелы по краям, другой регистр, ссылку без https://?" },
  { code: "UX-29", name: "Принцип Парето", original: "Pareto Principle", group: "quality", slug: "pareto-principle",
    essence: "Примерно 80% результата дают 20% причин — улучшайте самые частые сценарии.",
    check: "Это улучшение касается частого сценария или редкого?" },
  { code: "UX-30", name: "Закон Паркинсона", original: "Parkinson's Law", group: "quality", slug: "parkinsons-law",
    essence: "Задача занимает всё отведённое ей время — сокращайте путь до результата.",
    check: "Можно ли сократить число шагов от намерения до результата?" },
];

export const uxLawUrl = (law: UxLaw) => `https://lawsofux.com/${law.slug}/`;
