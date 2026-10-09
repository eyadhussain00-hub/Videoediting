import type { FootageSource } from "./types";

// The clinic demo. The patients here are the dashboard's starting state for every take; they are chosen
// so each part of the story has something to show: a no-show and an unanswered inquiry for the assistant
// to flag, cards in every column of the board, and a mix of sources.
export const clinic: FootageSource = {
  key: "clinic",
  sector: "clinic",
  business: {
    id: "demo-clinic-video",
    name: "Nile Smile Dental",
    // Teal: Nile Smile's own accent, and the colour of the clinic door on the site.
    accent: "#0E7490",
    // Scale, so the monthly report shows everything it can: per-person figures and the six-month trend.
    plan: "Scale",
    city: "Zamalek, Cairo",
  },
  theme: "light",
  locales: ["ar", "en"],
  moveTo: ["contacted", "booked"],
  search: { en: "Karim", ar: "كريم" },
  note: {
    en: "Called her. She wants Thursday evening, 7pm if possible.",
    ar: "تم الاتصال بها. تريد موعداً مساء الخميس، الساعة 7 إن أمكن.",
  },
  holdMs: { load: 1200, search: 1000, arrive: 1400, add: 1200, open: 1400, draft: 2500, move: 1000, ask: 3000, language: 1600, report: 1500 },
  viewports: {
    desktop: {
      width: 1440, height: 900, scale: 1, mobile: false,
      beats: ["load", "search", "arrive", "add", "open", "draft", "move", "ask", "language", "report"],
    },
    mobile: { width: 390, height: 844, scale: 2, mobile: true, beats: ["load", "arrive", "open", "move"] },
  },
  arrival: {
    firstName: { en: "Yasmin", ar: "ياسمين" },
    lastName: { en: "Adel", ar: "عادل" },
    username: "yasmin_adel",
    text: {
      en: "Hi! Do you have an evening slot this week for teeth whitening?",
      ar: "مرحباً، هل لديكم موعد مسائي هذا الأسبوع لتبييض الأسنان؟",
    },
  },
  manual: {
    name: { en: "Mona Sabry", ar: "منى صبري" },
    phone: "010 4471 2290",
    subject: "Braces consult",
    source: "Walk-in",
    value: 28000,
  },
  // Five past months, so the monthly report has a trend, sources and a team to show. Last month is the
  // busiest, the way a clinic that started using the dashboard would hope to look.
  history: {
    perMonth: [7, 9, 10, 12, 14],
    wonShare: 0.5,
    // Replies getting faster month on month: the story of a clinic that started working its leads.
    replyMinutes: [48, 36, 27, 19, 11],
    seed: 20260919,
    names: [
      { en: "Laila Hegazy", ar: "ليلى حجازي" }, { en: "Sherif Ragab", ar: "شريف رجب" }, { en: "Farida Halim", ar: "فريدة حليم" },
      { en: "Hazem Darwish", ar: "حازم درويش" }, { en: "Yasmin Bakr", ar: "ياسمين بكر" }, { en: "Amr Shafik", ar: "عمرو شفيق" },
      { en: "Nada Sorour", ar: "ندى سرور" }, { en: "Khaled Gaber", ar: "خالد جابر" }, { en: "Injy Mansour", ar: "إنجي منصور" },
      { en: "Sami Lotfy", ar: "سامي لطفي" }, { en: "Mona Kamal", ar: "منى كمال" }, { en: "Omar Zaki", ar: "عمر زكي" },
      { en: "Heba Rashad", ar: "هبة رشاد" }, { en: "Tarek Nasr", ar: "طارق نصر" }, { en: "Dina Fouad", ar: "دينا فؤاد" },
      { en: "Mostafa Adel", ar: "مصطفى عادل" }, { en: "Salma Hassan", ar: "سلمى حسن" }, { en: "Bassem Halim", ar: "باسم حليم" },
    ],
    owners: [
      { en: "Mostafa H.", ar: "مصطفى ح." }, { en: "Injy K.", ar: "إنجي ك." },
      { en: "Sherif A.", ar: "شريف أ." }, { en: "Rania M.", ar: "رانيا م." },
    ],
  },
  leads: [
    {
      name: { en: "Nourhan Adel", ar: "نورهان عادل" },
      phone: "010 2345 6781", stage: "noshow", subject: "Implant consult", source: "WhatsApp", value: 18000,
      owner: { en: "Mostafa H.", ar: "مصطفى ح." },
      note: { en: "Missed Tuesday's consult, wants to rebook.", ar: "فاتها موعد الثلاثاء، وتريد حجزاً جديداً." },
      createdDaysAgo: 6, lastContactDaysAgo: 1, nextActionInDays: null, firstResponseMins: 12,
    },
    {
      name: { en: "Karim Fouad", ar: "كريم فؤاد" },
      phone: "011 4820 1935", stage: "new", subject: "Veneers", source: "Instagram", value: 24000,
      owner: null,
      note: { en: "Asked about veneer prices.", ar: "سأل عن أسعار الفينير." },
      createdDaysAgo: 3, lastContactDaysAgo: 3, nextActionInDays: null, firstResponseMins: null,
    },
    {
      name: { en: "Omar Halim", ar: "عمر حليم" },
      phone: "012 7713 0422", stage: "booked", subject: "Wisdom tooth", source: "Google", value: 3500,
      owner: { en: "Injy K.", ar: "إنجي ك." },
      note: { en: "Booked for Thursday at 6.", ar: "محجوز يوم الخميس الساعة 6." },
      createdDaysAgo: 5, lastContactDaysAgo: 1, nextActionInDays: 2, firstResponseMins: 18,
    },
    {
      name: { en: "Rania Fouad", ar: "رانيا فؤاد" },
      phone: "010 9981 2240", stage: "contacted", subject: "Root canal", source: "Facebook", value: 6000,
      owner: { en: "Sherif A.", ar: "شريف أ." },
      note: { en: "Waiting on her X-ray before booking.", ar: "تنتظر الأشعة قبل الحجز." },
      createdDaysAgo: 4, lastContactDaysAgo: 2, nextActionInDays: 1, firstResponseMins: 25,
    },
    {
      name: { en: "Heba Mansour", ar: "هبة منصور" },
      phone: "015 3302 8817", stage: "attended", subject: "Teeth whitening", source: "Referral", value: 4500,
      owner: { en: "Rania M.", ar: "رانيا م." },
      note: { en: "Happy with the result, referred a friend.", ar: "سعيدة بالنتيجة، ورشّحت صديقة." },
      createdDaysAgo: 12, lastContactDaysAgo: 2, nextActionInDays: null, firstResponseMins: 9,
    },
    {
      name: { en: "Tarek Sabry", ar: "طارق صبري" },
      phone: "011 6624 9051", stage: "contacted", subject: "Braces consult", source: "WhatsApp", value: 30000,
      owner: { en: "Mostafa H.", ar: "مصطفى ح." },
      note: { en: "Comparing two clinics before deciding.", ar: "يقارن بين عيادتين قبل أن يقرر." },
      createdDaysAgo: 10, lastContactDaysAgo: 8, nextActionInDays: null, firstResponseMins: 40,
    },
    {
      name: { en: "Salma Kamal", ar: "سلمى كمال" },
      phone: "012 5540 7718", stage: "booked", subject: "Routine cleaning", source: "Walk-in", value: 1200,
      owner: { en: "Injy K.", ar: "إنجي ك." },
      note: { en: "Wants a reminder the day before.", ar: "تريد تذكيراً قبل الموعد بيوم." },
      createdDaysAgo: 3, lastContactDaysAgo: 1, nextActionInDays: 1, firstResponseMins: 6,
    },
    {
      name: { en: "Dina Zaki", ar: "دينا زكي" },
      phone: "010 1187 6630", stage: "attended", subject: "Crown fitting", source: "Instagram", value: 9000,
      owner: { en: "Sherif A.", ar: "شريف أ." },
      note: null,
      createdDaysAgo: 15, lastContactDaysAgo: 4, nextActionInDays: null, firstResponseMins: 14,
    },
    {
      name: { en: "Ahmed Rashad", ar: "أحمد رشاد" },
      phone: "015 9024 3316", stage: "new", subject: "Child check-up", source: "WhatsApp", value: 800,
      owner: null,
      note: { en: "Asked if Saturday mornings are open.", ar: "سأل إن كانت صباحات السبت متاحة." },
      createdDaysAgo: 0, lastContactDaysAgo: 0, nextActionInDays: null, firstResponseMins: null,
    },
    {
      name: { en: "Mai Lotfy", ar: "مي لطفي" },
      phone: "011 2203 5589", stage: "lost", subject: "Gum treatment", source: "Facebook", value: 5000,
      owner: { en: "Rania M.", ar: "رانيا م." },
      note: { en: "Went with a clinic closer to home.", ar: "اختارت عيادة أقرب إلى منزلها." },
      createdDaysAgo: 20, lastContactDaysAgo: 9, nextActionInDays: null, firstResponseMins: 30,
    },
    {
      name: { en: "Bassem Nasr", ar: "باسم نصر" },
      phone: "012 8876 1204", stage: "booked", subject: "Implant consult", source: "Referral", value: 22000,
      owner: { en: "Mostafa H.", ar: "مصطفى ح." },
      note: { en: "Consult booked, bringing his old X-rays.", ar: "الاستشارة محجوزة، وسيحضر أشعته القديمة." },
      createdDaysAgo: 7, lastContactDaysAgo: 2, nextActionInDays: 3, firstResponseMins: 21,
    },
  ],
};
