import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/messages - Get messages for conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Get unread system notifications
    if (userId && unreadOnly) {
      const messages = await prisma.message.findMany({
        where: {
          receiverId: userId,
          read: false
          // System notifications are identified by content starting with 🔔 or no senderId
        },
        orderBy: { createdAt: 'desc' },
        take: 10
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
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
        fileName: msg.fileName,
        audioUrl: msg.audioUrl,
        audioDuration: msg.audioDuration,
        actionButton: msg.actionButton,
        createdAt: msg.createdAt
      }))

      return NextResponse.json({ messages: transformedMessages })
    }

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
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
        fileName: msg.fileName,
        audioUrl: msg.audioUrl,
        audioDuration: msg.audioDuration,
        actionButton: msg.actionButton,
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
        relatedDemandId: body.relatedDemandId || null,
        fileUrl: body.fileUrl || null,
        fileType: body.fileType || null,
        fileName: body.fileName || null,
        audioUrl: body.audioUrl || null,
        audioDuration: body.audioDuration || null
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
      fileUrl: message.fileUrl,
      fileType: message.fileType,
      fileName: message.fileName,
      audioUrl: message.audioUrl,
      audioDuration: message.audioDuration,
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

// PATCH /api/messages - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageIds } = body

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: 'messageIds array is required' },
        { status: 400 }
      )
    }

    await prisma.message.updateMany({
      where: {
        id: { in: messageIds }
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark messages as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
