// Classification complète des types de prestation et machines associées
// Bilingual support: French (fr) and Arabic (ar)

export type Language = 'fr' | 'ar';

export interface MachineType {
  name: string;
  name_ar: string;
  subcategory?: string;
  subcategory_ar?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  name_ar: string;
  machines: MachineType[];
}

// Helper functions to get localized names
export const getServiceName = (service: ServiceType, lang: Language): string => {
  return lang === 'ar' ? service.name_ar : service.name;
};

export const getMachineName = (machine: MachineType, lang: Language): string => {
  return lang === 'ar' ? machine.name_ar : machine.name;
};

export const getMachineSubcategory = (machine: MachineType, lang: Language): string | undefined => {
  if (!machine.subcategory) return undefined;
  return lang === 'ar' ? machine.subcategory_ar : machine.subcategory;
};

export const getServiceNameById = (id: string, lang: Language): string => {
  const service = SERVICE_TYPES.find(s => s.id === id);
  if (!service) return id;
  return getServiceName(service, lang);
};

export const getCropName = (crop: { name: string; name_ar: string }, lang: Language): string => {
  return lang === 'ar' ? crop.name_ar : crop.name;
};

// Translate a machine name stored in DB (French) to the current language
export const translateMachineName = (frenchName: string, lang: Language): string => {
  if (lang === 'fr') return frenchName;
  for (const service of SERVICE_TYPES) {
    for (const machine of service.machines) {
      if (machine.name === frenchName) {
        return machine.name_ar;
      }
    }
  }
  return frenchName; // fallback if not found
};

// Translate a crop type name stored in DB (French) to the current language
export const translateCropName = (frenchName: string, lang: Language): string => {
  if (lang === 'fr') return frenchName;
  const crop = CROP_TYPES.find(c => c.name === frenchName);
  return crop ? crop.name_ar : frenchName;
};

// Translate a service type name (French, as stored in DB equipmentType) to the current language
export const translateServiceTypeName = (frenchName: string, lang: Language): string => {
  if (lang === 'fr') return frenchName;
  const service = SERVICE_TYPES.find(s => s.name === frenchName);
  return service ? service.name_ar : frenchName;
};

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: "travail_sol",
    name: "Travail du sol (Labour & Préparation)",
    name_ar: "أعمال التربة (الحرث والتحضير)",
    machines: [
      { name: "Tracteurs (<80 CV)", name_ar: "جرارات (أقل من 80 حصان)", subcategory: "Labour profond", subcategory_ar: "حرث عميق" },
      { name: "Tracteurs (80-120 CV)", name_ar: "جرارات (80-120 حصان)", subcategory: "Labour profond", subcategory_ar: "حرث عميق" },
      { name: "Tracteurs (120-200 CV)", name_ar: "جرارات (120-200 حصان)", subcategory: "Labour profond", subcategory_ar: "حرث عميق" },
      { name: "Tracteurs (>200 CV)", name_ar: "جرارات (أكثر من 200 حصان)", subcategory: "Labour profond", subcategory_ar: "حرث عميق" },
      { name: "Charrues portées", name_ar: "محاريث محمولة", subcategory: "Labour profond", subcategory_ar: "حرث عميق" },
      { name: "Charrues semi-portées", name_ar: "محاريث نصف محمولة", subcategory: "Labour profond", subcategory_ar: "حرث عميق" },
      { name: "Sous-soleuses / Décompacteurs", name_ar: "محاريث تحت التربة / مفككات", subcategory: "Labour profond", subcategory_ar: "حرث عميق" },
      { name: "Cover-crops / Déchaumeurs", name_ar: "أقراص / محاريث قرصية", subcategory: "Préparation superficielle", subcategory_ar: "تحضير سطحي" },
      { name: "Rotavator", name_ar: "روتافاتور", subcategory: "Préparation superficielle", subcategory_ar: "تحضير سطحي" },
      { name: "Herse rotative", name_ar: "مسلفة دوارة", subcategory: "Préparation superficielle", subcategory_ar: "تحضير سطحي" },
      { name: "Cultivateurs", name_ar: "مزارعات", subcategory: "Préparation superficielle", subcategory_ar: "تحضير سطحي" }
    ]
  },
  {
    id: "semis_plantation",
    name: "Semis & Plantation",
    name_ar: "البذر والغرس",
    machines: [
      { name: "Semoirs monograines (maïs, tournesol)", name_ar: "بذارات أحادية (ذرة، عباد الشمس)", subcategory: "Semis", subcategory_ar: "البذر" },
      { name: "Semoirs céréales", name_ar: "بذارات الحبوب", subcategory: "Semis", subcategory_ar: "البذر" },
      { name: "Semoirs directs", name_ar: "بذارات مباشرة", subcategory: "Semis", subcategory_ar: "البذر" },
      { name: "Planteuses patates", name_ar: "آلات زراعة البطاطس", subcategory: "Plantation / Repiquage", subcategory_ar: "الغرس / الشتل" },
      { name: "Planteuses légumes", name_ar: "آلات زراعة الخضروات", subcategory: "Plantation / Repiquage", subcategory_ar: "الغرس / الشتل" },
      { name: "Planteuses canne à sucre", name_ar: "آلات زراعة قصب السكر", subcategory: "Plantation / Repiquage", subcategory_ar: "الغرس / الشتل" }
    ]
  },
  {
    id: "irrigation",
    name: "Irrigation",
    name_ar: "الري",
    machines: [
      { name: "Tracteurs pompe (motor-pump)", name_ar: "مضخات الجرار" },
      { name: "Enrouleurs / Irrigation à canon", name_ar: "لفافات / ري بالمدفع" },
      { name: "Rampes d'irrigation", name_ar: "منحدرات الري" },
      { name: "Motopompes thermiques ou électriques", name_ar: "مضخات حرارية أو كهربائية" }
    ]
  },
  {
    id: "fertilisation_traitement",
    name: "Fertilisation et Traitement",
    name_ar: "التسميد والمعالجة",
    machines: [
      { name: "Épandeurs d'engrais centrifuges", name_ar: "ناثرات الأسمدة الطاردة المركزية", subcategory: "Fertilisation", subcategory_ar: "التسميد" },
      { name: "Épandeurs de fumier", name_ar: "ناثرات السماد العضوي", subcategory: "Fertilisation", subcategory_ar: "التسميد" },
      { name: "Pulvérisateurs portés", name_ar: "رشاشات محمولة", subcategory: "Traitement phytosanitaire", subcategory_ar: "المعالجة النباتية" },
      { name: "Pulvérisateurs automoteurs", name_ar: "رشاشات ذاتية الحركة", subcategory: "Traitement phytosanitaire", subcategory_ar: "المعالجة النباتية" },
      { name: "Atomiseurs arboricoles", name_ar: "رذاذات الأشجار", subcategory: "Traitement phytosanitaire", subcategory_ar: "المعالجة النباتية" }
    ]
  },
  {
    id: "recolte",
    name: "Récolte",
    name_ar: "الحصاد",
    machines: [
      { name: "Moissonneuses-batteuses", name_ar: "حاصدات دارسات", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Ensileuses automotrices", name_ar: "آلات السيلاج ذاتية الحركة", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Faucheuses", name_ar: "حشاشات", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Faneuses", name_ar: "مقلبات التبن", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Andaineurs", name_ar: "مصفافات", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Presse à balles rondes", name_ar: "مكبسات البالات الدائرية", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Presse à balles cubiques", name_ar: "مكبسات البالات المكعبة", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Ramasseuses-presses", name_ar: "جامعات-مكبسات", subcategory: "Grandes cultures", subcategory_ar: "المحاصيل الكبرى" },
      { name: "Arracheuses de pommes de terre", name_ar: "آلات قلع البطاطس", subcategory: "Cultures spécialisées", subcategory_ar: "محاصيل متخصصة" },
      { name: "Arracheuses carottes / oignons", name_ar: "آلات قلع الجزر / البصل", subcategory: "Cultures spécialisées", subcategory_ar: "محاصيل متخصصة" },
      { name: "Récolteuses olives", name_ar: "آلات جني الزيتون", subcategory: "Cultures spécialisées", subcategory_ar: "محاصيل متخصصة" },
      { name: "Récolteuses dattes", name_ar: "آلات جني التمور", subcategory: "Cultures spécialisées", subcategory_ar: "محاصيل متخصصة" },
      { name: "Récolteuses fruits rouges", name_ar: "آلات جني الفواكه الحمراء", subcategory: "Cultures spécialisées", subcategory_ar: "محاصيل متخصصة" }
    ]
  },
  {
    id: "fourrage_elevage",
    name: "Fourrage & Élevage",
    name_ar: "الأعلاف وتربية المواشي",
    machines: [
      { name: "Mélangeuses / désileuses", name_ar: "خلاطات / مفرغات السيلاج" },
      { name: "Broyeurs d'aliments", name_ar: "طاحونات الأعلاف" },
      { name: "Remorques autochargeuses", name_ar: "مقطورات ذاتية التحميل" },
      { name: "Remorques distributrices", name_ar: "مقطورات موزعة" },
      { name: "Tondeuses / débroussailleuses", name_ar: "جزازات / قاطعات الأعشاب" },
      { name: "Chargeurs frontaux", name_ar: "محملات أمامية" }
    ]
  },
  {
    id: "transport",
    name: "Transport",
    name_ar: "النقل",
    machines: [
      { name: "Remorques agricoles (3T)", name_ar: "مقطورات زراعية (3 طن)" },
      { name: "Remorques agricoles (5T)", name_ar: "مقطورات زراعية (5 طن)" },
      { name: "Remorques agricoles (10T)", name_ar: "مقطورات زراعية (10 طن)" },
      { name: "Remorques agricoles (>10T)", name_ar: "مقطورات زراعية (أكثر من 10 طن)" },
      { name: "Bennes basculantes", name_ar: "قلابات" },
      { name: "Porte-engins", name_ar: "ناقلات المعدات" },
      { name: "Pick-up agricoles", name_ar: "سيارات بيك أب زراعية" }
    ]
  },
  {
    id: "travaux_connexes",
    name: "Travaux connexes (BTP / Ferme)",
    name_ar: "أعمال ملحقة (بناء / مزرعة)",
    machines: [
      { name: "Mini-pelles", name_ar: "حفارات صغيرة" },
      { name: "Chargeuses", name_ar: "محملات" },
      { name: "Tractopelles", name_ar: "حفارات محملة" },
      { name: "Bulldozers", name_ar: "جرافات" },
      { name: "Niveleuses", name_ar: "ممهدات" },
      { name: "Compacteurs", name_ar: "دكاكات" },
      { name: "Camions-bennes", name_ar: "شاحنات قلابة" }
    ]
  },
  {
    id: "arboriculture_viticulture",
    name: "Arboriculture & Viticulture",
    name_ar: "زراعة الأشجار والكروم",
    machines: [
      { name: "Broyeurs de sarments", name_ar: "مفرمات الأغصان" },
      { name: "Tailleuses", name_ar: "آلات التقليم" },
      { name: "Pulvérisateurs arboricoles/tunnels", name_ar: "رشاشات الأشجار / النفقية" },
      { name: "Secoueurs d'oliviers", name_ar: "هزازات الزيتون" },
      { name: "Plateformes élévatrices", name_ar: "منصات رافعة" }
    ]
  },
  {
    id: "services_technologiques",
    name: "Services technologiques & modernisation",
    name_ar: "خدمات تكنولوجية وتحديث",
    machines: [
      { name: "Drones agricoles (pulvérisation)", name_ar: "طائرات بدون طيار زراعية (رش)" },
      { name: "Drones agricoles (cartographie NDVI)", name_ar: "طائرات بدون طيار زراعية (خرائط NDVI)" },
      { name: "Stations météo connectées", name_ar: "محطات أرصاد جوية متصلة" },
      { name: "GPS & guidage RTK", name_ar: "نظام تحديد المواقع وتوجيه RTK" },
      { name: "Capteurs de sol / humidité", name_ar: "مستشعرات التربة / الرطوبة" }
    ]
  }
];

export const CROP_TYPES = [
  { id: "cereales", name: "Céréales", name_ar: "الحبوب" },
  { id: "maraichage", name: "Maraîchage", name_ar: "زراعة الخضروات" },
  { id: "arboriculture", name: "Arboriculture", name_ar: "زراعة الأشجار" },
  { id: "autre", name: "Autre", name_ar: "أخرى" }
];
