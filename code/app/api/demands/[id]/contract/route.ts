import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/demands/[id]/contract - Generate contract PDF for a matched demand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: demandId } = await params

    // Get the demand with related data
    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    if (!demand) {
      return NextResponse.json(
        { error: 'Demand not found' },
        { status: 404 }
      )
    }

    if (demand.status !== 'matched') {
      return NextResponse.json(
        { error: 'Demand must be matched to generate a contract' },
        { status: 400 }
      )
    }

    // Get the accepted proposal
    const acceptedProposal = await prisma.proposal.findFirst({
      where: {
        demandId,
        status: 'accepted'
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    if (!acceptedProposal) {
      return NextResponse.json(
        { error: 'No accepted proposal found for this demand' },
        { status: 404 }
      )
    }

    // Generate contract content (plain text for now, can be enhanced to PDF later)
    const contractDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    const contractContent = `
═══════════════════════════════════════════════════════════
                    CONTRAT DE PRESTATION
                        PLATEFORME IKRI
═══════════════════════════════════════════════════════════

Date du contrat: ${contractDate}
Numéro de référence: ${demandId.substring(0, 8).toUpperCase()}

─────────────────────────────────────────────────────────

ENTRE LES PARTIES SUIVANTES:

1. LE CLIENT (Agriculteur):
   Nom: ${demand.farmer.name}
   Email: ${demand.farmer.email}
   Téléphone: ${demand.farmer.phone || 'Non renseigné'}

2. LE PRESTATAIRE:
   Nom: ${acceptedProposal.provider.name}
   Email: ${acceptedProposal.provider.email}
   Téléphone: ${acceptedProposal.provider.phone || 'Non renseigné'}

─────────────────────────────────────────────────────────

OBJET DU CONTRAT:

Prestation: ${demand.title}
Type de service: ${demand.serviceType || 'Non spécifié'}
Machine requise: ${demand.requiredService}
${demand.cropType ? `Type de culture: ${demand.cropType}` : ''}
${demand.area ? `Superficie: ${demand.area} hectares` : ''}

Lieu d'intervention:
  Ville: ${demand.city}
  Adresse: ${demand.address}

Période d'intervention:
  Du: ${new Date(demand.requiredStart).toLocaleDateString('fr-FR')}
  Au: ${new Date(demand.requiredEnd).toLocaleDateString('fr-FR')}

─────────────────────────────────────────────────────────

CONDITIONS FINANCIÈRES:

Prix convenu: ${acceptedProposal.price} MAD

Description de la prestation:
${acceptedProposal.description}

─────────────────────────────────────────────────────────

CONDITIONS GÉNÉRALES:

1. Le prestataire s'engage à fournir le service décrit avec le 
   matériel et l'équipement appropriés.

2. Le client s'engage à fournir un accès au terrain et les 
   conditions nécessaires à la réalisation du travail.

3. Le paiement sera effectué selon les modalités convenues 
   entre les parties.

4. En cas de conditions météorologiques défavorables, les 
   parties conviennent de reporter la prestation d'un commun 
   accord.

5. Toute modification du présent contrat doit faire l'objet 
   d'un accord écrit entre les deux parties.

─────────────────────────────────────────────────────────

SIGNATURES:

Le Client:                          Le Prestataire:
${demand.farmer.name}              ${acceptedProposal.provider.name}

Date: ${contractDate}               Date: ${contractDate}


Signature: _______________         Signature: _______________

─────────────────────────────────────────────────────────

Contrat généré automatiquement par la plateforme IKRI
Pour toute question, contactez-nous à support@ikri.ma

═══════════════════════════════════════════════════════════
    `.trim()

    // Return as downloadable text file
    // In a real implementation, this would generate a proper PDF using a library like PDFKit
    return new NextResponse(contractContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="Contrat_IKRI_${demandId.substring(0, 8)}.txt"`,
      },
    })
  } catch (error) {
    console.error('Generate contract error:', error)
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    )
  }
}
