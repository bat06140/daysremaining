export type AppLocale = "fr" | "en";

const INTL_LOCALES: Record<AppLocale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

const MONDAY_REFERENCE = new Date(Date.UTC(2024, 0, 1, 12));

const stripTrailingPunctuation = (value: string) =>
  value.replace(/\./g, "").trim();

export const getLocaleFromLanguage = (
  language?: string | null
): AppLocale => (language?.toLowerCase().startsWith("fr") ? "fr" : "en");

export const getBrowserLocale = (): AppLocale => {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return getLocaleFromLanguage(navigator.language);
};

const formatWithLocale = (
  locale: AppLocale,
  date: Date,
  options: Intl.DateTimeFormatOptions,
  useUtc = false
) => {
  const formatterOptions = useUtc
    ? { ...options, timeZone: "UTC" }
    : options;

  return new Intl.DateTimeFormat(
    INTL_LOCALES[locale],
    formatterOptions
  ).format(date);
};

export const getCalendarWeekdayLabels = (locale: AppLocale) =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(MONDAY_REFERENCE);
    date.setUTCDate(MONDAY_REFERENCE.getUTCDate() + index);

    return stripTrailingPunctuation(
      formatWithLocale(locale, date, { weekday: "short" }, true)
    ).toUpperCase();
  });

export const getCalendarMonthLabels = (locale: AppLocale) =>
  Array.from({ length: 12 }, (_, index) =>
    stripTrailingPunctuation(
      formatWithLocale(
        locale,
        new Date(Date.UTC(2024, index, 1, 12)),
        { month: "long" },
        true
      )
    ).toLowerCase()
  );

export const formatClockMonthLabel = (date: Date, locale: AppLocale) =>
  stripTrailingPunctuation(
    formatWithLocale(locale, date, { month: "short" })
  ).toUpperCase();

const TRANSLATIONS = {
  fr: {
    widgetOptions: {
      calendar: "Calendrier",
      daysRemaining: "J-",
      clock: "Horloge",
    },
    showcase: {
      eyebrow: "Aperçu widgets",
      title: "Trois panneaux, tous configurables",
      description:
        "Glisse les séparateurs pour redimensionner la grille. Chaque panneau peut afficher n’importe lequel des trois widgets.",
      selectAriaLabel: "Choisir le widget affiché dans ce panneau",
      resizeColumnsAriaLabel:
        "Redimensionner les panneaux gauche et droit de l’aperçu",
      resizeRowsAriaLabel:
        "Redimensionner les panneaux haut et bas de la colonne de droite",
    },
    popover: {
      closeAriaLabel: "Fermer la fenêtre",
    },
    themeEditor: {
      unlockAriaLabel: "Débloquer la personnalisation premium du thème",
      openAriaLabel: "Personnaliser les couleurs du widget",
      backAriaLabel: "Retour à la liste des couleurs",
      closeAriaLabel: "Fermer l’éditeur de thème",
      title: "Choisir une couleur",
      instructions:
        "Choisis une couleur pour ouvrir son panneau d’édition.",
      color1: "Couleur 1",
      color2: "Couleur 2",
      pickerSummary: "Couleur · Teinte · Opacité",
      pickerColorLabel: "Couleur",
      pickerHueLabel: "Teinte",
      pickerOpacityLabel: "Opacité",
      cancel: "Annuler",
      save: "Valider",
    },
  },
  en: {
    widgetOptions: {
      calendar: "Calendar",
      daysRemaining: "J-",
      clock: "Clock",
    },
    showcase: {
      eyebrow: "Widget showcase",
      title: "Three panels, all configurable",
      description:
        "Drag the separators to resize the grid. Each panel can display any of the three widgets.",
      selectAriaLabel: "Choose the widget shown in this panel",
      resizeColumnsAriaLabel: "Resize the left and right showcase panels",
      resizeRowsAriaLabel:
        "Resize the top and bottom panels on the right",
    },
    popover: {
      closeAriaLabel: "Close popover",
    },
    themeEditor: {
      unlockAriaLabel: "Unlock premium theme customization",
      openAriaLabel: "Customize widget colors",
      backAriaLabel: "Back to color list",
      closeAriaLabel: "Close theme editor",
      title: "Choose a color",
      instructions: "Choose a color to open its editing panel.",
      color1: "Color 1",
      color2: "Color 2",
      pickerSummary: "Color · Hue · Opacity",
      pickerColorLabel: "Color",
      pickerHueLabel: "Hue",
      pickerOpacityLabel: "Opacity",
      cancel: "Cancel",
      save: "Apply",
    },
  },
} as const;

export const getTranslationSet = (locale: AppLocale) => TRANSLATIONS[locale];
