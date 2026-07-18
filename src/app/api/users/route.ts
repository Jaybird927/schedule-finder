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
  const { name, school, currentSchool } = body as { name: string; school: string; currentSchool: number };

  if (!name?.trim() || !['PCY', 'PCR', 'LCE', 'new'].includes(school) || ![1, 2].includes(currentSchool)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { name_school: { name: name.trim(), school } },
    update: { currentSchool },
    create: { name: name.trim(), school, currentSchool },
  });

  return NextResponse.json(user);
}
