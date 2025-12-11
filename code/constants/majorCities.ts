// Major cities of Morocco with GPS coordinates
// Only includes significant urban centers for agricultural services

export interface City {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  region: string;
}

export const MAJOR_CITIES: City[] = [
  // Grandes villes (>500k habitants)
  { name: "Casablanca", coordinates: [33.5731, -7.5898], region: "Casablanca-Settat" },
  { name: "Rabat", coordinates: [34.0209, -6.8416], region: "Rabat-Sale-Kenitra" },
  { name: "Fes", coordinates: [34.0181, -5.0078], region: "Fes-Meknes" },
  { name: "Marrakech", coordinates: [31.6295, -7.9811], region: "Marrakech-Safi" },
  { name: "Agadir", coordinates: [30.4278, -9.5981], region: "Souss-Massa" },
  { name: "Tanger", coordinates: [35.7595, -5.8340], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Meknes", coordinates: [33.8935, -5.5473], region: "Fes-Meknes" },
  { name: "Oujda", coordinates: [34.6867, -1.9114], region: "Oriental" },
  { name: "Kenitra", coordinates: [34.2610, -6.5802], region: "Rabat-Sale-Kenitra" },
  { name: "Tetouan", coordinates: [35.5889, -5.3626], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Sale", coordinates: [34.0531, -6.7985], region: "Rabat-Sale-Kenitra" },
  
  // Villes moyennes importantes (100k-500k)
  { name: "Safi", coordinates: [32.2994, -9.2372], region: "Marrakech-Safi" },
  { name: "Mohammedia", coordinates: [33.6866, -7.3826], region: "Casablanca-Settat" },
  { name: "El Jadida", coordinates: [33.2316, -8.5007], region: "Casablanca-Settat" },
  { name: "Beni Mellal", coordinates: [32.3373, -6.3498], region: "Beni Mellal-Khenifra" },
  { name: "Nador", coordinates: [35.1681, -2.9333], region: "Oriental" },
  { name: "Khouribga", coordinates: [32.8811, -6.9063], region: "Beni Mellal-Khenifra" },
  { name: "Settat", coordinates: [33.0018, -7.6164], region: "Casablanca-Settat" },
  { name: "Larache", coordinates: [35.1933, -6.1561], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Ksar El Kebir", coordinates: [35.0018, -5.9002], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Khemisset", coordinates: [33.8242, -6.0662], region: "Rabat-Sale-Kenitra" },
  { name: "Taza", coordinates: [34.2133, -4.0096], region: "Fes-Meknes" },
  
  // Centres agricoles importants
  { name: "Berrechid", coordinates: [33.2653, -7.5862], region: "Casablanca-Settat" },
  { name: "Berkane", coordinates: [34.9182, -2.3222], region: "Oriental" },
  { name: "Taourirt", coordinates: [34.4074, -2.8935], region: "Oriental" },
  { name: "Sidi Slimane", coordinates: [34.2649, -5.9276], region: "Rabat-Sale-Kenitra" },
  { name: "Chefchaouen", coordinates: [35.1688, -5.2636], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Ouezzane", coordinates: [34.7958, -5.5836], region: "Tanger-Tetouan-Al Hoceima" },
  { name: "Essaouira", coordinates: [31.5084, -9.7595], region: "Marrakech-Safi" },
  { name: "Taroudant", coordinates: [30.4728, -8.8768], region: "Souss-Massa" },
  { name: "Tiznit", coordinates: [29.6974, -9.7316], region: "Souss-Massa" },
  
  // Villes du sud et de l'est
  { name: "Ouarzazate", coordinates: [30.9335, -6.9370], region: "Draa-Tafilalet" },
  { name: "Errachidia", coordinates: [31.9314, -4.4240], region: "Draa-Tafilalet" },
  { name: "Guelmim", coordinates: [28.9870, -10.0574], region: "Guelmim-Oued Noun" },
  
  // Villes du Moyen Atlas
  { name: "Ifrane", coordinates: [33.5228, -5.1106], region: "Fes-Meknes" },
  { name: "Azrou", coordinates: [33.4344, -5.2221], region: "Fes-Meknes" },
  { name: "Midelt", coordinates: [32.6852, -4.7326], region: "Draa-Tafilalet" },
  { name: "Khenifra", coordinates: [32.9336, -5.6630], region: "Beni Mellal-Khenifra" },
];

// Helper function to get coordinates by city name
export const getCityCoordinates = (cityName: string): [number, number] | undefined => {
  const city = MAJOR_CITIES.find(c => c.name === cityName);
  return city?.coordinates;
};

// Get list of city names for dropdowns
export const getCityNames = (): string[] => {
  return MAJOR_CITIES.map(c => c.name).sort();
};

// Get coordinates map for quick lookup
export const getCityCoordinatesMap = (): Record<string, [number, number]> => {
  return MAJOR_CITIES.reduce((acc, city) => {
    acc[city.name] = city.coordinates;
    return acc;
  }, {} as Record<string, [number, number]>);
};
