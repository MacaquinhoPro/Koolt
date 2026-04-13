import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.expirationItem.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/expirations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
