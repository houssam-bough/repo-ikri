// Moroccan Regions and their cities
export const moroccoRegions = {
  "Tanger-Tetouan-Al Hoceima": [
    "Tanger",
    "Tetouan",
    "Al Hoceima",
    "Larache",
    "Ksar El Kebir",
    "Asilah",
    "Fnideq",
    "Martil",
    "Mdiq",
    "Chefchaouen"
  ],
  "Oriental": [
    "Oujda",
    "Nador",
    "Berkane",
    "Taourirt",
    "Jerada",
    "Guercif",
    "Driouch",
    "Zaio",
    "Selouane"
  ],
  "Fes-Meknes": [
    "Fes",
    "Meknes",
    "Taza",
    "Sefrou",
    "Ifrane",
    "Azrou",
    "El Hajeb",
    "Errachidia",
    "Midelt",
    "Boulemane"
  ],
  "Rabat-Sale-Kenitra": [
    "Rabat",
    "Sale",
    "Kenitra",
    "Temara",
    "Skhirat",
    "Khemisset",
    "Sidi Kacem",
    "Sidi Slimane",
    "Mehdia"
  ],
  "Beni Mellal-Khenifra": [
    "Beni Mellal",
    "Khenifra",
    "Azilal",
    "Fquih Ben Salah",
    "Kasba Tadla",
    "Khouribga",
    "Demnate"
  ],
  "Casablanca-Settat": [
    "Casablanca",
    "Mohammedia",
    "El Jadida",
    "Settat",
    "Berrechid",
    "Benslimane",
    "Mediouna",
    "Nouaceur",
    "Bouskoura",
    "Sidi Bennour",
    "Azemmour"
  ],
  "Marrakech-Safi": [
    "Marrakech",
    "Safi",
    "Essaouira",
    "El Kelaa des Sraghna",
    "Youssoufia",
    "Chichaoua",
    "Rhamna",
    "Tamanar"
  ],
  "Draa-Tafilalet": [
    "Errachidia",
    "Ouarzazate",
    "Zagora",
    "Tinghir",
    "Midelt",
    "Goulmima",
    "Erfoud",
    "Rissani"
  ],
  "Souss-Massa": [
    "Agadir",
    "Inezgane",
    "Tiznit",
    "Taroudant",
    "Ouled Teima",
    "Ait Melloul",
    "Biougra",
    "Taliouine",
    "Ighrem"
  ],
  "Guelmim-Oued Noun": [
    "Guelmim",
    "Tan-Tan",
    "Sidi Ifni",
    "Assa",
    "Zag"
  ],
  "Laayoune-Sakia El Hamra": [
    "Laayoune",
    "Boujdour",
    "Tarfaya",
    "Es-Semara"
  ],
  "Dakhla-Oued Ed-Dahab": [
    "Dakhla",
    "Aousserd",
    "Lagouira"
  ]
};

// City coordinates [latitude, longitude]
export const cityCoordinates: { [city: string]: [number, number] } = {
  // Tanger-Tetouan-Al Hoceima
  "Tanger": [35.7595, -5.8340],
  "Tetouan": [35.5889, -5.3626],
  "Al Hoceima": [35.2517, -3.9317],
  "Larache": [35.1933, -6.1561],
  "Ksar El Kebir": [35.0017, -5.9006],
  "Asilah": [35.4653, -6.0359],
  "Fnideq": [35.8497, -5.3547],
  "Martil": [35.6175, -5.2756],
  "Mdiq": [35.6856, -5.3264],
  "Chefchaouen": [35.1686, -5.2686],
  
  // Oriental
  "Oujda": [34.6814, -1.9086],
  "Nador": [35.1681, -2.9331],
  "Berkane": [34.9217, -2.3231],
  "Taourirt": [34.4078, -2.8958],
  "Jerada": [34.3103, -2.1625],
  "Guercif": [34.2267, -3.3753],
  "Driouch": [34.9764, -3.3903],
  "Zaio": [34.9408, -2.7347],
  "Selouane": [35.0733, -2.9442],
  
  // Fes-Meknes
  "Fes": [34.0181, -5.0078],
  "Meknes": [33.8935, -5.5473],
  "Taza": [34.2133, -4.0100],
  "Sefrou": [33.8314, -4.8286],
  "Ifrane": [33.5228, -5.1106],
  "Azrou": [33.4342, -5.2214],
  "El Hajeb": [33.6878, -5.3694],
  "Errachidia": [31.9314, -4.4244],
  "Midelt": [32.6800, -4.7333],
  "Boulemane": [33.3628, -4.7300],
  
  // Rabat-Sale-Kenitra
  "Rabat": [33.9716, -6.8498],
  "Sale": [34.0531, -6.7914],
  "Kenitra": [34.2610, -6.5802],
  "Temara": [33.9267, -6.9067],
  "Skhirat": [33.8511, -7.0333],
  "Khemisset": [33.8242, -6.0656],
  "Sidi Kacem": [34.2214, -5.7089],
  "Sidi Slimane": [34.2650, -5.9256],
  "Mehdia": [34.2500, -6.6833],
  
  // Beni Mellal-Khenifra
  "Beni Mellal": [32.3372, -6.3498],
  "Khenifra": [32.9350, -5.6681],
  "Azilal": [31.9647, -6.5764],
  "Fquih Ben Salah": [32.5011, -6.6881],
  "Kasba Tadla": [32.5969, -6.2658],
  "Khouribga": [32.8811, -6.9063],
  "Demnate": [31.7333, -7.0000],
  
  // Casablanca-Settat
  "Casablanca": [33.5731, -7.5898],
  "Mohammedia": [33.6864, -7.3833],
  "El Jadida": [33.2316, -8.5007],
  "Settat": [33.0011, -7.6164],
  "Berrechid": [33.2650, -7.5833],
  "Benslimane": [33.6167, -7.1167],
  "Mediouna": [33.4500, -7.5000],
  "Nouaceur": [33.3667, -7.5833],
  "Bouskoura": [33.4500, -7.6500],
  "Sidi Bennour": [32.6500, -8.4167],
  "Azemmour": [33.2833, -8.3333],
  
  // Marrakech-Safi
  "Marrakech": [31.6295, -7.9811],
  "Safi": [32.2994, -9.2372],
  "Essaouira": [31.5125, -9.7697],
  "El Kelaa des Sraghna": [32.0539, -7.4064],
  "Youssoufia": [32.2453, -8.5303],
  "Chichaoua": [31.5428, -8.7633],
  "Rhamna": [32.3000, -7.6000],
  "Tamanar": [31.0167, -9.6833],
  
  // Draa-Tafilalet
  "Ouarzazate": [30.9189, -6.8934],
  "Zagora": [30.3472, -5.8372],
  "Tinghir": [31.5147, -5.5328],
  "Goulmima": [31.6833, -4.9833],
  "Erfoud": [31.4333, -4.2333],
  "Rissani": [31.2800, -4.2667],
  
  // Souss-Massa
  "Agadir": [30.4278, -9.5981],
  "Inezgane": [30.3550, -9.5364],
  "Tiznit": [29.6975, -9.7317],
  "Taroudant": [30.4728, -8.8761],
  "Ouled Teima": [30.3981, -9.2097],
  "Ait Melloul": [30.3333, -9.5000],
  "Biougra": [30.2167, -9.3667],
  "Taliouine": [30.5267, -7.9178],
  "Ighrem": [30.1167, -9.0333],
  
  // Guelmim-Oued Noun
  "Guelmim": [28.9869, -10.0575],
  "Tan-Tan": [28.4378, -11.1031],
  "Sidi Ifni": [29.3797, -10.1731],
  "Assa": [28.6133, -9.4233],
  "Zag": [28.0167, -8.3000],
  
  // Laayoune-Sakia El Hamra
  "Laayoune": [27.1536, -13.1994],
  "Boujdour": [26.1256, -14.4833],
  "Tarfaya": [27.9389, -12.9239],
  "Es-Semara": [26.7417, -11.6756],
  
  // Dakhla-Oued Ed-Dahab
  "Dakhla": [23.7158, -15.9582],
  "Aousserd": [22.5500, -14.3333],
  "Lagouira": [21.3667, -17.0667]
};

// Region center coordinates [latitude, longitude]
export const regionCoordinates: { [region: string]: [number, number] } = {
  "Tanger-Tetouan-Al Hoceima": [35.5889, -5.3626],
  "Oriental": [34.6814, -1.9086],
  "Fes-Meknes": [34.0181, -5.0078],
  "Rabat-Sale-Kenitra": [33.9716, -6.8498],
  "Beni Mellal-Khenifra": [32.3372, -6.3498],
  "Casablanca-Settat": [33.5731, -7.5898],
  "Marrakech-Safi": [31.6295, -7.9811],
  "Draa-Tafilalet": [31.9314, -4.4244],
  "Souss-Massa": [30.4278, -9.5981],
  "Guelmim-Oued Noun": [28.9869, -10.0575],
  "Laayoune-Sakia El Hamra": [27.1536, -13.1994],
  "Dakhla-Oued Ed-Dahab": [23.7158, -15.9582]
};

export const getRegions = (): string[] => {
  return Object.keys(moroccoRegions);
};

export const getCitiesByRegion = (region: string): string[] => {
  return moroccoRegions[region as keyof typeof moroccoRegions] || [];
};

export const getCityCoordinates = (city: string): [number, number] | null => {
  return cityCoordinates[city] || null;
};

export const getRegionCoordinates = (region: string): [number, number] | null => {
  return regionCoordinates[region] || null;
};
