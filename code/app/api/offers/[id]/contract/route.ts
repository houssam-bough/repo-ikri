import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get offer with approved reservation
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Get approved reservation for this offer
    const reservation = await prisma.reservation.findFirst({
      where: {
        offerId: id,
        status: 'approved'
      },
      include: {
        farmer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'No approved reservation found for this offer' },
        { status: 404 }
      )
    }

    // Calculate duration in days
    const startDate = new Date(reservation.reservedStart)
    const endDate = new Date(reservation.reservedEnd)
    const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Generate contract text
    const contractText = `
═══════════════════════════════════════════════════════════════
                    CONTRAT DE LOCATION IKRI
                  Plateforme Agricole du Maroc
═══════════════════════════════════════════════════════════════

CONTRAT N°: ${reservation.id.substring(0, 8).toUpperCase()}
Date de génération: ${new Date().toLocaleDateString('fr-FR', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

───────────────────────────────────────────────────────────────
                      PARTIES CONTRACTANTES
───────────────────────────────────────────────────────────────

LE PRESTATAIRE (Propriétaire de la machine):
  Nom: ${offer.provider.name}
  Email: ${offer.provider.email}
  Téléphone: ${offer.provider.phone || 'Non fourni'}
  
LE LOCATAIRE (Agriculteur):
  Nom: ${reservation.farmer.name}
  Email: ${reservation.farmer.email}
  Téléphone: ${reservation.farmer.phone || 'Non fourni'}

───────────────────────────────────────────────────────────────
                    OBJET DE LA LOCATION
───────────────────────────────────────────────────────────────

Équipement loué: ${offer.equipmentType}
Description: ${offer.description || 'Non spécifiée'}
Localisation: ${offer.city}, ${offer.address}

───────────────────────────────────────────────────────────────
                    PÉRIODE ET CONDITIONS
───────────────────────────────────────────────────────────────

Date de début: ${startDate.toLocaleDateString('fr-FR')}
Date de fin: ${endDate.toLocaleDateString('fr-FR')}
Durée: ${durationInDays} jour(s)

Tarif journalier: ${offer.priceRate} MAD/jour
Montant total: ${reservation.totalCost || (offer.priceRate * durationInDays)} MAD

───────────────────────────────────────────────────────────────
                    CONDITIONS GÉNÉRALES
───────────────────────────────────────────────────────────────

1. OBLIGATIONS DU PRESTATAIRE:
   - Fournir l'équipement en bon état de fonctionnement
   - Assurer l'entretien préalable de la machine
   - Fournir les instructions d'utilisation nécessaires
   - Garantir la disponibilité aux dates convenues

2. OBLIGATIONS DU LOCATAIRE:
   - Utiliser l'équipement de manière appropriée
   - Restituer l'équipement dans l'état initial
   - Payer le montant convenu selon les modalités établies
   - Signaler immédiatement toute panne ou problème

3. RESPONSABILITÉS:
   - Le locataire est responsable des dommages causés à l'équipement
   - Le prestataire garantit le bon fonctionnement de l'équipement
   - Assurance: À charge du prestataire pour son équipement
   
4. CONDITIONS DE PAIEMENT:
   - 30% à la signature du contrat
   - 70% à la livraison de l'équipement
   - Mode de paiement: À convenir entre les parties

5. RÉSILIATION:
   - Annulation possible 48h avant le début avec remboursement de 50%
   - En cas de force majeure, remboursement intégral
   - Retard de paiement: Pénalités de 5% par jour

───────────────────────────────────────────────────────────────
                        SIGNATURES
───────────────────────────────────────────────────────────────

Le présent contrat est établi en deux exemplaires, chaque partie
reconnaissant en avoir reçu un exemplaire.

Date d'acceptation: ${reservation.approvedAt ? new Date(reservation.approvedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}

Le Prestataire:                    Le Locataire:
${offer.provider.name}             ${reservation.farmer.name}

_____________________              _____________________
     Signature                          Signature


═══════════════════════════════════════════════════════════════
            GÉNÉRÉ AUTOMATIQUEMENT PAR LA PLATEFORME IKRI
                      www.ikri-platform.ma
═══════════════════════════════════════════════════════════════
`

    // Return as downloadable text file
    return new NextResponse(contractText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="Contrat_IKRI_${reservation.id.substring(0, 8)}.txt"`
      }
    })

  } catch (error) {
    console.error('Generate contract error:', error)
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    )
  }
}
