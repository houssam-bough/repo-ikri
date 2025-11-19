import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const requests = await prisma.vIPUpgradeRequest.findMany({
      where,
      orderBy: { requestDate: 'desc' }
    });

    // Transform to existing type format
    const transformedRequests = requests.map((req: any) => ({
      _id: req.id,
      userId: req.userId,
      userName: req.userName,
      userEmail: req.userEmail,
      currentRole: req.currentRole,
      requestDate: req.requestDate,
      status: req.status
    }));

    return NextResponse.json({ requests: transformedRequests });
  } catch (error) {
    console.error('Get VIP requests error:', error);
    return NextResponse.json({ error: 'Failed to get VIP requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { userId, userName, userEmail, currentRole } = body;

    // Check if user already has a pending request
    const existingRequest = await prisma.vIPUpgradeRequest.findFirst({
      where: {
        userId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'User already has a pending VIP request' }, { status: 400 });
    }

    const vipRequest = await prisma.vIPUpgradeRequest.create({
      data: {
        userId,
        userName,
        userEmail,
        currentRole,
        status: 'pending'
      }
    });

    const transformedRequest = {
      _id: vipRequest.id,
      userId: vipRequest.userId,
      userName: vipRequest.userName,
      userEmail: vipRequest.userEmail,
      currentRole: vipRequest.currentRole,
      requestDate: vipRequest.requestDate,
      status: vipRequest.status
    };

    return NextResponse.json({ request: transformedRequest }, { status: 201 });
  } catch (error) {
    console.error('Create VIP request error:', error);
    return NextResponse.json({ error: 'Failed to create VIP request' }, { status: 500 });
  }
}
