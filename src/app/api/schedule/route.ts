import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, schedule, elective1Name, elective2Name } = body as {
    userId: string;
    schedule: Record<string, string>;
    elective1Name?: string;
    elective2Name?: string;
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
    prisma.user.update({
      where: { id: userId },
      data: {
        elective1Name: elective1Name?.trim() || null,
        elective2Name: elective2Name?.trim() || null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
