import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/machine-templates - List all machine templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const templates = await prisma.machineTemplate.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get machine templates error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch machine templates' },
      { status: 500 }
    )
  }
}

// POST /api/machine-templates - Create new machine template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, fieldDefinitions, isActive } = body

    if (!name || !fieldDefinitions) {
      return NextResponse.json(
        { error: 'Name and field definitions are required' },
        { status: 400 }
      )
    }

    // Validate fieldDefinitions structure
    if (!Array.isArray(fieldDefinitions)) {
      return NextResponse.json(
        { error: 'Field definitions must be an array' },
        { status: 400 }
      )
    }

    const template = await prisma.machineTemplate.create({
      data: {
        name,
        description: description || null,
        fieldDefinitions,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error('Create machine template error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A machine template with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create machine template' },
      { status: 500 }
    )
  }
}
