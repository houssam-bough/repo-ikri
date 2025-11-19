import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/messages - Get messages for conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')

    if (userId && otherUserId) {
      // Get conversation between two users
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' }
      })

      const transformedMessages = messages.map((msg: any) => ({
        _id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        receiverId: msg.receiverId,
        receiverName: msg.receiverName,
        content: msg.content,
        read: msg.read,
        relatedOfferId: msg.relatedOfferId,
        relatedDemandId: msg.relatedDemandId,
        createdAt: msg.createdAt
      }))

      return NextResponse.json({ messages: transformedMessages })
    }

    return NextResponse.json({ messages: [] })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const message = await prisma.message.create({
      data: {
        senderId: body.senderId,
        senderName: body.senderName,
        receiverId: body.receiverId,
        receiverName: body.receiverName,
        content: body.content,
        read: false,
        relatedOfferId: body.relatedOfferId || null,
        relatedDemandId: body.relatedDemandId || null
      }
    })

    const transformedMessage = {
      _id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      receiverId: message.receiverId,
      receiverName: message.receiverName,
      content: message.content,
      read: message.read,
      relatedOfferId: message.relatedOfferId,
      relatedDemandId: message.relatedDemandId,
      createdAt: message.createdAt
    }

    return NextResponse.json({ message: transformedMessage }, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
