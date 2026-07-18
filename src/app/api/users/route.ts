import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const users = await prisma.user.findMany({
    include: { schedule: { orderBy: { period: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, school } = body as { name: string; school: string };

  if (!name?.trim() || !['PCY', 'PCR', 'LCE', 'new'].includes(school)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { name_school: { name: name.trim(), school } },
    update: {},
    create: { name: name.trim(), school },
  });

  return NextResponse.json(user);
}
