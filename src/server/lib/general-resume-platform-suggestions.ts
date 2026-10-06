import { GENERATION_KIND_GENERAL } from "./generation-public-id";
import { parseGenerationCombinePlatform } from "./generation-list-info";
import { prisma } from "./prisma";

export async function listDistinctGeneralResumePlatforms(
  userId: string,
): Promise<string[]> {
  const generations = await prisma.generation.findMany({
    where: { userId, kind: GENERATION_KIND_GENERAL },
    select: { combineJson: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const seen = new Set<string>();
  const platforms: string[] = [];

  for (const generation of generations) {
    const platform = parseGenerationCombinePlatform(generation.combineJson);
    if (!platform) continue;
    const key = platform.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    platforms.push(platform);
  }

  return platforms;
}
