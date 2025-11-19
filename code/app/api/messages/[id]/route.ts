import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { read } = body;

    const message = await prisma.message.update({
      where: { id: params.id },
      data: { read }
    });

    // Transform to existing type format
    const transformedMessage = {
      _id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      receiverId: message.receiverId,
      receiverName: message.receiverName,
      content: message.content,
      relatedOfferId: message.relatedOfferId,
      relatedDemandId: message.relatedDemandId,
      createdAt: message.createdAt,
      read: message.read
    };

    return NextResponse.json({ message: transformedMessage });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
