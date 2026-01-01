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

  // Create Machine Templates for ALL 69 machines
  const allMachineNames = [
    "Tracteurs (<80 CV)", "Tracteurs (80-120 CV)", "Tracteurs (120-200 CV)", "Tracteurs (>200 CV)",
    "Charrues portées", "Charrues semi-portées", "Sous-soleuses / Décompacteurs",
    "Cover-crops / Déchaumeurs", "Rotavator", "Herse rotative", "Cultivateurs",
    "Semoirs monograines (maïs, tournesol)", "Semoirs céréales", "Semoirs directs",
    "Planteuses patates", "Planteuses légumes", "Planteuses canne à sucre",
    "Tracteurs pompe (motor-pump)", "Enrouleurs / Irrigation à canon", "Rampes d'irrigation",
    "Motopompes thermiques ou électriques",
    "Épandeurs d'engrais centrifuges", "Épandeurs de fumier",
    "Pulvérisateurs portés", "Pulvérisateurs automoteurs", "Atomiseurs arboricoles",
    "Moissonneuses-batteuses", "Ensileuses automotrices", "Faucheuses", "Faneuses",
    "Andaineurs", "Presse à balles rondes", "Presse à balles cubiques", "Ramasseuses-presses",
    "Arracheuses de pommes de terre", "Arracheuses carottes / oignons",
    "Récolteuses olives", "Récolteuses dattes", "Récolteuses fruits rouges",
    "Mélangeuses / désileuses", "Broyeurs d'aliments", "Remorques autochargeuses",
    "Remorques distributrices", "Tondeuses / débroussailleuses", "Chargeurs frontaux",
    "Remorques agricoles (3T)", "Remorques agricoles (5T)", "Remorques agricoles (10T)",
    "Remorques agricoles (>10T)", "Bennes basculantes", "Porte-engins", "Pick-up agricoles",
    "Mini-pelles", "Chargeuses", "Tractopelles", "Bulldozers", "Niveleuses",
    "Compacteurs", "Camions-bennes",
    "Broyeurs de sarments", "Tailleuses", "Pulvérisateurs arboricoles/tunnels",
    "Secoueurs d'oliviers", "Plateformes élévatrices",
    "Drones agricoles (pulvérisation)", "Drones agricoles (cartographie NDVI)",
    "Stations météo connectées", "GPS & guidage RTK", "Capteurs de sol / humidité"
  ]

  const baseFieldDefinitions = [
    { name: 'brand', label: 'Marque', type: 'text', required: false, placeholder: 'Ex: John Deere, Massey Ferguson' },
    { name: 'model', label: 'Modèle', type: 'text', required: false, placeholder: 'Numéro ou nom du modèle' },
    { name: 'year', label: 'Année', type: 'number', required: false, placeholder: 'Année de fabrication' },
    { name: 'condition', label: 'État', type: 'select', required: false, options: ['Excellent', 'Bon', 'Acceptable'] },
    { name: 'features', label: 'Caractéristiques', type: 'textarea', required: false, placeholder: 'Détails supplémentaires...' }
  ]

  console.log(`📦 Creating ${allMachineNames.length} machine templates...`)
  
  for (const machineName of allMachineNames) {
    await prisma.machineTemplate.create({
      data: {
        name: machineName,
        description: `Template pour ${machineName}`,
        isActive: true,
        fieldDefinitions: baseFieldDefinitions
      }
    })
  }

  console.log(`✅ Created ${allMachineNames.length} machine templates`)

  // Hash password for all demo users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Users
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@ykri.com',
      password: hashedPassword,
      phone: '+212600000001',
      role: UserRole.Admin,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.5731,
      locationLon: -7.5898, // Casablanca
    },
  })

  await prisma.user.create({
    data: {
      name: 'Ahmed Benali',
      email: 'farmer@ykri.com',
      password: hashedPassword,
      phone: '+212600000002',
      role: UserRole.Both,
      activeMode: 'Farmer',
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.9716,
      locationLon: -6.8498, // Rabat
    },
  })

  await prisma.user.create({
    data: {
      name: 'Fatima Zahra',
      email: 'fatima@ykri.com',
      password: hashedPassword,
      phone: '+212600000003',
      role: UserRole.Both,
      activeMode: 'Farmer',
      approvalStatus: ApprovalStatus.approved,
      locationLat: 31.6295,
      locationLon: -7.9811, // Marrakech
    },
  })

  await prisma.user.create({
    data: {
      name: 'Hassan Equipment',
      email: 'provider@ykri.com',
      password: hashedPassword,
      phone: '+212600000004',
      role: UserRole.Both,
      activeMode: 'Provider',
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.5731,
      locationLon: -7.5898, // Casablanca
    },
  })

  await prisma.user.create({
    data: {
      name: 'Karim Machinery',
      email: 'karim@ykri.com',
      password: hashedPassword,
      phone: '+212600000005',
      role: UserRole.Both,
      activeMode: 'Provider',
      approvalStatus: ApprovalStatus.approved,
      locationLat: 34.0181,
      locationLon: -6.8365, // Kenitra
    },
  })

  await prisma.user.create({
    data: {
      name: 'Youssef Farmer',
      email: 'youssef@ykri.com',
      password: hashedPassword,
      phone: '+212600000006',
      role: UserRole.Both,
      activeMode: 'Farmer',
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.8869,
      locationLon: -5.5561, // Fes
    },
  })

  console.log('✅ Created users')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Demo Accounts:')
  console.log('   Admin:       admin@ykri.com    / password123')
  console.log('   Agriculteur: farmer@ykri.com   / password123')
  console.log('   Prestataire: provider@ykri.com / password123')
  console.log('   Les Deux:    fatima@ykri.com   / password123')
  console.log('   Prestataire: karim@ykri.com    / password123')
  console.log('   Agriculteur: youssef@ykri.com  / password123')
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
