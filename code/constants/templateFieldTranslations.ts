/**
 * Translation mappings for machine template field labels, placeholders, and select options.
 * These values come from the database (admin-defined) in French and need client-side translation.
 */

import type { Language } from './serviceTypes';

// ─── Field Labels ────────────────────────────────────────────
// Maps French field labels AND English field names (DB keys) to Arabic equivalents
const fieldLabelTranslations: Record<string, string> = {
  // ── English DB field names (stored as customFields keys) ──
  'YEAR': 'السنة',
  'year': 'السنة',
  'BRAND': 'العلامة التجارية',
  'brand': 'العلامة التجارية',
  'MODEL': 'الموديل',
  'model': 'الموديل',
  'FEATURES': 'الخصائص',
  'features': 'الخصائص',
  'CONDITION': 'الحالة',
  'POWER': 'القوة',
  'power': 'القوة',
  'POWER_HP': 'القوة (حصان)',
  'HORSEPOWER': 'القوة (حصان)',
  'horsepower': 'القوة (حصان)',
  'ENGINE': 'المحرك',
  'engine': 'المحرك',
  'FUEL': 'الوقود',
  'fuel': 'الوقود',
  'FUEL_TYPE': 'نوع الوقود',
  'TRANSMISSION': 'ناقل الحركة',
  'WIDTH': 'العرض',
  'width': 'العرض',
  'WORKING_WIDTH': 'عرض العمل',
  'DEPTH': 'العمق',
  'depth': 'العمق',
  'HEIGHT': 'الارتفاع',
  'height': 'الارتفاع',
  'LENGTH': 'الطول',
  'length': 'الطول',
  'WEIGHT': 'الوزن',
  'weight': 'الوزن',
  'WEIGHT_KG': 'الوزن (كجم)',
  'CAPACITY': 'السعة',
  'capacity': 'السعة',
  'VOLUME': 'الحجم',
  'volume_en': 'الحجم',
  'FLOW_RATE': 'التدفق',
  'PRESSURE': 'الضغط',
  'pressure': 'الضغط',
  'SPEED': 'السرعة',
  'speed': 'السرعة',
  'HOURS': 'ساعات العمل',
  'hours': 'ساعات العمل',
  'WORKING_HOURS': 'ساعات العمل',
  'MILEAGE': 'المسافة المقطوعة',
  'mileage': 'المسافة المقطوعة',
  'COLOR': 'اللون',
  'color': 'اللون',
  'SERIAL_NUMBER': 'الرقم التسلسلي',
  'DESCRIPTION': 'الوصف',
  'NOTES': 'ملاحظات',
  'COMMENTS': 'تعليقات',
  'ACCESSORIES': 'الملحقات',
  'accessories': 'الملحقات',
  'EQUIPMENT': 'التجهيزات',
  'equipment': 'التجهيزات',
  'DIMENSIONS': 'الأبعاد',
  'TYPE': 'النوع',
  'SIZE': 'الحجم',
  'size': 'الحجم',
  'RANGE': 'المدى',
  'range': 'المدى',
  'AUTONOMY': 'الاستقلالية',
  'autonomy': 'الاستقلالية',
  'TECHNOLOGY': 'التكنولوجيا',
  'technology': 'التكنولوجيا',
  'PAYLOAD': 'الحمولة المفيدة',
  'payload': 'الحمولة المفيدة',
  'TONNAGE': 'الحمولة',
  'tonnage': 'الحمولة',
  'NUM_DISCS': 'عدد الأقراص',
  'NUM_ROWS': 'عدد الصفوف',
  'NUM_BLADES': 'عدد الشفرات',
  'NUM_NOZZLES': 'عدد الفوهات',
  'CUTTING_BAR': 'قضيب القطع',
  'SURFACE': 'المساحة',
  'surface': 'المساحة',
  'REGISTRATION': 'التسجيل',
  'registration': 'التسجيل',

  // ── French field labels ──
  'Marque': 'العلامة التجارية',
  'marque': 'العلامة التجارية',
  'Modèle': 'الموديل',
  'modèle': 'الموديل',
  'Modele': 'الموديل',
  'modele': 'الموديل',
  'Année': 'السنة',
  'année': 'السنة',
  'Annee': 'السنة',
  'annee': 'السنة',
  'Année de fabrication': 'سنة الصنع',
  'État': 'الحالة',
  'état': 'الحالة',
  'Etat': 'الحالة',
  'etat': 'الحالة',
  'Condition': 'الحالة',
  'condition': 'الحالة',
  'Caractéristiques': 'الخصائص',
  'caractéristiques': 'الخصائص',
  'Caractéristiques supplémentaires': 'خصائص إضافية',
  'Caractéristiques techniques': 'الخصائص التقنية',
  'Description': 'الوصف',
  'description': 'الوصف',
  'Puissance': 'القوة',
  'puissance': 'القوة',
  'Puissance (CV)': 'القوة (حصان)',
  'Puissance (HP)': 'القوة (حصان)',
  'Type': 'النوع',
  'type': 'النوع',
  'Couleur': 'اللون',
  'couleur': 'اللون',
  'Capacité': 'السعة',
  'capacité': 'السعة',
  'Capacite': 'السعة',
  'Largeur de travail': 'عرض العمل',
  'largeur de travail': 'عرض العمل',
  'Largeur': 'العرض',
  'Profondeur': 'العمق',
  'Nombre de socs': 'عدد السكك',
  'Nombre de disques': 'عدد الأقراص',
  'Nombre de rangs': 'عدد الصفوف',
  'Nombre de dents': 'عدد الأسنان',
  'Nombre de corps': 'عدد الأجسام',
  'Nombre de lames': 'عدد الشفرات',
  'Nombre de buses': 'عدد الفوهات',
  'Poids': 'الوزن',
  'poids': 'الوزن',
  'Poids (kg)': 'الوزن (كجم)',
  'Heures de travail': 'ساعات العمل',
  'heures de travail': 'ساعات العمل',
  'Heures': 'الساعات',
  'Nombre d\'heures': 'عدد الساعات',
  'Kilométrage': 'المسافة المقطوعة',
  'kilométrage': 'المسافة المقطوعة',
  'Débit': 'التدفق',
  'débit': 'التدفق',
  'Débit (l/min)': 'التدفق (لتر/دقيقة)',
  'Volume': 'الحجم',
  'volume': 'الحجم',
  'Volume (litres)': 'الحجم (لتر)',
  'Portée': 'المدى',
  'portée': 'المدى',
  'Portée (m)': 'المدى (متر)',
  'Vitesse': 'السرعة',
  'Transmission': 'ناقل الحركة',
  'transmission': 'ناقل الحركة',
  'Motorisation': 'المحرك',
  'motorisation': 'المحرك',
  'Carburant': 'الوقود',
  'carburant': 'الوقود',
  'Dimensions': 'الأبعاد',
  'dimensions': 'الأبعاد',
  'Accessoires': 'الملحقات',
  'accessoires': 'الملحقات',
  'Accessoires inclus': 'الملحقات المضمنة',
  'Équipements': 'التجهيزات',
  'équipements': 'التجهيزات',
  'Options': 'الخيارات',
  'options': 'الخيارات',
  'Notes': 'ملاحظات',
  'notes': 'ملاحظات',
  'Commentaire': 'تعليق',
  'commentaire': 'تعليق',
  'Commentaires': 'تعليقات',
  'Remarques': 'ملاحظات',
  'Numéro de série': 'الرقم التسلسلي',
  'Immatriculation': 'التسجيل',
  'Photo': 'صورة',
  'Longueur': 'الطول',
  'Hauteur': 'الارتفاع',
  'Taille': 'الحجم',
  'Surface': 'المساحة',
  'Surface (ha)': 'المساحة (هكتار)',
  'Technologie': 'التكنولوجيا',
  'Système': 'النظام',
  'Pression': 'الضغط',
  'Pression (bar)': 'الضغط (بار)',
  'Résolution': 'الدقة',
  'Autonomie': 'الاستقلالية',
  'Autonomie (heures)': 'الاستقلالية (ساعات)',
  'Rayon d\'action': 'نطاق العمل',
  'Charge utile': 'الحمولة المفيدة',
  'Charge utile (kg)': 'الحمولة المفيدة (كجم)',
  'Tonnage': 'الحمولة',
  'Barre de coupe': 'قضيب القطع',
};

// ─── Field Placeholders ──────────────────────────────────────
const placeholderTranslations: Record<string, string> = {
  'Ex: John Deere, Massey Ferguson': 'مثال: جون ديير، ماسي فيرغسون',
  'Numéro ou nom du modèle': 'رقم أو اسم الموديل',
  'Année de fabrication': 'سنة الصنع',
  'Entrez la marque': 'أدخل العلامة التجارية',
  'Entrez le modèle': 'أدخل الموديل',
  'Entrez la puissance': 'أدخل القوة',
  'Entrez l\'année': 'أدخل السنة',
  'Ex: 2020': 'مثال: 2020',
  'Ex: 100 CV': 'مثال: 100 حصان',
  'Ex: 120 CV': 'مثال: 120 حصان',
  'Décrivez les caractéristiques': 'صف الخصائص',
  'Décrivez les caractéristiques supplémentaires': 'صف الخصائص الإضافية',
  'Décrivez les accessoires': 'صف الملحقات',
  'Détails supplémentaires': 'تفاصيل إضافية',
  'Entrez le nombre d\'heures': 'أدخل عدد الساعات',
  'Entrez le kilométrage': 'أدخل المسافة المقطوعة',
  'Entrez le poids': 'أدخل الوزن',
  'Entrez la capacité': 'أدخل السعة',
  'Entrez le débit': 'أدخل التدفق',
  'Entrez la largeur': 'أدخل العرض',
  'Entrez le volume': 'أدخل الحجم',
  'Spécifiez les équipements': 'حدد التجهيزات',
  'Entrez le numéro de série': 'أدخل الرقم التسلسلي',
};

// ─── Select Options ──────────────────────────────────────────
const selectOptionTranslations: Record<string, string> = {
  // État / Condition
  'Neuf': 'جديد',
  'neuf': 'جديد',
  'Très bon état': 'حالة جيدة جداً',
  'très bon état': 'حالة جيدة جداً',
  'Bon état': 'حالة جيدة',
  'bon état': 'حالة جيدة',
  'État correct': 'حالة مقبولة',
  'état correct': 'حالة مقبولة',
  'Correct': 'مقبول',
  'correct': 'مقبول',
  'Moyen': 'متوسط',
  'moyen': 'متوسط',
  'Usé': 'مستعمل',
  'usé': 'مستعمل',
  'À réparer': 'يحتاج إصلاح',
  'à réparer': 'يحتاج إصلاح',
  'À rénover': 'يحتاج تجديد',
  'Occasion': 'مستعمل',
  'occasion': 'مستعمل',
  'Reconditionné': 'مجدد',
  'reconditionné': 'مجدد',
  
  // Carburant
  'Diesel': 'ديزل',
  'diesel': 'ديزل',
  'Essence': 'بنزين',
  'essence': 'بنزين',
  'Électrique': 'كهربائي',
  'électrique': 'كهربائي',
  'Hybride': 'هجين',
  'hybride': 'هجين',
  'GPL': 'غاز',
  'Thermique': 'حراري',
  'thermique': 'حراري',
  
  // Transmission
  'Mécanique': 'ميكانيكي',
  'mécanique': 'ميكانيكي',
  'Hydrostatique': 'هيدروستاتيكي',
  'hydrostatique': 'هيدروستاتيكي',
  'Automatique': 'أوتوماتيكي',
  'automatique': 'أوتوماتيكي',
  'Semi-automatique': 'نصف أوتوماتيكي',
  'CVT': 'CVT',
  'Powershift': 'باور شيفت',
  
  // Generic options
  'Oui': 'نعم',
  'oui': 'نعم',
  'Non': 'لا',
  'non': 'لا',
  'Disponible': 'متوفر',
  'disponible': 'متوفر',
  'Indisponible': 'غير متوفر',
  'indisponible': 'غير متوفر',
  'Avec': 'مع',
  'avec': 'مع',
  'Sans': 'بدون',
  'sans': 'بدون',
  'Petit': 'صغير',
  // 'Moyen' already defined above
  'Grand': 'كبير',
  'Très grand': 'كبير جداً',
  
  // Types
  'Porté': 'محمول',
  'porté': 'محمول',
  'Semi-porté': 'نصف محمول',
  'semi-porté': 'نصف محمول',
  'Traîné': 'مجرور',
  'traîné': 'مجرور',
  'Automoteur': 'ذاتي الحركة',
  'automoteur': 'ذاتي الحركة',
  'Fixe': 'ثابت',
  'fixe': 'ثابت',
  'Mobile': 'متنقل',
  'mobile': 'متنقل',
};

/**
 * Translate a machine template field label from French to the target language.
 */
export const translateFieldLabel = (label: string, lang: Language): string => {
  if (lang === 'fr') return label;
  return fieldLabelTranslations[label] || fieldLabelTranslations[label.toLowerCase()] || label;
};

/**
 * Translate a machine template field placeholder from French to the target language.
 */
export const translatePlaceholder = (placeholder: string, lang: Language): string => {
  if (lang === 'fr') return placeholder;
  // Try exact match first
  if (placeholderTranslations[placeholder]) return placeholderTranslations[placeholder];
  // Try case-insensitive
  const lower = placeholder.toLowerCase();
  for (const [key, value] of Object.entries(placeholderTranslations)) {
    if (key.toLowerCase() === lower) return value;
  }
  return placeholder;
};

/**
 * Translate a machine template select option from French to the target language.
 */
export const translateSelectOption = (option: string, lang: Language): string => {
  if (lang === 'fr') return option;
  return selectOptionTranslations[option] || selectOptionTranslations[option.toLowerCase()] || option;
};

/**
 * Translate a customFields key (stored in DB in French) to the target language.
 * This is used when displaying offer details to farmers.
 */
export const translateCustomFieldKey = (key: string, lang: Language): string => {
  if (lang === 'fr') return key;
  return fieldLabelTranslations[key] || fieldLabelTranslations[key.toLowerCase()] || key;
};
