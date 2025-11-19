import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/messages/conversations?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ conversations: [] })
    }

    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group by conversation partner
    const conversationsMap = new Map()
    
    messages.forEach((msg: any) => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId
      const otherUserName = msg.senderId === userId ? msg.receiverName : msg.senderName
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          otherUserId,
          otherUserName,
          lastMessage: msg.content,
          lastMessageDate: msg.createdAt,
          unreadCount: 0
        })
      }
      
      // Count unread messages
      if (msg.receiverId === userId && !msg.read) {
        conversationsMap.get(otherUserId).unreadCount++
      }
    })

    const conversations = Array.from(conversationsMap.values())

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
