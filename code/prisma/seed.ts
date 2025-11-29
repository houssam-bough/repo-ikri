import { PrismaClient, UserRole, ApprovalStatus, OfferStatus, DemandStatus } from '@prisma/client'
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
      role: UserRole.User,
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
      role: UserRole.User,
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
      role: UserRole.User,
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
      role: UserRole.User,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 34.0181,
      locationLon: -6.8365, // Kenitra
    },
  })

  const user5 = await prisma.user.create({
    data: {
      name: 'Youssef User',
      email: 'vip@ikri.com',
      password: hashedPassword,
      phone: '+212600000006',
      role: UserRole.User,
      approvalStatus: ApprovalStatus.approved,
      locationLat: 33.8869,
      locationLon: -5.5561, // Fes
    },
  })

  console.log('✅ Created users')

  // Create Offers
  const offer1 = await prisma.offer.create({
    data: {
      providerId: user3.id,
      providerName: user3.name,
      equipmentType: 'Tractor',
      description: 'John Deere 5075E - 75HP tractor with rotary tiller attachment. Perfect for land preparation.',
      priceRate: 200,
      status: OfferStatus.approved,
      city: 'Casablanca',
      address: 'Zone Industrielle Sidi Bernoussi',
      serviceAreaLat: 33.5731,
      serviceAreaLon: -7.5898,
      availabilitySlots: {
        create: [
          {
            start: new Date('2025-11-20T08:00:00'),
            end: new Date('2025-11-20T18:00:00'),
          },
          {
            start: new Date('2025-11-21T08:00:00'),
            end: new Date('2025-11-21T18:00:00'),
          },
          {
            start: new Date('2025-11-25T08:00:00'),
            end: new Date('2025-11-27T18:00:00'),
          },
        ],
      },
    },
  })

  const offer2 = await prisma.offer.create({
    data: {
      providerId: user3.id,
      providerName: user3.name,
      equipmentType: 'Harvester',
      description: 'Combine harvester for wheat and barley. Includes operator.',
      priceRate: 500,
      status: OfferStatus.approved,
      city: 'Casablanca',
      address: 'Ferme Ouled Saleh',
      serviceAreaLat: 33.5731,
      serviceAreaLon: -7.5898,
      availabilitySlots: {
        create: [
          {
            start: new Date('2025-11-22T07:00:00'),
            end: new Date('2025-11-22T19:00:00'),
          },
          {
            start: new Date('2025-11-23T07:00:00'),
            end: new Date('2025-11-23T19:00:00'),
          },
        ],
      },
    },
  })

  const offer3 = await prisma.offer.create({
    data: {
      providerId: user4.id,
      providerName: user4.name,
      equipmentType: 'Irrigation System',
      description: 'Mobile drip irrigation system. Setup included.',
      priceRate: 150,
      status: OfferStatus.approved,
      city: 'Kenitra',
      address: 'Route de Mehdia',
      serviceAreaLat: 34.0181,
      serviceAreaLon: -6.8365,
      availabilitySlots: {
        create: [
          {
            start: new Date('2025-11-19T08:00:00'),
            end: new Date('2025-11-24T18:00:00'),
          },
        ],
      },
    },
  })

  const offer4 = await prisma.offer.create({
    data: {
      providerId: user5.id,
      providerName: user5.name,
      equipmentType: 'Sprayer',
      description: 'Agricultural sprayer for pesticides and fertilizers.',
      priceRate: 100,
      status: OfferStatus.approved,
      city: 'Fes',
      address: 'Route de Sefrou',
      serviceAreaLat: 33.8869,
      serviceAreaLon: -5.5561,
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
      status: DemandStatus.open,
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
      status: DemandStatus.open,
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
      status: DemandStatus.open,
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
  console.log('   Admin:    admin@ikri.com    / password123')
  console.log('   User:     farmer@ikri.com   / password123')
  console.log('   User:     provider@ikri.com / password123')
  console.log('   User:     vip@ikri.com      / password123')
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
