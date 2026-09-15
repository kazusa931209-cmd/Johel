import { prisma } from "./prisma.js";

function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function sumTokenUsed(userId: string): Promise<number> {
  const rows = await prisma.aiUsage.findMany({
    where: { userId },
    select: { inputToken: true, outputToken: true },
  });
  return rows.reduce(
    (sum, row) => sum + row.inputToken + row.outputToken,
    0,
  );
}

export async function sumTodayTokenUsed(userId: string): Promise<number> {
  const aggregate = await prisma.aiUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfUtcDay() },
    },
    _sum: {
      inputToken: true,
      outputToken: true,
    },
  });
  return (aggregate._sum.inputToken ?? 0) + (aggregate._sum.outputToken ?? 0);
}
