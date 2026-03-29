const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function main() {
  const electronPackagePath = require.resolve("electron/package.json");
  const electronDir = path.dirname(electronPackagePath);
  const distDir = path.join(electronDir, "dist");

  if (fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0) {
    console.log("[ensure-electron] Electron runtime is present.");
    return;
  }

  console.log("[ensure-electron] Electron runtime missing. Reinstalling...");

  const installScriptPath = path.join(electronDir, "install.js");
  const result = spawnSync(process.execPath, [installScriptPath], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (!fs.existsSync(distDir) || fs.readdirSync(distDir).length === 0) {
    console.error("[ensure-electron] Electron install completed but runtime is still missing.");
    process.exit(1);
  }

  console.log("[ensure-electron] Electron runtime restored.");
}

main();
