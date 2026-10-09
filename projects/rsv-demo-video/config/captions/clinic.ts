import type { Captions } from "../video";

// Every word in the clinic ad, Arabic first. Nothing here claims more than the footage shows.
export const clinicCaptions: Captions = {
  intro: {
    lines: [
      { ar: "كل استفسار له رد.", en: "Every inquiry answered." },
      { ar: "وكل مريض له متابعة.", en: "Every patient followed up." },
    ],
    sub: { ar: "لوحة متابعة لعيادتك", en: "A lead dashboard for your clinic" },
  },
  lines: {
    overview: {
      kicker: { ar: "لوحة المتابعة", en: "Your dashboard" },
      text: { ar: "كل استفسارات عيادتك في مكان واحد", en: "Every inquiry your clinic gets, in one place" },
    },
    search: { text: { ar: "ابحث عن أي مريض في ثانية", en: "Find any patient in a second" } },
    telegram: {
      kicker: { ar: "تيليجرام", en: "Telegram" },
      text: { ar: "رسالة جديدة؟ تصل إلى قائمتك", en: "A new message lands in your list" },
    },
    add: { text: { ar: "أو أضف الاستفسار بنفسك في ثوانٍ", en: "Or add one yourself in seconds" } },
    record: { text: { ar: "كل مريض: بياناته، ملاحظاته، وكل خطوة معه", en: "Every patient: details, notes, every step" } },
    draft: {
      kicker: { ar: "راصد", en: "Rasid" },
      text: { ar: "راصد يكتب لك رسالة المتابعة", en: "Rasid writes the follow-up for you" },
    },
    board: { text: { ar: "اسحب المريض من مرحلة إلى أخرى", en: "Drag patients from stage to stage" } },
    ask: {
      kicker: { ar: "راصد", en: "Rasid" },
      text: { ar: "واسأله: بمن نتصل أولاً؟", en: "Ask it who to call first" },
    },
    language: { text: { ar: "بالعربية والإنجليزية", en: "In Arabic and English" } },
    report: {
      kicker: { ar: "التقرير الشهري", en: "Monthly report" },
      text: { ar: "وتقرير كل شهر عن أداء فريقك", en: "And a report every month on how your team did" },
    },
    phone: { text: { ar: "وعلى هاتفك أيضاً", en: "And on your phone" } },
    phoneMove: { text: { ar: "افتح، حدّث، وتابع من أي مكان", en: "Open, update and follow up from anywhere" } },
  },
  telegram: { label: { ar: "تيليجرام", en: "Telegram" }, now: { ar: "الآن", en: "now" } },
  end: {
    title: { ar: "كل استفسار له رد.", en: "Every inquiry answered." },
    sub: { ar: "نجهّز لوحتك ونديرها لك، بالعربية والإنجليزية", en: "We set it up and run it for you, in Arabic and English" },
    cta: { ar: "اطلب عرضاً تجريبياً على واتساب", en: "Book a demo on WhatsApp" },
    contact: "+44 7434 630786",
    brand: "RSV Studio",
  },
};
