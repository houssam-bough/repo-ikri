import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating machine templates to French...')

  // Get all templates
  const templates = await prisma.machineTemplate.findMany()

  let updatedCount = 0

  for (const template of templates) {
    let needsUpdate = false
    const updatedFields = template.fieldDefinitions.map((field: any) => {
      // Check if options exist and contain English values
      if (field.options && Array.isArray(field.options)) {
        const hasEnglish = field.options.some((opt: string) => 
          ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Mechanical', 'Hydrostatic', 
           'Powershift', 'CVT', 'Yes', 'No', 'Centrifugal', 'Diaphragm', 'Piston', 
           'Roller', 'Fixed', 'Folding', 'Suspended', 'Tunnel', 'Pneumatic', 
           'Round', 'Cubic/Square', 'String', 'Net', 'String and net', 'Manual', 
           'Semi-automatic', 'Automatic', 'Diesel', 'Electric', 'Gasoline', 
           'PTO (power take-off)', 'Hammers', 'Knives', 'Flails', 'WiFi', 
           '4G/5G', 'LoRa', 'Bluetooth'].includes(opt)
        )
        
        if (hasEnglish) {
          needsUpdate = true
          // Translate options
          const translatedOptions = field.options.map((opt: string) => {
            const translations: Record<string, string> = {
              'Excellent': 'Excellent',
              'Good': 'Bon',
              'Fair': 'Acceptable',
              'Needs Repair': 'Nécessite réparation',
              'Mechanical': 'Mécanique',
              'Hydrostatic': 'Hydrostatique',
              'Powershift': 'Powershift',
              'CVT': 'CVT',
              'Yes': 'Oui',
              'No': 'Non',
              'Centrifugal': 'Centrifuge',
              'Diaphragm': 'Membrane',
              'Piston': 'Piston',
              'Roller': 'Roller',
              'Fixed': 'Fixe',
              'Folding': 'Pliante',
              'Suspended': 'Suspendue',
              'Tunnel': 'Tunnel',
              'Pneumatic': 'Pneumatique',
              'Round': 'Ronde',
              'Cubic/Square': 'Cubique/Carrée',
              'String': 'Ficelle',
              'Net': 'Filet',
              'String and net': 'Ficelle et filet',
              'Manual': 'Manuel',
              'Semi-automatic': 'Semi-automatique',
              'Automatic': 'Automatique',
              'Diesel': 'Diesel',
              'Electric': 'Électrique',
              'Gasoline': 'Essence',
              'PTO (power take-off)': 'PTO (prise de force)',
              'Hammers': 'Marteaux',
              'Knives': 'Couteaux',
              'Flails': 'Fléaux',
              'WiFi': 'WiFi',
              '4G/5G': '4G/5G',
              'LoRa': 'LoRa',
              'Bluetooth': 'Bluetooth'
            }
            return translations[opt] || opt
          })
          return { ...field, options: translatedOptions }
        }
      }
      return field
    })

    if (needsUpdate) {
      await prisma.machineTemplate.update({
        where: { id: template.id },
        data: { fieldDefinitions: updatedFields }
      })
      console.log(`  ✅ Updated: ${template.name}`)
      updatedCount++
    }
  }

  console.log(`\n✅ Update completed!`)
  console.log(`   Updated: ${updatedCount}`)
  console.log(`   Total templates: ${templates.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
