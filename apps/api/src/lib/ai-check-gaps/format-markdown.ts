import type { CheckGapsVerdict } from "./types.js";

type MatchedExperience = {
  id: string;
  category: string;
};

const VERDICT_HEADINGS: Record<CheckGapsVerdict, string> = {
  gap_confirmed: "### Gap confirmed",
  exists_not_linked: "### Experience exists but is not linked",
  exists_and_linked: "### Already linked to this Generate",
};

export function formatCheckGapsMarkdown(
  verdict: CheckGapsVerdict,
  explanation: string,
  matchedExperiences: MatchedExperience[],
  hasGenerationContext: boolean,
): string {
  const sections = [VERDICT_HEADINGS[verdict], "", explanation.trim()];

  if (matchedExperiences.length > 0) {
    sections.push("", "#### Matching experience cards", "");
    for (const experience of matchedExperiences) {
      sections.push(
        `- **${experience.category}** — [View card](/experiences/${experience.id}/edit)`,
      );
    }
  }

  if (!hasGenerationContext && verdict === "exists_not_linked") {
    sections.push(
      "",
      "_Open from a Generate Evaluate selection to check linkage for the current run._",
    );
  }

  return sections.join("\n").trim();
}
