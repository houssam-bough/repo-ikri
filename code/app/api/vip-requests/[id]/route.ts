import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, upgradeUser } = body;

    // If approving, also upgrade the user role
    if (status === 'approved' && upgradeUser) {
      const vipRequest = await prisma.vIPUpgradeRequest.findUnique({
        where: { id: params.id }
      });

      if (!vipRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      // Update user role to VIP
      await prisma.user.update({
        where: { id: vipRequest.userId },
        data: { role: 'vip' }
      });
    }

    // Update request status
    const updated = await prisma.vIPUpgradeRequest.update({
      where: { id: params.id },
      data: { status }
    });

    const transformedRequest = {
      _id: updated.id,
      userId: updated.userId,
      userName: updated.userName,
      userEmail: updated.userEmail,
      currentRole: updated.currentRole,
      requestDate: updated.requestDate,
      status: updated.status
    };

    return NextResponse.json({ request: transformedRequest });
  } catch (error) {
    console.error('Update VIP request error:', error);
    return NextResponse.json({ error: 'Failed to update VIP request' }, { status: 500 });
  }
}
