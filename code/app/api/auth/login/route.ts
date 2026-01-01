import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by phone or email
    // If the email contains only numbers and +, it's a phone number
    const isPhone = /^[\d+\s-]+$/.test(email.replace(/@ykri\.com$/, ''))
    
    let user
    if (isPhone) {
      // Extract phone number (remove @ykri.com suffix if present)
      const phone = email.replace(/@ykri\.com$/, '')
      user = await prisma.user.findFirst({
        where: { phone: phone }
      })
    } else {
      // Find by email
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check approval status
    if (user.approvalStatus === 'pending') {
      return NextResponse.json(
        { error: 'Account pending approval' },
        { status: 403 }
      )
    } else if (user.approvalStatus === 'denied') {
      return NextResponse.json(
        { error: 'Account access denied' },
        { status: 403 }
      )
    }

    // Return user without password, transform to match existing type
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
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
