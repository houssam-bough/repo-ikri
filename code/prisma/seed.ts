import { PrismaClient, UserRole, ApprovalStatus, BookingStatus, DemandStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.message.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.availabilitySlot.deleteMany()
  await prisma.demand.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.machineTemplate.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared existing data')

  // Create Machine Templates
  const tractorTemplate = await prisma.machineTemplate.create({
    data: {
      name: 'Tractor',
      description: 'Agricultural tractor for farming operations',
      isActive: true,
      fieldDefinitions: [
        { name: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'e.g., John Deere, Massey Ferguson' },
        { name: 'model', label: 'Model', type: 'text', required: true, placeholder: 'Model number or name' },
        { name: 'year', label: 'Year', type: 'number', required: true, placeholder: 'Manufacturing year' },
        { name: 'horsepower', label: 'Horsepower (HP)', type: 'number', required: true, placeholder: 'Engine power' },
        { name: 'condition', label: 'Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Needs Repair'] },
        { name: 'features', label: 'Special Features', type: 'textarea', required: false, placeholder: 'Air conditioning, GPS, etc.' }
      ]
    }
  })

  const harvesterTemplate = await prisma.machineTemplate.create({
    data: {
      name: 'Combine Harvester',
      description: 'Harvesting machine for crops',
      isActive: true,
      fieldDefinitions: [
        { name: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'e.g., Case IH, New Holland' },
        { name: 'model', label: 'Model', type: 'text', required: true, placeholder: 'Model number' },
        { name: 'year', label: 'Year', type: 'number', required: true, placeholder: 'Year' },
        { name: 'headerWidth', label: 'Header Width (meters)', type: 'number', required: true, placeholder: 'Cutting width' },
        { name: 'cropTypes', label: 'Suitable Crop Types', type: 'textarea', required: true, placeholder: 'Wheat, barley, corn, etc.' },
        { name: 'condition', label: 'Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair'] }
      ]
    }
  })

  const sprayerTemplate = await prisma.machineTemplate.create({
    data: {
      name: 'Sprayer',
      description: 'Crop spraying equipment',
      isActive: true,
      fieldDefinitions: [
        { name: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Brand name' },
        { name: 'tankCapacity', label: 'Tank Capacity (liters)', type: 'number', required: true, placeholder: 'Liquid capacity' },
        { name: 'sprayWidth', label: 'Spray Width (meters)', type: 'number', required: true, placeholder: 'Coverage width' },
        { name: 'pumpType', label: 'Pump Type', type: 'select', required: true, options: ['Centrifugal', 'Diaphragm', 'Piston', 'Roller'] },
        { name: 'condition', label: 'Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair'] }
      ]
    }
  })

  console.log('✅ Created machine templates')

  // Hash password for all demo users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@ikri.com',
      password: hashedPassword,
      phone: '+212600000001',
      role: UserRole.Admin,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.5731,
      locationLon: -7.5898, // Casablanca
    },
  })

  const user1 = await prisma.user.create({
    data: {
      name: 'Ahmed Benali',
      email: 'farmer@ikri.com',
      password: hashedPassword,
      phone: '+212600000002',
      role: UserRole.Farmer,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.9716,
      locationLon: -6.8498, // Rabat
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Fatima Zahra',
      email: 'fatima@ikri.com',
      password: hashedPassword,
      phone: '+212600000003',
      role: UserRole.Both,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 31.6295,
      locationLon: -7.9811, // Marrakech
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'Hassan Equipment',
      email: 'provider@ikri.com',
      password: hashedPassword,
      phone: '+212600000004',
      role: UserRole.Provider,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.5731,
      locationLon: -7.5898, // Casablanca
    },
  })

  const user4 = await prisma.user.create({
    data: {
      name: 'Karim Machinery',
      email: 'karim@ikri.com',
      password: hashedPassword,
      phone: '+212600000005',
      role: UserRole.Provider,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 34.0181,
      locationLon: -6.8365, // Kenitra
    },
  })

  const user5 = await prisma.user.create({
    data: {
      name: 'Youssef Farmer',
      email: 'youssef@ikri.com',
      password: hashedPassword,
      phone: '+212600000006',
      role: UserRole.Farmer,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.8869,
      locationLon: -5.5561, // Fes
    },
  })

  console.log('✅ Created users')

  // Create ALL machine types as offers for Admin
  // Import from serviceTypes.ts
  const allMachineTypes = [
    // Travail du sol
    { name: "Tracteurs (<80 CV)", category: "Travail du sol", price: 180, specs: { horsepower: "< 80 CV", type: "Labour profond" } },
    { name: "Tracteurs (80-120 CV)", category: "Travail du sol", price: 250, specs: { horsepower: "80-120 CV", type: "Labour profond" } },
    { name: "Tracteurs (120-200 CV)", category: "Travail du sol", price: 350, specs: { horsepower: "120-200 CV", type: "Labour profond" } },
    { name: "Tracteurs (>200 CV)", category: "Travail du sol", price: 500, specs: { horsepower: "> 200 CV", type: "Labour profond" } },
    { name: "Charrues portées", category: "Travail du sol", price: 150, specs: { type: "Labour profond", mounting: "Portée" } },
    { name: "Charrues semi-portées", category: "Travail du sol", price: 180, specs: { type: "Labour profond", mounting: "Semi-portée" } },
    { name: "Sous-soleuses / Décompacteurs", category: "Travail du sol", price: 200, specs: { type: "Labour profond", depth: "Profond" } },
    { name: "Cover-crops / Déchaumeurs", category: "Travail du sol", price: 120, specs: { type: "Préparation superficielle" } },
    { name: "Rotavator", category: "Travail du sol", price: 180, specs: { type: "Préparation superficielle" } },
    { name: "Herse rotative", category: "Travail du sol", price: 160, specs: { type: "Préparation superficielle" } },
    { name: "Cultivateurs", category: "Travail du sol", price: 140, specs: { type: "Préparation superficielle" } },
    
    // Semis & Plantation
    { name: "Semoirs monograines (maïs, tournesol)", category: "Semis & Plantation", price: 200, specs: { crops: "Maïs, Tournesol", precision: "Monograine" } },
    { name: "Semoirs céréales", category: "Semis & Plantation", price: 180, specs: { crops: "Céréales" } },
    { name: "Semoirs directs", category: "Semis & Plantation", price: 220, specs: { method: "Semis direct" } },
    { name: "Planteuses patates", category: "Semis & Plantation", price: 250, specs: { crop: "Pommes de terre" } },
    { name: "Planteuses légumes", category: "Semis & Plantation", price: 200, specs: { type: "Légumes" } },
    { name: "Planteuses canne à sucre", category: "Semis & Plantation", price: 300, specs: { crop: "Canne à sucre" } },
    
    // Irrigation
    { name: "Tracteurs pompe (motor-pump)", category: "Irrigation", price: 150, specs: { type: "Pompe motorisée" } },
    { name: "Enrouleurs / Irrigation à canon", category: "Irrigation", price: 180, specs: { type: "Canon d'irrigation" } },
    { name: "Rampes d'irrigation", category: "Irrigation", price: 200, specs: { type: "Rampe" } },
    { name: "Motopompes thermiques ou électriques", category: "Irrigation", price: 120, specs: { power: "Thermique/Électrique" } },
    
    // Fertilisation et Traitement
    { name: "Épandeurs d'engrais centrifuges", category: "Fertilisation", price: 140, specs: { type: "Centrifuge" } },
    { name: "Épandeurs de fumier", category: "Fertilisation", price: 160, specs: { material: "Fumier organique" } },
    { name: "Pulvérisateurs portés", category: "Traitement", price: 120, specs: { mounting: "Porté" } },
    { name: "Pulvérisateurs automoteurs", category: "Traitement", price: 250, specs: { type: "Automoteur" } },
    { name: "Atomiseurs arboricoles", category: "Traitement", price: 180, specs: { use: "Arboriculture" } },
    
    // Récolte - Grandes cultures
    { name: "Moissonneuses-batteuses", category: "Récolte", price: 600, specs: { type: "Grandes cultures", capacity: "Haute" } },
    { name: "Ensileuses automotrices", category: "Récolte", price: 500, specs: { type: "Ensilage", mobility: "Automotrice" } },
    { name: "Faucheuses", category: "Récolte", price: 150, specs: { type: "Fauchage" } },
    { name: "Faneuses", category: "Récolte", price: 120, specs: { operation: "Fanage" } },
    { name: "Andaineurs", category: "Récolte", price: 130, specs: { operation: "Andainage" } },
    { name: "Presse à balles rondes", category: "Récolte", price: 200, specs: { baleType: "Rondes" } },
    { name: "Presse à balles cubiques", category: "Récolte", price: 220, specs: { baleType: "Cubiques" } },
    { name: "Ramasseuses-presses", category: "Récolte", price: 180, specs: { combined: "Ramassage + Pressage" } },
    
    // Récolte - Cultures spécialisées
    { name: "Arracheuses de pommes de terre", category: "Récolte", price: 350, specs: { crop: "Pommes de terre" } },
    { name: "Arracheuses carottes / oignons", category: "Récolte", price: 300, specs: { crops: "Carottes, Oignons" } },
    { name: "Récolteuses olives", category: "Récolte", price: 280, specs: { crop: "Olives" } },
    { name: "Récolteuses dattes", category: "Récolte", price: 320, specs: { crop: "Dattes" } },
    { name: "Récolteuses fruits rouges", category: "Récolte", price: 250, specs: { crops: "Fruits rouges" } },
    
    // Fourrage & Élevage
    { name: "Mélangeuses / désileuses", category: "Fourrage", price: 200, specs: { operation: "Mélange alimentaire" } },
    { name: "Broyeurs d'aliments", category: "Fourrage", price: 150, specs: { operation: "Broyage" } },
    { name: "Remorques autochargeuses", category: "Fourrage", price: 180, specs: { loading: "Automatique" } },
    { name: "Remorques distributrices", category: "Fourrage", price: 160, specs: { operation: "Distribution" } },
    { name: "Tondeuses / débroussailleuses", category: "Fourrage", price: 100, specs: { operation: "Tonte/Débroussaillage" } },
    { name: "Chargeurs frontaux", category: "Fourrage", price: 140, specs: { mounting: "Frontal" } },
    
    // Transport
    { name: "Remorques agricoles (3T)", category: "Transport", price: 80, specs: { capacity: "3 tonnes" } },
    { name: "Remorques agricoles (5T)", category: "Transport", price: 100, specs: { capacity: "5 tonnes" } },
    { name: "Remorques agricoles (10T)", category: "Transport", price: 150, specs: { capacity: "10 tonnes" } },
    { name: "Remorques agricoles (>10T)", category: "Transport", price: 200, specs: { capacity: "> 10 tonnes" } },
    { name: "Bennes basculantes", category: "Transport", price: 120, specs: { type: "Basculante" } },
    { name: "Porte-engins", category: "Transport", price: 180, specs: { use: "Transport d'engins" } },
    { name: "Pick-up agricoles", category: "Transport", price: 150, specs: { type: "Pick-up" } },
    
    // Travaux connexes (BTP / Ferme)
    { name: "Mini-pelles", category: "BTP/Ferme", price: 250, specs: { type: "Excavation légère" } },
    { name: "Chargeuses", category: "BTP/Ferme", price: 300, specs: { operation: "Chargement" } },
    { name: "Tractopelles", category: "BTP/Ferme", price: 280, specs: { combined: "Tracteur + Pelle" } },
    { name: "Bulldozers", category: "BTP/Ferme", price: 400, specs: { operation: "Terrassement lourd" } },
    { name: "Niveleuses", category: "BTP/Ferme", price: 350, specs: { operation: "Nivellement" } },
    { name: "Compacteurs", category: "BTP/Ferme", price: 200, specs: { operation: "Compactage" } },
    { name: "Camions-bennes", category: "BTP/Ferme", price: 250, specs: { type: "Camion benne" } },
    
    // Arboriculture & Viticulture
    { name: "Broyeurs de sarments", category: "Arboriculture", price: 150, specs: { material: "Sarments" } },
    { name: "Tailleuses", category: "Arboriculture", price: 180, specs: { operation: "Taille" } },
    { name: "Pulvérisateurs arboricoles/tunnels", category: "Arboriculture", price: 200, specs: { type: "Arboricole/Tunnel" } },
    { name: "Secoueurs d'oliviers", category: "Arboriculture", price: 220, specs: { use: "Récolte olives" } },
    { name: "Plateformes élévatrices", category: "Arboriculture", price: 180, specs: { type: "Élévatrice" } },
    
    // Services technologiques
    { name: "Drones agricoles (pulvérisation)", category: "Technologie", price: 300, specs: { use: "Pulvérisation aérienne" } },
    { name: "Drones agricoles (cartographie NDVI)", category: "Technologie", price: 350, specs: { use: "Cartographie NDVI" } },
    { name: "Stations météo connectées", category: "Technologie", price: 100, specs: { type: "Station météo IoT" } },
    { name: "GPS & guidage RTK", category: "Technologie", price: 200, specs: { precision: "RTK" } },
    { name: "Capteurs de sol / humidité", category: "Technologie", price: 80, specs: { monitoring: "Sol/Humidité" } },
  ]

  console.log(`📦 Creating ${allMachineTypes.length} machine offers for Admin...`)

  // Create all machines for Admin
  for (const machine of allMachineTypes) {
    await prisma.offer.create({
      data: {
        providerId: admin.id,
        providerName: admin.name,
        equipmentType: machine.name,
        description: `${machine.name} - ${machine.category}. Machine professionnelle disponible à la location.`,
        priceRate: machine.price,
        bookingStatus: BookingStatus.waiting,
        city: 'Casablanca',
        address: 'Parc Machines IKRI - Zone Industrielle',
        serviceAreaLat: 33.5731,
        serviceAreaLon: -7.5898,
        customFields: machine.specs,
        availabilitySlots: {
          create: [
            {
              start: new Date('2025-12-15T08:00:00'),
              end: new Date('2025-12-31T18:00:00'),
            },
          ],
        },
      },
    })
  }

  console.log(`✅ Created ${allMachineTypes.length} machine offers for Admin`)

  // Create sample offers for other providers
  const offer3 = await prisma.offer.create({
    data: {
      providerId: user4.id,
      providerName: user4.name,
      equipmentType: 'Tracteurs (80-120 CV)',
      description: 'Tracteur New Holland T6.180 - 120 CV. Excellente condition.',
      priceRate: 280,
      bookingStatus: BookingStatus.waiting,
      city: 'Kenitra',
      address: 'Route de Mehdia',
      serviceAreaLat: 34.0181,
      serviceAreaLon: -6.8365,
      customFields: { brand: 'New Holland', model: 'T6.180', year: 2022, condition: 'Excellent' },
      availabilitySlots: {
        create: [
          {
            start: new Date('2025-12-19T08:00:00'),
            end: new Date('2025-12-24T18:00:00'),
          },
        ],
      },
    },
  })

  const offer4 = await prisma.offer.create({
    data: {
      providerId: user3.id,
      providerName: user3.name,
      equipmentType: 'Moissonneuses-batteuses',
      description: 'Moissonneuse-batteuse Case IH Axial-Flow. Opérateur inclus.',
      priceRate: 650,
      bookingStatus: BookingStatus.waiting,
      city: 'Casablanca',
      address: 'Ferme Ouled Saleh',
      serviceAreaLat: 33.5731,
      serviceAreaLon: -7.5898,
      customFields: { brand: 'Case IH', model: 'Axial-Flow', headerWidth: '7.6m', condition: 'Excellent' },
      availabilitySlots: {
        create: [
          {
            start: new Date('2025-11-20T09:00:00'),
            end: new Date('2025-11-22T17:00:00'),
          },
        ],
      },
    },
  })

  console.log('✅ Created offers with availability slots')

  // Create Demands
  const demand1 = await prisma.demand.create({
    data: {
      farmerId: user1.id,
      farmerName: user1.name,
      title: 'Besoin de tracteur pour labour',
      city: 'Rabat',
      address: 'Zone agricole, Route de Témara',
      requiredService: 'Tractor',
      description: 'Need tractor for 5 hectares of land preparation',
      status: DemandStatus.waiting,
      jobLocationLat: 33.9716,
      jobLocationLon: -6.8498,
      requiredStart: new Date('2025-11-21T08:00:00'),
      requiredEnd: new Date('2025-11-21T16:00:00'),
    },
  })

  const demand2 = await prisma.demand.create({
    data: {
      farmerId: user2.id,
      farmerName: user2.name,
      title: 'Récolte de blé - 10 hectares',
      city: 'Marrakech',
      address: 'Douar Sidi Rahal, Route d\'Essaouira',
      requiredService: 'Harvester',
      description: 'Wheat harvest needed - 10 hectares',
      status: DemandStatus.waiting,
      jobLocationLat: 31.6295,
      jobLocationLon: -7.9811,
      requiredStart: new Date('2025-11-23T07:00:00'),
      requiredEnd: new Date('2025-11-23T18:00:00'),
    },
  })

  const demand3 = await prisma.demand.create({
    data: {
      farmerId: user5.id,
      farmerName: user5.name,
      title: 'Installation système d\'irrigation goutte à goutte',
      city: 'Fès',
      address: 'Zone agricole Aïn Chkef',
      requiredService: 'Irrigation System',
      description: 'Setting up drip irrigation for new field',
      status: DemandStatus.waiting,
      jobLocationLat: 33.8869,
      jobLocationLon: -5.5561,
      requiredStart: new Date('2025-11-20T08:00:00'),
      requiredEnd: new Date('2025-11-22T18:00:00'),
    },
  })

  console.log('✅ Created demands')

  // Create some Reservations
  const reservation1 = await prisma.reservation.create({
    data: {
      farmerId: user1.id,
      farmerName: user1.name,
      farmerPhone: user1.phone,
      offerId: offer1.id,
      providerId: user3.id,
      providerName: user3.name,
      equipmentType: 'Tractor',
      priceRate: 200,
      totalCost: 1600,
      status: 'approved',
      reservedStart: new Date('2025-11-20T08:00:00'),
      reservedEnd: new Date('2025-11-20T16:00:00'),
      approvedAt: new Date(),
    },
  })

  const reservation2 = await prisma.reservation.create({
    data: {
      farmerId: user2.id,
      farmerName: user2.name,
      farmerPhone: user2.phone,
      offerId: offer3.id,
      providerId: user4.id,
      providerName: user4.name,
      equipmentType: 'Irrigation System',
      priceRate: 150,
      totalCost: 900,
      status: 'pending',
      reservedStart: new Date('2025-11-19T08:00:00'),
      reservedEnd: new Date('2025-11-20T18:00:00'),
    },
  })

  console.log('✅ Created reservations')

  // Create Messages
  await prisma.message.create({
    data: {
      senderId: user1.id,
      senderName: user1.name,
      receiverId: user3.id,
      receiverName: user3.name,
      content: 'Hello, I am interested in renting your tractor. Is it available on November 20th?',
      relatedOfferId: offer1.id,
      read: true,
    },
  })

  await prisma.message.create({
    data: {
      senderId: user3.id,
      senderName: user3.name,
      receiverId: user1.id,
      receiverName: user1.name,
      content: 'Yes, the tractor is available. How many hours do you need it for?',
      relatedOfferId: offer1.id,
      read: true,
    },
  })

  await prisma.message.create({
    data: {
      senderId: user1.id,
      senderName: user1.name,
      receiverId: user3.id,
      receiverName: user3.name,
      content: 'I need it for 8 hours. Can we confirm the booking?',
      relatedOfferId: offer1.id,
      read: false,
    },
  })

  console.log('✅ Created messages')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Demo Accounts:')
  console.log('   Admin:       admin@ikri.com    / password123')
  console.log('   Agriculteur: farmer@ikri.com   / password123')
  console.log('   Prestataire: provider@ikri.com / password123')
  console.log('   Les Deux:    fatima@ikri.com   / password123')
  console.log('   Prestataire: karim@ikri.com    / password123')
  console.log('   Agriculteur: youssef@ikri.com  / password123')
  console.log('\n✨ You can now login and test the application!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
