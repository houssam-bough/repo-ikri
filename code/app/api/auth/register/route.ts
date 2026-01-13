import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, role, location } = body

    if (!name || !email || !password || !role || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        role,
        // TESTING: Auto-approve all new accounts (comment out for production)
        approvalStatus: 'approved',
        // PRODUCTION: Require admin approval (uncomment for production)
        // approvalStatus: 'pending',
        activeMode: role === 'Both' ? 'Farmer' : null,
        locationLat: location.coordinates[1],
        locationLon: location.coordinates[0]
      }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        approvalStatus: user.approvalStatus,
        activeMode: user.activeMode || 'Farmer',
        location: {
          type: 'Point',
          coordinates: [user.locationLon, user.locationLat]
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
