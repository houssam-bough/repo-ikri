import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/search?q=name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        },
        approvalStatus: 'approved'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        locationLat: true,
        locationLon: true
      },
      take: 20
    })

    // Transform to match existing type
    const transformedUsers = users.map((user: any) => ({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approvalStatus: user.approvalStatus,
      location: {
        type: 'Point' as const,
        coordinates: [user.locationLon, user.locationLat]
      }
    }))

    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}
