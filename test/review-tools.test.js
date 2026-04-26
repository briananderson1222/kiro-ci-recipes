import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { normalizeReviewOutput } from "../scripts/normalize-review-output.mjs";

const fixturesDir = path.resolve("fixtures/reviews");

test("normalizer accepts legacy REVIEW_DATA array and emits canonical schema", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "valid.md"), "utf8");
  const { document, markdown } = normalizeReviewOutput(raw, {
    normalizedAt: "2026-04-26T00:00:00.000Z",
    rawMarkdownPath: "fixtures/reviews/valid.md"
  });

  assert.equal(document.counts.total, 1);
  assert.equal(document.counts.high, 1);
  assert.equal(document.findings[0].severity, "HIGH");
  assert.match(markdown, /## Kiro Review - Changes Requested/);
  assert.match(markdown, /\*\*\[HIGH\]\*\*/);
  assert.match(markdown, /Generated with \[Kiro CLI\]/);
  assert.match(markdown, /If `issue-promotion` is installed/);
  assert.match(markdown, /<!-- REVIEW_DATA: {"findings":/);
});

test("normalizer renders clean markdown instead of raw terminal output", () => {
  const raw = '\u001b[38;5;141m> \u001b[0m\u001b[1m# Raw Title\u001b[0m\n\nNo findings.\n\n<!-- REVIEW_DATA: [] -->';
  const { markdown } = normalizeReviewOutput(raw, { title: "PR Review" });
  assert.match(markdown, /## PR Review - No Findings/);
  assert.doesNotMatch(markdown, /\u001b\[/);
  assert.doesNotMatch(markdown, /Raw Title/);
});

test("normalizer permits missing payload in non-strict mode", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "missing.md"), "utf8");
  const { document } = normalizeReviewOutput(raw, { normalizedAt: "2026-04-26T00:00:00.000Z" });
  assert.equal(document.counts.total, 0);
  assert.match(document.warnings.join("\n"), /Missing REVIEW_DATA/);
});

test("normalizer fails missing payload in strict mode", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "missing.md"), "utf8");
  assert.throws(() => normalizeReviewOutput(raw, { strict: true }), /Missing REVIEW_DATA/);
});

test("normalizer fails malformed payload in strict mode", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "malformed.md"), "utf8");
  assert.throws(() => normalizeReviewOutput(raw, { strict: true }), /Invalid REVIEW_DATA JSON/);
});

test("normalizer fails invalid line values in strict mode", () => {
  const raw = '# Review\n\n<!-- REVIEW_DATA: [{"severity":"LOW","confidence":"low","file":"src/app.js","line":0,"description":"Bad line.","source":"kiro"}] -->';
  assert.throws(() => normalizeReviewOutput(raw, { strict: true }), /invalid line/);
});

test("normalizer accepts fenced JSON fallback", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "fenced-json.md"), "utf8");
  const { document } = normalizeReviewOutput(raw);
  assert.equal(document.counts.low, 1);
  assert.equal(document.findings[0].line, null);
});

test("normalizer uses the latest payload when review data is duplicated", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "duplicate-payload.md"), "utf8");
  const { document } = normalizeReviewOutput(raw);
  assert.equal(document.counts.high, 1);
  assert.equal(document.findings[0].description, "Latest payload.");
  assert.match(document.warnings.join("\n"), /Found 2 REVIEW_DATA payloads/);
});

test("normalizer preserves oversized descriptions without truncating automation data", () => {
  const description = "large finding ".repeat(1000).trim();
  const raw = `# Review\n\n<!-- REVIEW_DATA: [{"severity":"MEDIUM","confidence":"medium","file":"src/app.js","line":8,"description":${JSON.stringify(description)},"source":"kiro"}] -->`;
  const { document, markdown } = normalizeReviewOutput(raw);
  assert.equal(document.counts.medium, 1);
  assert.equal(document.findings[0].description.length, description.length);
  assert.match(markdown, /REVIEW_DATA/);
});

test("normalizer deduplicates identical findings", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "duplicate.md"), "utf8");
  const { document } = normalizeReviewOutput(raw);
  assert.equal(document.counts.total, 1);
  assert.match(document.warnings.join("\n"), /Duplicate finding ignored/);
});

test("normalizer drops invalid findings in non-strict mode", () => {
  const raw = fs.readFileSync(path.join(fixturesDir, "unknown-severity.md"), "utf8");
  const { document } = normalizeReviewOutput(raw);
  assert.equal(document.counts.total, 0);
  assert.match(document.warnings.join("\n"), /invalid severity/);
});

test("normalizer converts invalid line values to null in non-strict mode", () => {
  const raw = '# Review\n\n<!-- REVIEW_DATA: [{"severity":"LOW","confidence":"low","file":"src/app.js","line":0,"description":"Bad line.","source":"kiro"}] -->';
  const { document } = normalizeReviewOutput(raw);
  assert.equal(document.findings[0].line, null);
  assert.match(document.warnings.join("\n"), /normalized to null/);
});

test("normalizer CLI writes markdown and JSON artifacts", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kiro-review-"));
  const jsonPath = path.join(tmp, "review.json");
  const mdPath = path.join(tmp, "review.md");

  execFileSync("node", [
    "scripts/normalize-review-output.mjs",
    path.join(fixturesDir, "valid.md"),
    "--json",
    jsonPath,
    "--markdown",
    mdPath,
    "--title",
    "Security Review"
  ]);

  assert.equal(JSON.parse(fs.readFileSync(jsonPath, "utf8")).counts.total, 1);
  const markdown = fs.readFileSync(mdPath, "utf8");
  assert.match(markdown, /## Security Review - Changes Requested/);
  assert.match(markdown, /REVIEW_DATA/);
});

test("fail-on-critical exits one for critical findings and zero otherwise", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kiro-review-"));
  const criticalPath = path.join(tmp, "critical.json");
  const highPath = path.join(tmp, "high.json");

  fs.writeFileSync(criticalPath, JSON.stringify({
    findings: [{
      severity: "CRITICAL",
      confidence: "high",
      file: "src/app.js",
      line: 7,
      description: "Critical fixture.",
      source: "kiro"
    }]
  }));
  fs.writeFileSync(highPath, JSON.stringify({
    findings: [{
      severity: "HIGH",
      confidence: "high",
      file: "src/app.js",
      line: 7,
      description: "High fixture.",
      source: "kiro"
    }]
  }));

  assert.equal(spawnSync("node", ["scripts/fail-on-critical.mjs", criticalPath]).status, 1);
  assert.equal(spawnSync("node", ["scripts/fail-on-critical.mjs", highPath]).status, 0);
});

test("select-review-finding returns selected finding metadata", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kiro-review-"));
  const reviewPath = path.join(tmp, "review.json");
  fs.writeFileSync(reviewPath, JSON.stringify({
    findings: [{
      severity: "HIGH",
      confidence: "medium",
      file: "src/app.js",
      line: 7,
      description: "Hardcoded demo credential.",
      source: "kiro"
    }]
  }));

  const output = execFileSync("node", [
    "scripts/select-review-finding.mjs",
    reviewPath,
    "1"
  ], { encoding: "utf8" });

  const selected = JSON.parse(output);
  assert.equal(selected.total, 1);
  assert.equal(selected.finding.file, "src/app.js");
  assert.match(selected.body, /Hardcoded demo credential/);
});

test("parse-review-command accepts only exact slash command shapes", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kiro-command-"));
  const bodyPath = path.join(tmp, "comment.txt");

  fs.writeFileSync(bodyPath, "/open-issue 12\n");
  assert.equal(execFileSync("node", [
    "scripts/parse-review-command.mjs",
    "/open-issue",
    "--file",
    bodyPath
  ], { encoding: "utf8" }).trim(), "12");

  fs.writeFileSync(bodyPath, "/kiro-fix 3");
  assert.equal(execFileSync("node", [
    "scripts/parse-review-command.mjs",
    "/kiro-fix",
    "--file",
    bodyPath
  ], { encoding: "utf8" }).trim(), "3");

  fs.writeFileSync(bodyPath, "/kiro-fix 3 && echo bad");
  assert.equal(execFileSync("node", [
    "scripts/parse-review-command.mjs",
    "/kiro-fix",
    "--file",
    bodyPath
  ], { encoding: "utf8" }).trim(), "");
});

test("check-comment-permission allows only write-capable collaborators", () => {
  assert.equal(spawnSync("node", ["scripts/check-comment-permission.mjs", "write"]).status, 0);
  assert.equal(spawnSync("node", ["scripts/check-comment-permission.mjs", "maintain"]).status, 0);
  assert.equal(spawnSync("node", ["scripts/check-comment-permission.mjs", "admin"]).status, 0);
  assert.equal(spawnSync("node", ["scripts/check-comment-permission.mjs", "triage"]).status, 1);
  assert.equal(spawnSync("node", ["scripts/check-comment-permission.mjs", "read"]).status, 1);
  assert.equal(spawnSync("node", ["scripts/check-comment-permission.mjs", "none"]).status, 1);
});

test("installer can copy every use case into a fresh target", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kiro-install-"));
  execFileSync("node", [
    "scripts/install-use-case.mjs",
    "--target",
    tmp,
    "pr-review",
    "security-gate",
    "artifact-review",
    "issue-promotion",
    "test-gap-finder",
    "docs-drift",
    "auto-fix-branch"
  ], { encoding: "utf8" });

  const expectedFiles = [
    ".github/actions/kiro-review/action.yml",
    ".github/workflows/kiro-pr-review.yml",
    ".github/workflows/kiro-security-gate.yml",
    ".github/workflows/kiro-artifact-review.yml",
    ".github/workflows/open-issue-from-review.yml",
    ".github/workflows/kiro-test-gap-finder.yml",
    ".github/workflows/kiro-docs-drift.yml",
    ".github/workflows/kiro-auto-fix-branch.yml",
    ".kiro/skills/review-criteria/SKILL.md",
    ".kiro/agents/code-reviewer.json",
    ".kiro/agents/security-reviewer.json",
    ".kiro/agents/test-gap-finder.json",
    ".kiro/agents/docs-drift-reviewer.json",
    ".kiro/agents/fix-branch-writer.json",
    "scripts/check-comment-permission.mjs",
    "scripts/normalize-review-output.mjs",
    "scripts/parse-review-command.mjs",
    "scripts/select-review-finding.mjs"
  ];

  for (const file of expectedFiles) {
    assert.equal(fs.existsSync(path.join(tmp, file)), true, `${file} should be installed`);
  }

  const runLocalMode = fs.statSync(path.join(tmp, "scripts/run-local-review.sh")).mode;
  assert.notEqual(runLocalMode & 0o111, 0);
});
