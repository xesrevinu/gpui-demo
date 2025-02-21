import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const APP_NAME = process.env.APP_NAME || "gpui-demo";
const RELEASE_DIR = "target/release";
const BUNDLE_DIR = join(RELEASE_DIR, `${APP_NAME}.app`);

function execCommand(command: string) {
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });
}

async function main() {
  // 检查基本结构
  if (!existsSync(BUNDLE_DIR)) {
    throw new Error("App bundle not found");
  }

  const execPath = join(BUNDLE_DIR, "Contents/MacOS", APP_NAME);
  const plistPath = join(BUNDLE_DIR, "Contents/Info.plist");

  if (!existsSync(plistPath)) {
    throw new Error("Info.plist not found");
  }

  if (!existsSync(execPath)) {
    throw new Error("Executable not found");
  }

  // 验证 Info.plist
  execCommand(`plutil -lint "${plistPath}"`);

  // 检查可执行文件
  try {
    execCommand(`codesign -dvv "${BUNDLE_DIR}"`);
  } catch (error) {
    console.log("Warning: App is not signed");
  }

  console.log("Bundle verification completed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
