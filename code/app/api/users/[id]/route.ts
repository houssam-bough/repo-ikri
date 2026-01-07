import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        activeMode: true,
        locationLat: true,
        locationLon: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Transform to match existing type
    const transformedUser = {
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approvalStatus: user.approvalStatus,
      activeMode: user.activeMode,
      location: {
        type: 'Point' as const,
        coordinates: [user.locationLon, user.locationLat]
      },
      createdAt: user.createdAt
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, location, role, approvalStatus, activeMode } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (role) updateData.role = role
    if (approvalStatus) updateData.approvalStatus = approvalStatus
    if (activeMode !== undefined) updateData.activeMode = activeMode
    if (location) {
      updateData.locationLat = location.coordinates[1]
      updateData.locationLon = location.coordinates[0]
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        activeMode: true,
        locationLat: true,
        locationLon: true
      }
    })

    // Notifications 9 & 10: Admin approuve/rejette compte → Utilisateur
    if (approvalStatus && approvalStatus !== body.previousApprovalStatus) {
      try {
        if (approvalStatus === 'approved') {
          await sendNotification({
            receiverId: id,
            receiverName: user.name,
            content: `🎉 Bienvenue sur YKRI ! Votre compte a été approuvé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.`,
            senderName: 'Équipe YKRI',
            actionButton: {
              label: '🏠 Aller au tableau de bord',
              targetView: 'dashboard'
            }
          })
        } else if (approvalStatus === 'rejected') {
          await sendNotification({
            receiverId: id,
            receiverName: user.name,
            content: `⚠️ Compte non approuvé. Malheureusement, votre demande d'inscription n'a pas pu être validée. Contactez-nous pour plus d'informations.`,
            senderName: 'Équipe YKRI'
          })
        }
      } catch (notifError) {
        console.error('Failed to send approval notification:', notifError)
      }
    }

    // Transform to match existing type
    const transformedUser = {
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approvalStatus: user.approvalStatus,
      activeMode: user.activeMode,
      location: {
        type: 'Point' as const,
        coordinates: [user.locationLon, user.locationLat]
      }
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of admin users
    if (user.role === 'Admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    // Delete user (cascade delete will handle related records based on schema)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
