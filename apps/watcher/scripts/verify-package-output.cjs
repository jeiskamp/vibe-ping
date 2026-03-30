const { access, readdir } = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const outputDir = path.resolve(__dirname, "..", "release");

  await access(outputDir);
  const entries = await readdir(outputDir, { withFileTypes: true });
  const visibleEntries = entries.filter((entry) => !entry.name.startsWith("."));

  if (visibleEntries.length === 0) {
    throw new Error(`No package output found in ${outputDir}`);
  }

  const summary = visibleEntries
    .map((entry) => `${entry.isDirectory() ? "dir" : "file"}:${entry.name}`)
    .join(", ");

  console.log(`[verify-package-output] Found ${visibleEntries.length} release artifacts in ${outputDir}`);
  console.log(`[verify-package-output] ${summary}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[verify-package-output] ${message}`);
  process.exitCode = 1;
});
