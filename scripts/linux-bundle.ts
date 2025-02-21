import { execSync } from "node:child_process";
import { existsSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";

const APP_NAME = process.env.APP_NAME || "gpui-demo";
const RELEASE_DIR = "target/release";
const IS_AARCH64 = process.env.ARCH === "aarch64";

function execCommand(command: string) {
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });
}

async function main() {
  const bundleDir = join(
    RELEASE_DIR,
    IS_AARCH64 ? `${APP_NAME}-aarch64` : APP_NAME
  );

  // 创建目录结构
  mkdirSync(join(bundleDir, "usr/local/bin"), { recursive: true });
  mkdirSync(join(bundleDir, "usr/local/share/applications"), {
    recursive: true,
  });
  mkdirSync(join(bundleDir, "usr/local/share/icons/hicolor/512x512/apps"), {
    recursive: true,
  });

  // 复制文件
  cpSync(
    join(RELEASE_DIR, APP_NAME),
    join(bundleDir, "usr/local/bin", APP_NAME)
  );
  cpSync(
    join("crates/app/resources/linux", `${APP_NAME}.desktop`),
    join(bundleDir, "usr/local/share/applications")
  );
  cpSync(
    join("crates/app/resources/linux", `${APP_NAME}.png`),
    join(bundleDir, "usr/local/share/icons/hicolor/512x512/apps")
  );

  // 设置权限
  execCommand(`chmod +x "${join(bundleDir, "usr/local/bin", APP_NAME)}"`);

  console.log(
    `Linux ${IS_AARCH64 ? "aarch64" : "x86_64"} bundle created at ${bundleDir}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
