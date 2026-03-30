const path = require("node:path");
const { notarize } = require("@electron/notarize");

const REQUIRED_ENV_KEYS = [
  "APPLE_ID",
  "APPLE_APP_SPECIFIC_PASSWORD",
  "APPLE_TEAM_ID"
];

exports.default = async function notarizeApp(context) {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const requireNotarization = process.env.VIBEPING_REQUIRE_NOTARIZATION === "1";
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    const message = `[notarize] Missing required notarization secrets: ${missingKeys.join(", ")}`;
    if (requireNotarization) {
      throw new Error(message);
    }
    console.warn(`${message}. Skipping notarization.`);
    return;
  }

  const appBundleId = context.packager.appInfo.id;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  await notarize({
    appBundleId,
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  });
};
