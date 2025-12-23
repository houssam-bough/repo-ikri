const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteOffersAndDemands() {
  try {
    console.log('\n🗑️  Suppression des offres et demandes...\n');

    // Delete all reservations first (they reference offers)
    const deletedReservations = await prisma.reservation.deleteMany({});
    console.log(`✅ ${deletedReservations.count} réservation(s) supprimée(s)`);

    // Delete all proposals (they reference demands)
    const deletedProposals = await prisma.proposal.deleteMany({});
    console.log(`✅ ${deletedProposals.count} proposition(s) supprimée(s)`);

    // Delete all offers
    const deletedOffers = await prisma.offer.deleteMany({});
    console.log(`✅ ${deletedOffers.count} offre(s) supprimée(s)`);

    // Delete all demands
    const deletedDemands = await prisma.demand.deleteMany({});
    console.log(`✅ ${deletedDemands.count} demande(s) supprimée(s)`);

    console.log('\n✨ Toutes les offres et demandes ont été supprimées avec succès!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOffersAndDemands();
