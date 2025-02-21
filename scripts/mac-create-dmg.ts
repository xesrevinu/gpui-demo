import { execSync } from "node:child_process";
import { join } from "node:path";

const APP_NAME = process.env.APP_NAME || "gpui-demo";
const RELEASE_DIR = "target/release";
const BUNDLE_DIR = join(RELEASE_DIR, `${APP_NAME}.app`);

function execCommand(command: string) {
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });
}

async function main() {
  execCommand(
    `hdiutil create -volname "${APP_NAME}" -srcfolder "${BUNDLE_DIR}" -ov -format UDZO "${join(
      RELEASE_DIR,
      `${APP_NAME}.dmg`
    )}"`
  );

  console.log(`DMG created at ${join(RELEASE_DIR, `${APP_NAME}.dmg`)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
