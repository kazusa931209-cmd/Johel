import type { NoiseFilter, NoiseFilterContext } from "../types";

function normalizeText(input: string): string {
  let text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/\u00a0/g, " ");
  text = text.replace(/\u200b/g, "");
  text = text.normalize("NFC");

  const lines = text.split("\n").map((line) =>
    line.replace(/[ \t]+$/g, "").replace(/^[ \t]+/g, "").replace(/[ \t]{2,}/g, " "),
  );

  const out: string[] = [];
  let blankRun = 0;
  for (const line of lines) {
    if (line === "") {
      blankRun += 1;
      if (blankRun <= 2) out.push("");
      continue;
    }
    blankRun = 0;
    out.push(line);
  }

  return out.join("\n").trim();
}

export class NormalizeFilter implements NoiseFilter {
  name = "normalize";

  apply(context: NoiseFilterContext): NoiseFilterContext {
    return {
      ...context,
      text: normalizeText(context.text),
    };
  }
}
