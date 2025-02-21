import { existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const APP_NAME = process.env.APP_NAME || "gpui-demo";
const RELEASE_DIR = "target/release";
const IS_AARCH64 = process.env.ARCH === "aarch64";

async function main() {
  const bundleDir = join(
    RELEASE_DIR,
    IS_AARCH64 ? `${APP_NAME}-aarch64` : APP_NAME
  );
  const execPath = join(bundleDir, "usr/local/bin", APP_NAME);
  const desktopPath = join(
    bundleDir,
    "usr/local/share/applications",
    `${APP_NAME}.desktop`
  );
  const iconPath = join(
    bundleDir,
    "usr/local/share/icons/hicolor/512x512/apps",
    `${APP_NAME}.png`
  );

  // 检查文件是否存在
  if (!existsSync(execPath)) throw new Error("Executable not found");
  if (!existsSync(desktopPath)) throw new Error("Desktop file not found");
  if (!existsSync(iconPath)) throw new Error("Icon not found");

  // 检查架构
  const fileOutput = execSync(`file "${execPath}"`).toString();
  const expectedArch = IS_AARCH64 ? "aarch64" : "x86-64";
  if (!fileOutput.includes(expectedArch)) {
    throw new Error(`Not an ${expectedArch} executable`);
  }

  console.log("Linux bundle verified");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
