import { prisma } from "./prisma";

function formatDatePrefix(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function nextGenerationPublicId(
  prefix: string,
  existingPublicIds: readonly string[],
): string {
  let maxSeq = 0;
  for (const publicId of existingPublicIds) {
    if (!publicId.startsWith(prefix)) {
      continue;
    }
    const seq = Number.parseInt(publicId.slice(prefix.length), 10);
    if (Number.isFinite(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}

export function incrementGenerationPublicId(publicId: string): string | null {
  const lastDash = publicId.lastIndexOf("-");
  if (lastDash < 0) {
    return null;
  }
  const prefix = publicId.slice(0, lastDash + 1);
  const seq = Number.parseInt(publicId.slice(lastDash + 1), 10);
  if (!Number.isFinite(seq)) {
    return null;
  }
  return `${prefix}${String(seq + 1).padStart(3, "0")}`;
}

export async function allocateGenerationPublicId(userId: string): Promise<string> {
  const now = new Date();
  const prefix = `GEN-${formatDatePrefix(now)}-`;

  const existing = await prisma.generation.findMany({
    where: {
      userId,
      publicId: { startsWith: prefix },
    },
    select: { publicId: true },
  });

  return nextGenerationPublicId(
    prefix,
    existing.map((row) => row.publicId),
  );
}
