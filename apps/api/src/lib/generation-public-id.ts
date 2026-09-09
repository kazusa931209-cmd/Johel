import { prisma } from "./prisma.js";

function formatDatePrefix(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function allocateGenerationPublicId(userId: string): Promise<string> {
  const now = new Date();
  const prefix = `GEN-${formatDatePrefix(now)}-`;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const count = await prisma.generation.count({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}
