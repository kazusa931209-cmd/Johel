import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { noiseFilter } from "../index";

const fixtureDir = dirname(fileURLToPath(import.meta.url));

describe("noiseFilter pipeline", () => {
  it("handles empty input", () => {
    const result = noiseFilter("");
    expect(result.text).toBe("");
    expect(result.originalLength).toBe(0);
    expect(result.currentLength).toBe(0);
    expect(result.reductionRate).toBe(0);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it("preserves plain text JD content", () => {
    const jd = [
      "Golang Engineer",
      "Job Description",
      "Build payment services with Redis and Kafka.",
      "Company Overview",
      "Acme builds fintech tools.",
      "Company Website: https://www.acme.example/",
    ].join("\n");
    const result = noiseFilter(jd);
    expect(result.text).toContain("Golang Engineer");
    expect(result.text).toContain("Redis");
    expect(result.text).toContain("https://www.acme.example/");
    expect(result.reductionRate).toBeGreaterThanOrEqual(0);
  });

  it("cleans raw HTML JD", () => {
    const html = `<html><head><style>a{}</style><script>x()</script></head>
      <body><h1>Backend Engineer</h1><p>Need Kubernetes and gRPC</p></body></html>`;
    const result = noiseFilter(html);
    expect(result.text).toContain("Backend Engineer");
    expect(result.text).toContain("Kubernetes");
    expect(result.text).not.toContain("x()");
  });

  it("cleans markdown navigation and images", () => {
    const md = `[Job](https://dejob.ai/job)
[Talent](https://dejob.ai/talent)
[image](https://cdn.example/a.png)
BIT
Golang Engineer`;
    const result = noiseFilter(md);
    expect(result.text).toContain("BIT");
    expect(result.text).toContain("Golang Engineer");
    expect(result.text).not.toContain("https://dejob.ai/talent");
    expect(result.text).not.toContain("[image]");
  });

  it("handles mixed HTML and Markdown", () => {
    const mixed = `<script>bad()</script>
[Talent](https://x/talent)
<p>Company Overview</p>
<p>Acme builds wallets with Protobuf</p>`;
    const result = noiseFilter(mixed);
    expect(result.text).toContain("Company Overview");
    expect(result.text).toContain("Protobuf");
    expect(result.text).not.toContain("bad()");
  });

  it("removes navigation noise and footer noise", () => {
    const text = [
      "Home",
      "Login",
      "Job Description",
      "Ship features",
      "Company Overview",
      "Acme Inc",
      "Contact Details",
      "Privacy Policy",
    ].join("\n");
    const result = noiseFilter(text);
    expect(result.text).toContain("Job Description");
    expect(result.text).toContain("Acme Inc");
    expect(result.text).not.toMatch(/^Home$/m);
    expect(result.text).not.toContain("Contact Details");
  });

  it("removes consecutive duplicate lines but keeps repeated tech terms later", () => {
    const result = noiseFilter("Redis\nRedis\nUse Redis in production");
    expect(result.text).toBe("Redis\nUse Redis in production");
  });

  it("preserves technical keywords", () => {
    const result = noiseFilter(
      "Skills:\nGo\nNestJS\nPostgreSQL\nRedis\nKafka\nKubernetes\ngRPC\nProtobuf\nISO 8583\nEVM\nSolidity\nAWS\nDocker",
    );
    for (const term of [
      "Go",
      "NestJS",
      "PostgreSQL",
      "Redis",
      "Kafka",
      "Kubernetes",
      "gRPC",
      "Protobuf",
      "ISO 8583",
      "EVM",
      "Solidity",
      "AWS",
      "Docker",
    ]) {
      expect(result.text).toContain(term);
    }
  });

  it("handles very large input without throwing", () => {
    const body = "Job Description\n".repeat(400) + "Redis and Kafka\n";
    expect(body.length).toBeGreaterThan(5000);
    const result = noiseFilter(body);
    expect(result.text).toContain("Redis");
    expect(result.diagnostics.length).toBe(9);
  });

  it("BIT Golang Engineer regression fixture", () => {
    const raw = readFileSync(
      join(fixtureDir, "fixtures/bit-golang-engineer.txt"),
      "utf8",
    );
    const result = noiseFilter(raw);

    const mustKeep = [
      "BIT",
      "Golang Engineer",
      "USD 5,000 – 8,000/month",
      "On-site",
      "Full Time",
      "Bangkok / Kuala Lumpur",
      "Job Description",
      "Job Requirements",
      "Golang",
      "Redis",
      "Kafka",
      "Kubernetes",
      "gRPC",
      "Protobuf",
      "Company Overview",
      "digital asset financial services platform",
    ];
    for (const token of mustKeep) {
      expect(result.text, `expected to keep: ${token}`).toContain(token);
    }

    expect(result.text).not.toContain("https://dejob.ai/talent");
    expect(result.text).not.toContain("[Talent]");
    expect(result.text).not.toContain("[Enterprise Service]");
    expect(result.text).not.toContain("[image]");
    expect(result.text).not.toMatch(/^svg$/im);
    expect(result.text).not.toMatch(/Privacy Policy/i);
    expect(result.text).not.toContain("0xfC5f...69Ad");
    expect(result.text).not.toMatch(/^DeJob$/m);
    expect(result.text).not.toMatch(/Blazes New Trials/i);
    expect(result.text).not.toMatch(/^About Us$/m);
    expect(result.text).not.toMatch(/^Find Job$/m);
    expect(result.text).not.toMatch(/View more jobs of BIT/i);
    expect(result.currentLength).toBeLessThan(result.originalLength);
    expect(result.reductionRate).toBeGreaterThan(0);
  });
});
