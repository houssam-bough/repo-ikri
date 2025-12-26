import { prisma } from './prisma'

interface NotificationOptions {
  receiverId: string
  receiverName: string
  content: string
  senderId?: string
  senderName?: string
  relatedOfferId?: string
  relatedDemandId?: string
}

/**
 * Envoie une notification via le système de messagerie
 */
export async function sendNotification(options: NotificationOptions) {
  try {
    await prisma.message.create({
      data: {
        senderId: options.senderId || options.receiverId, // Use receiverId as fallback for system notifications
        senderName: options.senderName || 'Système YKRI',
        receiverId: options.receiverId,
        receiverName: options.receiverName,
        content: options.content,
        read: false,
        relatedOfferId: options.relatedOfferId || null,
        relatedDemandId: options.relatedDemandId || null,
      }
    })
    return { success: true }
  } catch (error) {
    console.error('Erreur envoi notification:', error)
    return { success: false, error }
  }
}

/**
 * Envoie une notification à plusieurs utilisateurs
 */
export async function sendBulkNotifications(
  receivers: Array<{ id: string; name: string }>,
  content: string,
  options?: {
    senderId?: string
    senderName?: string
    relatedOfferId?: string
    relatedDemandId?: string
  }
) {
  try {
    const notifications = receivers.map(receiver => ({
      senderId: options?.senderId || receiver.id, // Use receiver's own ID for system notifications
      senderName: options?.senderName || 'Système YKRI',
      receiverId: receiver.id,
      receiverName: receiver.name,
      content,
      read: false,
      relatedOfferId: options?.relatedOfferId || null,
      relatedDemandId: options?.relatedDemandId || null,
    }))

    await prisma.message.createMany({
      data: notifications
    })
    
    return { success: true, count: notifications.length }
  } catch (error) {
    console.error('Erreur envoi notifications groupées:', error)
    return { success: false, error }
  }
}

/**
 * Trouve les utilisateurs à proximité d'une position
 */
export async function getUsersNearby(
  lat: number,
  lon: number,
  radiusKm: number = 50,
  role?: 'Farmer' | 'Provider' | 'Both'
) {
  // Approximation: 1 degré ≈ 111 km
  const latRange = radiusKm / 111
  const lonRange = radiusKm / (111 * Math.cos(lat * Math.PI / 180))

  const where: any = {
    approvalStatus: 'approved',
    locationLat: {
      gte: lat - latRange,
      lte: lat + latRange
    },
    locationLon: {
      gte: lon - lonRange,
      lte: lon + lonRange
    }
  }

  if (role) {
    where.OR = [
      { role },
      { role: 'Both' }
    ]
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      role: true
    }
  })

  return users
}
