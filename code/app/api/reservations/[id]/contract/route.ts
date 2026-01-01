import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'

// GET /api/reservations/[id]/contract - Generate professional contract PDF for an approved reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params

    // Get the reservation with related data
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        offer: {
          select: {
            id: true,
            equipmentType: true,
            description: true,
            city: true,
            address: true,
          }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation.status !== 'approved') {
      return NextResponse.json(
        { error: 'Reservation must be approved to generate a contract' },
        { status: 400 }
      )
    }

    // Format dates
    const contractDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
    
    const startDate = new Date(reservation.reservedStart).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
    
    const endDate = new Date(reservation.reservedEnd).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    const referenceNumber = `YKRI-RES-${reservationId.substring(0, 8).toUpperCase()}`

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - 2 * margin
    let y = margin

    // Helper function for section headers
    const addSection = (title: string) => {
      y += 3
      doc.setFillColor(34, 139, 34) // Forest green
      doc.rect(margin, y - 4, contentWidth, 7, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin + 2, y)
      doc.setTextColor(0, 0, 0)
      y += 6
    }

    // Check if we need a new page
    const checkPageBreak = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - 20) {
        doc.addPage()
        // Header on new page
        doc.setFillColor(34, 139, 34)
        doc.rect(0, 0, pageWidth, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`YKRI - Contrat ${referenceNumber}`, pageWidth / 2, 8, { align: 'center' })
        doc.setTextColor(0, 0, 0)
        y = 20
      }
    }

    // ==================== HEADER ====================
    doc.setFillColor(34, 139, 34)
    doc.rect(0, 0, pageWidth, 32, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('YKRI', pageWidth / 2, 14, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Plateforme de Services Agricoles', pageWidth / 2, 22, { align: 'center' })
    
    doc.setFontSize(8)
    doc.text('Location de materiel agricole entre professionnels', pageWidth / 2, 28, { align: 'center' })
    
    doc.setTextColor(0, 0, 0)
    y = 38

    // ==================== TITLE ====================
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRAT DE LOCATION DE MATERIEL', pageWidth / 2, y, { align: 'center' })
    y += 6

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('AGRICOLE', pageWidth / 2, y, { align: 'center' })
    y += 8

    // Reference and date box
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Reference: ${referenceNumber}`, margin + 3, y + 5)
    doc.text(`Date: ${contractDate}`, pageWidth - margin - 50, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Ce contrat est etabli via la plateforme YKRI', pageWidth / 2, y + 11, { align: 'center' })
    y += 18

    // ==================== PARTIES ====================
    addSection('ARTICLE 1 : PARTIES CONTRACTANTES')
    y += 2

    const boxHeight = 28
    // Locataire (Farmer)
    doc.setFillColor(240, 248, 240)
    doc.roundedRect(margin, y, contentWidth / 2 - 3, boxHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('LE LOCATAIRE (Agriculteur)', margin + 2, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Nom: ${reservation.farmer.name}`, margin + 2, y + 11)
    doc.text(`Email: ${reservation.farmer.email}`, margin + 2, y + 17)
    doc.text(`Tel: ${reservation.farmer.phone || 'Non renseigne'}`, margin + 2, y + 23)

    // Loueur (Provider)
    doc.setFillColor(240, 248, 240)
    doc.roundedRect(margin + contentWidth / 2 + 3, y, contentWidth / 2 - 3, boxHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('LE LOUEUR (Prestataire)', margin + contentWidth / 2 + 5, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Nom: ${reservation.provider.name}`, margin + contentWidth / 2 + 5, y + 11)
    doc.text(`Email: ${reservation.provider.email}`, margin + contentWidth / 2 + 5, y + 17)
    doc.text(`Tel: ${reservation.provider.phone || 'Non renseigne'}`, margin + contentWidth / 2 + 5, y + 23)
    y += boxHeight + 4

    // ==================== OBJET DU CONTRAT ====================
    addSection('ARTICLE 2 : OBJET DE LA LOCATION')
    y += 2

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const objetText = `Le present contrat a pour objet la mise a disposition par le Loueur, au profit du Locataire, du materiel agricole decrit ci-dessous, pour la duree et aux conditions definies.`
    const objetLines = doc.splitTextToSize(objetText, contentWidth)
    doc.text(objetLines, margin, y)
    y += objetLines.length * 4 + 3

    // Equipment details table
    doc.setFillColor(250, 250, 250)
    doc.rect(margin, y, contentWidth, 18, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, y, contentWidth, 18, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Type de materiel:', margin + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.text(reservation.equipmentType.substring(0, 50), margin + 40, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('Tarif journalier:', margin + 3, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${reservation.priceRate} MAD/jour`, margin + 40, y + 12)
    y += 22

    // ==================== LIEU ====================
    addSection("ARTICLE 3 : LIEU DE MISE A DISPOSITION")
    y += 2

    doc.setFillColor(250, 250, 250)
    doc.rect(margin, y, contentWidth, 14, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, y, contentWidth, 14, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Ville:', margin + 3, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.text(reservation.offer.city || 'A convenir', margin + 20, y + 5)

    doc.setFont('helvetica', 'bold')
    doc.text('Adresse:', margin + 3, y + 11)
    doc.setFont('helvetica', 'normal')
    doc.text((reservation.offer.address || 'A convenir').substring(0, 60), margin + 25, y + 11)
    y += 18

    // ==================== PERIODE ====================
    addSection('ARTICLE 4 : DUREE DE LA LOCATION')
    y += 2

    doc.setFillColor(250, 250, 250)
    doc.rect(margin, y, contentWidth, 10, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, y, contentWidth, 10, 'S')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Date de debut:', margin + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.text(startDate, margin + 32, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.text('Date de fin:', margin + contentWidth / 2, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.text(endDate, margin + contentWidth / 2 + 25, y + 6)
    y += 14

    // ==================== CONDITIONS FINANCIERES ====================
    addSection('ARTICLE 5 : CONDITIONS FINANCIERES')
    y += 2

    // Price highlight box
    doc.setFillColor(34, 139, 34)
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`TARIF: ${reservation.priceRate} MAD/jour`, pageWidth / 2, y + 7, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`MONTANT TOTAL: ${reservation.totalCost?.toFixed(2) || '0.00'} MAD`, pageWidth / 2, y + 14, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y += 22

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const paiementText = `Le paiement sera effectue selon les modalites convenues entre les parties. Une caution peut etre demandee par le Loueur.`
    const paiementLines = doc.splitTextToSize(paiementText, contentWidth)
    doc.text(paiementLines, margin, y)
    y += paiementLines.length * 3.5 + 4

    // ==================== OBLIGATIONS ====================
    checkPageBreak(50)
    addSection('ARTICLE 6 : OBLIGATIONS DES PARTIES')
    y += 3

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('6.1 Obligations du Loueur:', margin, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    const obligLoueur = [
      "- Fournir le materiel en bon etat de fonctionnement",
      '- Assurer la maintenance avant la mise a disposition',
      '- Fournir les instructions d\'utilisation',
      "- Garantir la conformite aux normes de securite"
    ]
    obligLoueur.forEach(line => {
      doc.text(line, margin + 3, y)
      y += 4
    })
    y += 2

    doc.setFont('helvetica', 'bold')
    doc.text('6.2 Obligations du Locataire:', margin, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    const obligLocataire = [
      "- Utiliser le materiel conformement a sa destination",
      '- Prendre soin du materiel et le maintenir en bon etat',
      '- Restituer le materiel a la date convenue',
      '- Signaler tout dysfonctionnement ou dommage'
    ]
    obligLocataire.forEach(line => {
      doc.text(line, margin + 3, y)
      y += 4
    })
    y += 3

    // ==================== RESPONSABILITE ====================
    checkPageBreak(25)
    addSection('ARTICLE 7 : RESPONSABILITE ET ASSURANCE')
    y += 2

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const respText = `Le Locataire est responsable du materiel pendant toute la duree de la location. Il s'engage a assurer le materiel contre tous risques (vol, incendie, dommages). En cas de dommage, le Locataire s'engage a indemniser le Loueur.`
    const respLines = doc.splitTextToSize(respText, contentWidth)
    doc.text(respLines, margin, y)
    y += respLines.length * 3.5 + 3

    // ==================== RESTITUTION ====================
    checkPageBreak(20)
    addSection('ARTICLE 8 : RESTITUTION DU MATERIEL')
    y += 2

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const restitText = `Le materiel doit etre restitue dans l'etat dans lequel il a ete mis a disposition, propre et en bon etat de fonctionnement. Tout retard de restitution pourra entrainer des frais supplementaires.`
    const restitLines = doc.splitTextToSize(restitText, contentWidth)
    doc.text(restitLines, margin, y)
    y += restitLines.length * 3.5 + 3

    // ==================== LITIGES ====================
    checkPageBreak(20)
    addSection('ARTICLE 9 : RESOLUTION DES LITIGES')
    y += 2

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const litigeText = `En cas de litige, les parties s'engagent a rechercher une solution amiable. A defaut, le litige sera soumis aux tribunaux competents du Royaume du Maroc.`
    const litigeLines = doc.splitTextToSize(litigeText, contentWidth)
    doc.text(litigeLines, margin, y)
    y += litigeLines.length * 3.5 + 5

    // ==================== SIGNATURES ====================
    checkPageBreak(45)
    addSection('ARTICLE 10 : SIGNATURES')
    y += 5

    const sigBoxWidth = (contentWidth - 10) / 2
    const sigBoxHeight = 32

    // Locataire signature
    doc.setDrawColor(150, 150, 150)
    doc.setLineDashPattern([2, 2], 0)
    doc.rect(margin, y, sigBoxWidth, sigBoxHeight, 'S')
    doc.setLineDashPattern([], 0)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('LE LOCATAIRE', margin + sigBoxWidth / 2, y + 6, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(reservation.farmer.name, margin + sigBoxWidth / 2, y + 12, { align: 'center' })
    doc.text(`Date: ${contractDate}`, margin + sigBoxWidth / 2, y + 18, { align: 'center' })
    doc.setTextColor(128, 128, 128)
    doc.text('Signature:', margin + 3, y + 28)
    doc.setTextColor(0, 0, 0)

    // Loueur signature
    doc.setDrawColor(150, 150, 150)
    doc.setLineDashPattern([2, 2], 0)
    doc.rect(margin + sigBoxWidth + 10, y, sigBoxWidth, sigBoxHeight, 'S')
    doc.setLineDashPattern([], 0)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('LE LOUEUR', margin + sigBoxWidth + 10 + sigBoxWidth / 2, y + 6, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(reservation.provider.name, margin + sigBoxWidth + 10 + sigBoxWidth / 2, y + 12, { align: 'center' })
    doc.text(`Date: ${contractDate}`, margin + sigBoxWidth + 10 + sigBoxWidth / 2, y + 18, { align: 'center' })
    doc.setTextColor(128, 128, 128)
    doc.text('Signature:', margin + sigBoxWidth + 13, y + 28)
    doc.setTextColor(0, 0, 0)

    // ==================== FOOTER ON ALL PAGES ====================
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFillColor(34, 139, 34)
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(`Contrat YKRI - ${referenceNumber} - Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Return as downloadable PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Contrat_Location_YKRI_${referenceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Generate reservation contract error:', error)
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    )
  }
}
