import { execSync } from "node:child_process";
import { mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";

const APP_NAME = process.env.APP_NAME || "gpui-demo";
const RELEASE_DIR = "target/release";
const BUNDLE_DIR = join(RELEASE_DIR, `${APP_NAME}.app`);

function execCommand(command: string) {
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });
}

async function main() {
  // 创建目录结构
  mkdirSync(join(BUNDLE_DIR, "Contents/MacOS"), { recursive: true });
  mkdirSync(join(BUNDLE_DIR, "Contents/Resources"), { recursive: true });

  // 复制文件
  cpSync(
    join(RELEASE_DIR, APP_NAME),
    join(BUNDLE_DIR, "Contents/MacOS", APP_NAME)
  );
  cpSync(
    join("crates/app/resources/macos/Info.plist"),
    join(BUNDLE_DIR, "Contents/Info.plist")
  );

  // 设置权限
  execCommand(`chmod +x "${join(BUNDLE_DIR, "Contents/MacOS", APP_NAME)}"`);

  console.log(`macOS bundle created at ${BUNDLE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
