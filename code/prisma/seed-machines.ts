import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Définitions des champs dynamiques par catégorie de machine
const getFieldDefinitionsForMachine = (machineName: string, subcategory?: string) => {
  // Champs communs à toutes les machines
  const commonFields = [
    { name: 'brand', label: 'Marque', type: 'text' as const, required: true, placeholder: 'Ex: John Deere, Massey Ferguson, New Holland' },
    { name: 'model', label: 'Modèle', type: 'text' as const, required: true, placeholder: 'Numéro ou nom du modèle' },
    { name: 'year', label: 'Année de fabrication', type: 'number' as const, required: true, placeholder: 'Ex: 2020' },
    { name: 'condition', label: 'État', type: 'select' as const, required: true, options: ['Excellent', 'Bon', 'Acceptable', 'Nécessite réparation'] }
  ]

  // Champs spécifiques selon le type de machine
  let specificFields: any[] = []

  // Tracteurs
  if (machineName.toLowerCase().includes('tracteur')) {
    specificFields = [
      { name: 'horsepower', label: 'Puissance (CV)', type: 'number' as const, required: true, placeholder: 'Ex: 100' },
      { name: 'transmission', label: 'Transmission', type: 'select' as const, required: true, options: ['Mécanique', 'Hydrostatique', 'Powershift', 'CVT'] },
      { name: 'fourWheelDrive', label: 'Traction', type: 'select' as const, required: true, options: ['4x2', '4x4'] },
      { name: 'features', label: 'Équipements spéciaux', type: 'textarea' as const, required: false, placeholder: 'Climatisation, GPS, Cabine suspendue, etc.' }
    ]
  }
  // Charrues
  else if (machineName.toLowerCase().includes('charrue')) {
    specificFields = [
      { name: 'plowCount', label: 'Nombre de corps', type: 'number' as const, required: true, placeholder: 'Ex: 3, 4, 5' },
      { name: 'workingWidth', label: 'Largeur de travail (cm)', type: 'number' as const, required: true, placeholder: 'Ex: 120' },
      { name: 'depth', label: 'Profondeur max (cm)', type: 'number' as const, required: false, placeholder: 'Ex: 35' },
      { name: 'reversible', label: 'Réversible', type: 'select' as const, required: true, options: ['Oui', 'Non'] }
    ]
  }
  // Semoirs
  else if (machineName.toLowerCase().includes('semoir')) {
    specificFields = [
      { name: 'rowCount', label: 'Nombre de rangs', type: 'number' as const, required: true, placeholder: 'Ex: 6' },
      { name: 'workingWidth', label: 'Largeur de travail (m)', type: 'number' as const, required: true, placeholder: 'Ex: 3' },
      { name: 'hopperCapacity', label: 'Capacité de la trémie (L)', type: 'number' as const, required: true, placeholder: 'Ex: 300' },
      { name: 'seedTypes', label: 'Types de graines compatibles', type: 'textarea' as const, required: true, placeholder: 'Ex: Maïs, tournesol, soja' }
    ]
  }
  // Planteuses
  else if (machineName.toLowerCase().includes('planteuse')) {
    specificFields = [
      { name: 'rowCount', label: 'Nombre de rangs', type: 'number' as const, required: true, placeholder: 'Ex: 4' },
      { name: 'rowSpacing', label: 'Écartement inter-rangs (cm)', type: 'number' as const, required: true, placeholder: 'Ex: 75' },
      { name: 'plantSpacing', label: 'Écartement sur le rang (cm)', type: 'number' as const, required: false, placeholder: 'Ex: 30' },
      { name: 'hopperCapacity', label: 'Capacité (kg)', type: 'number' as const, required: false, placeholder: 'Ex: 200' }
    ]
  }
  // Pulvérisateurs / Atomiseurs
  else if (machineName.toLowerCase().includes('pulvérisateur') || machineName.toLowerCase().includes('atomiseur')) {
    specificFields = [
      { name: 'tankCapacity', label: 'Capacité du réservoir (L)', type: 'number' as const, required: true, placeholder: 'Ex: 1000' },
      { name: 'sprayWidth', label: 'Largeur de pulvérisation (m)', type: 'number' as const, required: true, placeholder: 'Ex: 18' },
      { name: 'pumpType', label: 'Type de pompe', type: 'select' as const, required: true, options: ['Centrifuge', 'Membrane', 'Piston', 'Roller'] },
      { name: 'boomType', label: 'Type de rampe', type: 'select' as const, required: false, options: ['Fixe', 'Pliante', 'Suspendue', 'Tunnel'] }
    ]
  }
  // Épandeurs
  else if (machineName.toLowerCase().includes('épandeur')) {
    specificFields = [
      { name: 'capacity', label: 'Capacité (kg ou L)', type: 'number' as const, required: true, placeholder: 'Ex: 1500' },
      { name: 'workingWidth', label: 'Largeur d\'épandage (m)', type: 'number' as const, required: true, placeholder: 'Ex: 12' },
      { name: 'spreadType', label: 'Type d\'épandage', type: 'select' as const, required: true, options: ['Centrifuge', 'Pneumatique', 'Hérissons'] }
    ]
  }
  // Moissonneuses-batteuses
  else if (machineName.toLowerCase().includes('moissonneuse')) {
    specificFields = [
      { name: 'headerWidth', label: 'Largeur de coupe (m)', type: 'number' as const, required: true, placeholder: 'Ex: 6' },
      { name: 'grainTankCapacity', label: 'Capacité de la trémie (L)', type: 'number' as const, required: true, placeholder: 'Ex: 8000' },
      { name: 'enginePower', label: 'Puissance moteur (CV)', type: 'number' as const, required: true, placeholder: 'Ex: 350' },
      { name: 'cropTypes', label: 'Cultures compatibles', type: 'textarea' as const, required: true, placeholder: 'Blé, orge, maïs, etc.' }
    ]
  }
  // Ensileuses
  else if (machineName.toLowerCase().includes('ensileuse')) {
    specificFields = [
      { name: 'rowCount', label: 'Nombre de rangs', type: 'number' as const, required: true, placeholder: 'Ex: 8' },
      { name: 'enginePower', label: 'Puissance moteur (CV)', type: 'number' as const, required: true, placeholder: 'Ex: 500' },
      { name: 'chopperType', label: 'Type de hachage', type: 'select' as const, required: true, options: ['Tambour', 'Cylindre'] }
    ]
  }
  // Faucheuses / Faneuses / Andaineurs
  else if (machineName.toLowerCase().includes('faucheuse') || machineName.toLowerCase().includes('faneuse') || machineName.toLowerCase().includes('andaineur')) {
    specificFields = [
      { name: 'workingWidth', label: 'Largeur de travail (m)', type: 'number' as const, required: true, placeholder: 'Ex: 3.2' },
      { name: 'rotorCount', label: 'Nombre de rotors', type: 'number' as const, required: false, placeholder: 'Ex: 2' }
    ]
  }
  // Presses
  else if (machineName.toLowerCase().includes('presse')) {
    specificFields = [
      { name: 'baleType', label: 'Type de balle', type: 'select' as const, required: true, options: ['Ronde', 'Cubique/Carrée'] },
      { name: 'baleSize', label: 'Dimension des balles', type: 'text' as const, required: true, placeholder: 'Ex: 120x90 cm ou Ø120x120' },
      { name: 'bindingType', label: 'Type de liage', type: 'select' as const, required: true, options: ['Ficelle', 'Filet', 'Ficelle et filet'] }
    ]
  }
  // Arracheuses
  else if (machineName.toLowerCase().includes('arracheuse')) {
    specificFields = [
      { name: 'rowCount', label: 'Nombre de rangs', type: 'number' as const, required: true, placeholder: 'Ex: 2' },
      { name: 'hopperCapacity', label: 'Capacité de stockage (kg)', type: 'number' as const, required: false, placeholder: 'Ex: 1500' },
      { name: 'cropTypes', label: 'Cultures compatibles', type: 'text' as const, required: true, placeholder: 'Pommes de terre, carottes, oignons, etc.' }
    ]
  }
  // Récolteuses spécialisées
  else if (machineName.toLowerCase().includes('récolteuse')) {
    specificFields = [
      { name: 'harvestType', label: 'Type de récolte', type: 'text' as const, required: true, placeholder: 'Ex: Olives, dattes, fruits rouges' },
      { name: 'capacity', label: 'Capacité de stockage (kg)', type: 'number' as const, required: false, placeholder: 'Ex: 500' },
      { name: 'operationType', label: 'Mode de fonctionnement', type: 'select' as const, required: true, options: ['Manuel', 'Semi-automatique', 'Automatique'] }
    ]
  }
  // Remorques
  else if (machineName.toLowerCase().includes('remorque') || machineName.toLowerCase().includes('benne')) {
    specificFields = [
      { name: 'capacity', label: 'Capacité de charge (tonnes)', type: 'number' as const, required: true, placeholder: 'Ex: 10' },
      { name: 'bedLength', label: 'Longueur de plateau (m)', type: 'number' as const, required: false, placeholder: 'Ex: 6' },
      { name: 'tipping', label: 'Basculante', type: 'select' as const, required: true, options: ['Oui', 'Non'] },
      { name: 'axleCount', label: 'Nombre d\'essieux', type: 'number' as const, required: true, placeholder: 'Ex: 2' }
    ]
  }
  // Engins BTP
  else if (machineName.toLowerCase().includes('pelle') || machineName.toLowerCase().includes('chargeuse') || 
           machineName.toLowerCase().includes('bulldozer') || machineName.toLowerCase().includes('niveleuse') ||
           machineName.toLowerCase().includes('compacteur')) {
    specificFields = [
      { name: 'operatingWeight', label: 'Poids en ordre de marche (tonnes)', type: 'number' as const, required: true, placeholder: 'Ex: 8' },
      { name: 'enginePower', label: 'Puissance moteur (CV)', type: 'number' as const, required: true, placeholder: 'Ex: 120' },
      { name: 'bucketCapacity', label: 'Capacité du godet (m³)', type: 'number' as const, required: false, placeholder: 'Ex: 0.5' },
      { name: 'maxDigDepth', label: 'Profondeur de fouille max (m)', type: 'number' as const, required: false, placeholder: 'Ex: 3.5' }
    ]
  }
  // Irrigation
  else if (machineName.toLowerCase().includes('pompe') || machineName.toLowerCase().includes('irrigation') || 
           machineName.toLowerCase().includes('enrouleur')) {
    specificFields = [
      { name: 'flowRate', label: 'Débit (m³/h)', type: 'number' as const, required: true, placeholder: 'Ex: 50' },
      { name: 'pressure', label: 'Pression (bars)', type: 'number' as const, required: false, placeholder: 'Ex: 6' },
      { name: 'hoseLength', label: 'Longueur du tuyau (m)', type: 'number' as const, required: false, placeholder: 'Ex: 400' },
      { name: 'powerSource', label: 'Source d\'énergie', type: 'select' as const, required: true, options: ['Diesel', 'Électrique', 'Essence', 'PTO (prise de force)'] }
    ]
  }
  // Broyeurs
  else if (machineName.toLowerCase().includes('broyeur')) {
    specificFields = [
      { name: 'workingWidth', label: 'Largeur de travail (m)', type: 'number' as const, required: true, placeholder: 'Ex: 2.5' },
      { name: 'rotorType', label: 'Type de rotor', type: 'select' as const, required: true, options: ['Marteaux', 'Couteaux', 'Fléaux'] },
      { name: 'maxDiameter', label: 'Diamètre max de coupe (cm)', type: 'number' as const, required: false, placeholder: 'Ex: 10' }
    ]
  }
  // Drones
  else if (machineName.toLowerCase().includes('drone')) {
    specificFields = [
      { name: 'maxPayload', label: 'Charge utile max (kg)', type: 'number' as const, required: true, placeholder: 'Ex: 10' },
      { name: 'flightTime', label: 'Autonomie de vol (min)', type: 'number' as const, required: true, placeholder: 'Ex: 20' },
      { name: 'tankCapacity', label: 'Capacité du réservoir (L)', type: 'number' as const, required: false, placeholder: 'Ex: 10' },
      { name: 'coverage', label: 'Superficie couverte par vol (ha)', type: 'number' as const, required: false, placeholder: 'Ex: 3' },
      { name: 'features', label: 'Fonctionnalités', type: 'textarea' as const, required: false, placeholder: 'GPS RTK, Caméra multispectrale, Pulvérisation, etc.' }
    ]
  }
  // Équipements technologiques
  else if (machineName.toLowerCase().includes('gps') || machineName.toLowerCase().includes('capteur') || 
           machineName.toLowerCase().includes('station météo')) {
    specificFields = [
      { name: 'connectivity', label: 'Connectivité', type: 'select' as const, required: true, options: ['WiFi', '4G/5G', 'LoRa', 'Bluetooth'] },
      { name: 'batteryLife', label: 'Autonomie batterie', type: 'text' as const, required: false, placeholder: 'Ex: 6 mois, 1 an' },
      { name: 'features', label: 'Fonctionnalités', type: 'textarea' as const, required: true, placeholder: 'Liste des capteurs et mesures disponibles' }
    ]
  }
  // Autres machines (champs génériques)
  else {
    specificFields = [
      { name: 'specifications', label: 'Spécifications techniques', type: 'textarea' as const, required: true, placeholder: 'Décrivez les caractéristiques techniques principales' },
      { name: 'capacity', label: 'Capacité / Dimension', type: 'text' as const, required: false, placeholder: 'Ex: Capacité, largeur, etc.' }
    ]
  }

  return [...commonFields, ...specificFields]
}

async function main() {
  console.log('🌱 Starting machine templates seed...')

  // Import SERVICE_TYPES
  const SERVICE_TYPES = [
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
  ]

  let createdCount = 0
  let skippedCount = 0

  for (const serviceType of SERVICE_TYPES) {
    console.log(`\n📦 Processing ${serviceType.name}...`)
    
    for (const machine of serviceType.machines) {
      const machineName = machine.name
      const description = machine.subcategory 
        ? `${serviceType.name} - ${machine.subcategory}`
        : serviceType.name

      // Check if template already exists
      const existing = await prisma.machineTemplate.findUnique({
        where: { name: machineName }
      })

      if (existing) {
        console.log(`  ⏭️  Skipped: ${machineName} (already exists)`)
        skippedCount++
        continue
      }

      // Get field definitions for this machine
      const fieldDefinitions = getFieldDefinitionsForMachine(machineName, machine.subcategory)

      try {
        await prisma.machineTemplate.create({
          data: {
            name: machineName,
            description,
            isActive: true,
            fieldDefinitions
          }
        })
        console.log(`  ✅ Created: ${machineName}`)
        createdCount++
      } catch (error) {
        console.error(`  ❌ Failed to create ${machineName}:`, error)
      }
    }
  }

  console.log(`\n✅ Machine templates seed completed!`)
  console.log(`   Created: ${createdCount}`)
  console.log(`   Skipped: ${skippedCount}`)
  console.log(`   Total: ${createdCount + skippedCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
