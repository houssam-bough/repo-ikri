import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/machine-templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await prisma.machineTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Machine template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Get machine template error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch machine template' },
      { status: 500 }
    )
  }
}

// PATCH /api/machine-templates/[id] - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const template = await prisma.machineTemplate.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.fieldDefinitions && { fieldDefinitions: body.fieldDefinitions }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      }
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Update machine template error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A machine template with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update machine template' },
      { status: 500 }
    )
  }
}

// DELETE /api/machine-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.machineTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete machine template error:', error)
    return NextResponse.json(
      { error: 'Failed to delete machine template' },
      { status: 500 }
    )
  }
}
