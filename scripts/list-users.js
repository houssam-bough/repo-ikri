const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n=== COMPTES INSCRITS ===\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Téléphone: ${user.phone || 'Non renseigné'}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Statut: ${user.approvalStatus}`);
      console.log('');
    });

    console.log(`Total: ${users.length} utilisateur(s)\n`);

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
