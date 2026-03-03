// Major cities of Morocco with GPS coordinates
// Only includes significant urban centers for agricultural services

export type Language = 'fr' | 'ar';

export interface City {
  name: string;
  name_ar: string;
  coordinates: [number, number]; // [latitude, longitude]
  region: string;
}

export const MAJOR_CITIES: City[] = [
  // Grandes villes (>500k habitants)
  { name: "Casablanca", name_ar: "الدار البيضاء", coordinates: [33.5731, -7.5898], region: "Casablanca-Settat" },
  { name: "Rabat", name_ar: "الرباط", coordinates: [34.0209, -6.8416], region: "Rabat-Sale-Kenitra" },
  { name: "Fes", name_ar: "فاس", coordinates: [34.0181, -5.0078], region: "Fes-Meknes" },
  { name: "Marrakech", name_ar: "مراكش", coordinates: [31.6295, -7.9811], region: "Marrakech-Safi" },
  { name: "Agadir", name_ar: "أكادير", coordinates: [30.4278, -9.5981], region: "Souss-Massa" },
  { name: "Tanger", name_ar: "طنجة", coordinates: [35.7595, -5.8340], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Meknes", name_ar: "مكناس", coordinates: [33.8935, -5.5473], region: "Fes-Meknes" },
  { name: "Oujda", name_ar: "وجدة", coordinates: [34.6867, -1.9114], region: "Oriental" },
  { name: "Kenitra", name_ar: "القنيطرة", coordinates: [34.2610, -6.5802], region: "Rabat-Sale-Kenitra" },
  { name: "Tetouan", name_ar: "تطوان", coordinates: [35.5889, -5.3626], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Sale", name_ar: "سلا", coordinates: [34.0531, -6.7985], region: "Rabat-Sale-Kenitra" },
  
  // Villes moyennes importantes (100k-500k)
  { name: "Safi", name_ar: "آسفي", coordinates: [32.2994, -9.2372], region: "Marrakech-Safi" },
  { name: "Mohammedia", name_ar: "المحمدية", coordinates: [33.6866, -7.3826], region: "Casablanca-Settat" },
  { name: "El Jadida", name_ar: "الجديدة", coordinates: [33.2316, -8.5007], region: "Casablanca-Settat" },
  { name: "Beni Mellal", name_ar: "بني ملال", coordinates: [32.3373, -6.3498], region: "Beni Mellal-Khenifra" },
  { name: "Nador", name_ar: "الناظور", coordinates: [35.1681, -2.9333], region: "Oriental" },
  { name: "Khouribga", name_ar: "خريبكة", coordinates: [32.8811, -6.9063], region: "Beni Mellal-Khenifra" },
  { name: "Settat", name_ar: "سطات", coordinates: [33.0018, -7.6164], region: "Casablanca-Settat" },
  { name: "Larache", name_ar: "العرائش", coordinates: [35.1933, -6.1561], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Ksar El Kebir", name_ar: "القصر الكبير", coordinates: [35.0018, -5.9002], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Khemisset", name_ar: "الخميسات", coordinates: [33.8242, -6.0662], region: "Rabat-Sale-Kenitra" },
  { name: "Taza", name_ar: "تازة", coordinates: [34.2133, -4.0096], region: "Fes-Meknes" },
  
  // Centres agricoles importants
  { name: "Berrechid", name_ar: "برشيد", coordinates: [33.2653, -7.5862], region: "Casablanca-Settat" },
  { name: "Berkane", name_ar: "بركان", coordinates: [34.9182, -2.3222], region: "Oriental" },
  { name: "Taourirt", name_ar: "تاوريرت", coordinates: [34.4074, -2.8935], region: "Oriental" },
  { name: "Sidi Slimane", name_ar: "سيدي سليمان", coordinates: [34.2649, -5.9276], region: "Rabat-Sale-Kenitra" },
  { name: "Chefchaouen", name_ar: "شفشاون", coordinates: [35.1688, -5.2636], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Ouezzane", name_ar: "وزان", coordinates: [34.7958, -5.5836], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Essaouira", name_ar: "الصويرة", coordinates: [31.5084, -9.7595], region: "Marrakech-Safi" },
  { name: "Taroudant", name_ar: "تارودانت", coordinates: [30.4728, -8.8768], region: "Souss-Massa" },
  { name: "Tiznit", name_ar: "تزنيت", coordinates: [29.6974, -9.7316], region: "Souss-Massa" },
  
  // Villes du sud et de l'est
  { name: "Ouarzazate", name_ar: "ورزازات", coordinates: [30.9335, -6.9370], region: "Draa-Tafilalet" },
  { name: "Errachidia", name_ar: "الراشيدية", coordinates: [31.9314, -4.4240], region: "Draa-Tafilalet" },
  { name: "Guelmim", name_ar: "كلميم", coordinates: [28.9870, -10.0574], region: "Guelmim-Oued Noun" },
  
  // Villes du Moyen Atlas
  { name: "Ifrane", name_ar: "إفران", coordinates: [33.5228, -5.1106], region: "Fes-Meknes" },
  { name: "Azrou", name_ar: "أزرو", coordinates: [33.4344, -5.2221], region: "Fes-Meknes" },
  { name: "Midelt", name_ar: "ميدلت", coordinates: [32.6852, -4.7326], region: "Draa-Tafilalet" },
  { name: "Khenifra", name_ar: "خنيفرة", coordinates: [32.9336, -5.6630], region: "Beni Mellal-Khenifra" },
];

// Helper to get localized city name
export const getLocalizedCityName = (city: City, lang: Language): string => {
  return lang === 'ar' ? city.name_ar : city.name;
};

// Helper function to get coordinates by city name (supports both French and Arabic names)
export const getCityCoordinates = (cityName: string): [number, number] | undefined => {
  let city = MAJOR_CITIES.find(c => c.name === cityName);
  if (!city) {
    city = MAJOR_CITIES.find(c => c.name_ar === cityName);
  }
  return city?.coordinates;
};

// Get list of city names for dropdowns (localized)
export const getCityNames = (lang?: Language): string[] => {
  if (lang === 'ar') {
    return MAJOR_CITIES.map(c => c.name_ar).sort();
  }
  return MAJOR_CITIES.map(c => c.name).sort();
};

// Get coordinates map for quick lookup (supports both languages)
export const getCityCoordinatesMap = (): Record<string, [number, number]> => {
  const map: Record<string, [number, number]> = {};
  MAJOR_CITIES.forEach(city => {
    map[city.name] = city.coordinates;
    map[city.name_ar] = city.coordinates;
  });
  return map;
};
