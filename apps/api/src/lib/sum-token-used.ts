import { prisma } from "./prisma.js";

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
