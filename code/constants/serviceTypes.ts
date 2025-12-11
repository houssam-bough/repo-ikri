// Classification complète des types de prestation et machines associées

export interface MachineType {
  name: string;
  subcategory?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  machines: MachineType[];
}

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: "travail_sol",
    name: "Travail du sol (Labour & Préparation)",
    machines: [
      { name: "Tracteurs (<80 CV)", subcategory: "Labour profond" },
      { name: "Tracteurs (80-120 CV)", subcategory: "Labour profond" },
      { name: "Tracteurs (120-200 CV)", subcategory: "Labour profond" },
      { name: "Tracteurs (>200 CV)", subcategory: "Labour profond" },
      { name: "Charrues portées", subcategory: "Labour profond" },
      { name: "Charrues semi-portées", subcategory: "Labour profond" },
      { name: "Sous-soleuses / Décompacteurs", subcategory: "Labour profond" },
      { name: "Cover-crops / Déchaumeurs", subcategory: "Préparation superficielle" },
      { name: "Rotavator", subcategory: "Préparation superficielle" },
      { name: "Herse rotative", subcategory: "Préparation superficielle" },
      { name: "Cultivateurs", subcategory: "Préparation superficielle" }
    ]
  },
  {
    id: "semis_plantation",
    name: "Semis & Plantation",
    machines: [
      { name: "Semoirs monograines (maïs, tournesol)", subcategory: "Semis" },
      { name: "Semoirs céréales", subcategory: "Semis" },
      { name: "Semoirs directs", subcategory: "Semis" },
      { name: "Planteuses patates", subcategory: "Plantation / Repiquage" },
      { name: "Planteuses légumes", subcategory: "Plantation / Repiquage" },
      { name: "Planteuses canne à sucre", subcategory: "Plantation / Repiquage" }
    ]
  },
  {
    id: "irrigation",
    name: "Irrigation",
    machines: [
      { name: "Tracteurs pompe (motor-pump)" },
      { name: "Enrouleurs / Irrigation à canon" },
      { name: "Rampes d'irrigation" },
      { name: "Motopompes thermiques ou électriques" }
    ]
  },
  {
    id: "fertilisation_traitement",
    name: "Fertilisation et Traitement",
    machines: [
      { name: "Épandeurs d'engrais centrifuges", subcategory: "Fertilisation" },
      { name: "Épandeurs de fumier", subcategory: "Fertilisation" },
      { name: "Pulvérisateurs portés", subcategory: "Traitement phytosanitaire" },
      { name: "Pulvérisateurs automoteurs", subcategory: "Traitement phytosanitaire" },
      { name: "Atomiseurs arboricoles", subcategory: "Traitement phytosanitaire" }
    ]
  },
  {
    id: "recolte",
    name: "Récolte",
    machines: [
      { name: "Moissonneuses-batteuses", subcategory: "Grandes cultures" },
      { name: "Ensileuses automotrices", subcategory: "Grandes cultures" },
      { name: "Faucheuses", subcategory: "Grandes cultures" },
      { name: "Faneuses", subcategory: "Grandes cultures" },
      { name: "Andaineurs", subcategory: "Grandes cultures" },
      { name: "Presse à balles rondes", subcategory: "Grandes cultures" },
      { name: "Presse à balles cubiques", subcategory: "Grandes cultures" },
      { name: "Ramasseuses-presses", subcategory: "Grandes cultures" },
      { name: "Arracheuses de pommes de terre", subcategory: "Cultures spécialisées" },
      { name: "Arracheuses carottes / oignons", subcategory: "Cultures spécialisées" },
      { name: "Récolteuses olives", subcategory: "Cultures spécialisées" },
      { name: "Récolteuses dattes", subcategory: "Cultures spécialisées" },
      { name: "Récolteuses fruits rouges", subcategory: "Cultures spécialisées" }
    ]
  },
  {
    id: "fourrage_elevage",
    name: "Fourrage & Élevage",
    machines: [
      { name: "Mélangeuses / désileuses" },
      { name: "Broyeurs d'aliments" },
      { name: "Remorques autochargeuses" },
      { name: "Remorques distributrices" },
      { name: "Tondeuses / débroussailleuses" },
      { name: "Chargeurs frontaux" }
    ]
  },
  {
    id: "transport",
    name: "Transport",
    machines: [
      { name: "Remorques agricoles (3T)" },
      { name: "Remorques agricoles (5T)" },
      { name: "Remorques agricoles (10T)" },
      { name: "Remorques agricoles (>10T)" },
      { name: "Bennes basculantes" },
      { name: "Porte-engins" },
      { name: "Pick-up agricoles" }
    ]
  },
  {
    id: "travaux_connexes",
    name: "Travaux connexes (BTP / Ferme)",
    machines: [
      { name: "Mini-pelles" },
      { name: "Chargeuses" },
      { name: "Tractopelles" },
      { name: "Bulldozers" },
      { name: "Niveleuses" },
      { name: "Compacteurs" },
      { name: "Camions-bennes" }
    ]
  },
  {
    id: "arboriculture_viticulture",
    name: "Arboriculture & Viticulture",
    machines: [
      { name: "Broyeurs de sarments" },
      { name: "Tailleuses" },
      { name: "Pulvérisateurs arboricoles/tunnels" },
      { name: "Secoueurs d'oliviers" },
      { name: "Plateformes élévatrices" }
    ]
  },
  {
    id: "services_technologiques",
    name: "Services technologiques & modernisation",
    machines: [
      { name: "Drones agricoles (pulvérisation)" },
      { name: "Drones agricoles (cartographie NDVI)" },
      { name: "Stations météo connectées" },
      { name: "GPS & guidage RTK" },
      { name: "Capteurs de sol / humidité" }
    ]
  }
];

export const CROP_TYPES = [
  { id: "cereales", name: "Céréales" },
  { id: "maraichage", name: "Maraîchage" },
  { id: "arboriculture", name: "Arboriculture" },
  { id: "autre", name: "Autre" }
];
