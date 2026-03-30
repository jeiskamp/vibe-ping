const { cp, mkdir } = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const sourceDir = path.join(rootDir, "src", "renderer");
  const targetDir = path.join(rootDir, "dist", "renderer");

  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, {
    recursive: true,
    force: true,
    filter: (sourcePath) => {
      const normalized = path.normalize(sourcePath);
      return normalized.endsWith(".html") || normalized.endsWith(".css") || normalized === sourceDir;
    }
  });
}

main().catch((error) => {
  console.error("[copy-renderer-assets]", error);
  process.exitCode = 1;
});
