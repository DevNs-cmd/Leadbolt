import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch a single template by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: In Next.js 15, you need to await params
    // For Next.js 14 and below, you can use params directly
    
    const template = await prisma.messageTemplate.findUnique({
      where: { id: params.id }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Parse variables from JSON string if stored as string
    let parsedTemplate = { ...template };
    if (typeof template.variables === 'string') {
      try {
        parsedTemplate.variables = JSON.parse(template.variables);
      } catch {
        parsedTemplate.variables = [];
      }
    }

    return NextResponse.json(parsedTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT - Update a template
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the template exists first
    const existingTemplate = await prisma.messageTemplate.findUnique({
      where: { id: params.id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, type, subject, content, variables, isActive } = body;

    // Validate required fields
    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, content' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      type: type || 'custom',
      subject,
      content,
      isActive: isActive !== undefined ? isActive : true,
    };

    // Handle variables (convert array to JSON string for SQLite)
    if (variables) {
      if (Array.isArray(variables)) {
        updateData.variables = JSON.stringify(variables);
      } else {
        updateData.variables = variables;
      }
    }

    const template = await prisma.messageTemplate.update({
      where: { id: params.id },
      data: updateData
    });

    // Parse variables for response
    let parsedTemplate = { ...template };
    if (typeof template.variables === 'string') {
      try {
        parsedTemplate.variables = JSON.parse(template.variables);
      } catch {
        parsedTemplate.variables = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the template exists
    const existingTemplate = await prisma.messageTemplate.findUnique({
      where: { id: params.id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Delete the template
    await prisma.messageTemplate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      deletedId: params.id
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}