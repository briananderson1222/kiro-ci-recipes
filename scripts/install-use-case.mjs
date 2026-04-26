import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const args = {
    ids: [],
    target: process.cwd(),
    dryRun: false,
    force: false,
    list: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--target") args.target = argv[++index];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "--help") args.help = true;
    else args.ids.push(arg);
  }
  return args;
}

function usage() {
  return [
    "Usage: ./install.sh [--target <repo>] [--dry-run] [--force] <use-case...>",
    "",
    "Examples:",
    "  ./install.sh pr-review security-gate",
    "  ./install.sh --target ../my-repo --dry-run auto-fix-branch",
    "  npm run catalog:list"
  ].join("\n");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function copyFile({ source, target, dryRun, force }) {
  const sourceText = fs.readFileSync(source);
  if (fs.existsSync(target)) {
    const targetText = fs.readFileSync(target);
    if (Buffer.compare(sourceText, targetText) === 0) {
      console.log(`unchanged ${target}`);
      return;
    }
    if (!force) {
      throw new Error(`Refusing to overwrite ${target}. Re-run with --force.`);
    }
  }

  console.log(`${dryRun ? "would copy" : "copy"} ${source} -> ${target}`);
  if (!dryRun) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    const mode = fs.statSync(source).mode;
    if ((mode & 0o111) !== 0) {
      fs.chmodSync(target, mode & 0o777);
    }
  }
}

function installUseCase({ repoRoot, targetRoot, id, dryRun, force }) {
  const manifestPath = path.join(repoRoot, "use-cases", id, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Unknown use case: ${id}`);
  }

  const manifest = readJson(manifestPath);
  console.log(`\n# ${manifest.title}`);
  console.log(`authority: ${manifest.authority}`);

  for (const entry of manifest.copies) {
    copyFile({
      source: path.join(repoRoot, entry.from),
      target: path.join(targetRoot, entry.to),
      dryRun,
      force
    });
  }

  if (manifest.localCommands?.length) {
    console.log("local commands:");
    for (const command of manifest.localCommands) {
      console.log(`  ${command}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const catalog = readJson(path.join(repoRoot, "catalog.json"));

  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.list) {
    for (const useCase of catalog.useCases) {
      console.log(`${useCase.id.padEnd(18)} ${useCase.authority.padEnd(22)} ${useCase.summary}`);
    }
    return;
  }

  if (args.ids.length === 0) {
    console.error(usage());
    process.exit(2);
  }

  const targetRoot = path.resolve(args.target);
  for (const id of args.ids) {
    installUseCase({
      repoRoot,
      targetRoot,
      id,
      dryRun: args.dryRun,
      force: args.force
    });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
