import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, schedule } = body as {
    userId: string;
    schedule: Record<string, string>;
  };

  if (!userId || !schedule || typeof schedule !== 'object') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const entries = Object.entries(schedule)
    .filter(([, subject]) => subject && subject.trim())
    .map(([period, subject]) => ({
      userId,
      period: parseInt(period),
      subject: subject.trim(),
    }));

  await prisma.$transaction([
    prisma.schedule.deleteMany({ where: { userId } }),
    prisma.schedule.createMany({ data: entries }),
  ]);

  return NextResponse.json({ ok: true });
}
