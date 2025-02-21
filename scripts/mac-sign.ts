import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

function execCommand(command: string) {
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });
}

async function main() {
  const IDENTITY = process.env.APPLE_IDENTITY; // 替换为你的开发者身份
  const APPLE_TEAM = process.env.APPLE_TEAM; // 替换为你的 Team ID

  const MACOS_CERTIFICATE = process.env.MACOS_CERTIFICATE; // 替换为你的证书
  const MACOS_CERTIFICATE_PASSWORD = process.env.MACOS_CERTIFICATE_PASSWORD; // 替换为你的证书密码

  const APPLE_NOTARIZATION_USERNAME = process.env.APPLE_NOTARIZATION_USERNAME; // 替换为你的苹果账号
  const APPLE_NOTARIZATION_PASSWORD = process.env.APPLE_NOTARIZATION_PASSWORD; // 替换为你的苹果账号密码

  const APP_NAME = process.env.APP_NAME; // 替换为你的应用名称，默认为 gpui-demo

  if (
    !MACOS_CERTIFICATE ||
    !MACOS_CERTIFICATE_PASSWORD ||
    !APPLE_NOTARIZATION_USERNAME ||
    !APPLE_NOTARIZATION_PASSWORD
  ) {
    console.log(
      "Skipping code signing - missing required environment variables"
    );
    process.exit(0);
  }

  // 设置 keychain
  execCommand(
    'security create-keychain -p "$MACOS_CERTIFICATE_PASSWORD" build.keychain'
  );
  execCommand("security default-keychain -s build.keychain");
  execCommand(
    'security unlock-keychain -p "$MACOS_CERTIFICATE_PASSWORD" build.keychain'
  );

  // 导入证书
  execCommand('echo "$MACOS_CERTIFICATE" | base64 --decode > certificate.p12');
  execCommand(
    'security import certificate.p12 -k build.keychain -P "$MACOS_CERTIFICATE_PASSWORD" -T /usr/bin/codesign'
  );
  execCommand("rm certificate.p12");

  // 配置 keychain
  execCommand(
    'security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$MACOS_CERTIFICATE_PASSWORD" build.keychain'
  );

  const appPath = `target/release/${APP_NAME}.app`;
  if (!existsSync(appPath)) {
    console.error(`App bundle not found at ${appPath}`);
    process.exit(1);
  }

  // 签名应用
  execCommand(
    `codesign --deep --force --timestamp --options runtime --sign "${IDENTITY}" "${appPath}/Contents/MacOS/${APP_NAME}"`
  );
  execCommand(
    `codesign --deep --force --timestamp --options runtime --sign "${IDENTITY}" "${appPath}"`
  );

  // 创建 DMG
  execCommand(
    `hdiutil create -volname "${APP_NAME}" -srcfolder "${appPath}" -ov -format UDZO "target/release/${APP_NAME}.dmg"`
  );

  // 签名 DMG
  execCommand(
    `codesign --deep --force --timestamp --options runtime --sign "${IDENTITY}" "target/release/${APP_NAME}.dmg"`
  );

  // 公证
  execCommand(
    `xcrun notarytool submit "target/release/${APP_NAME}.dmg" --wait --apple-id "$APPLE_NOTARIZATION_USERNAME" --password "$APPLE_NOTARIZATION_PASSWORD" --team-id "${APPLE_TEAM}"`
  );

  // 添加公证票据
  execCommand(`xcrun stapler staple "target/release/${APP_NAME}.dmg"`);

  // 清理 keychain
  execCommand("security default-keychain -s login.keychain");
  execCommand("security delete-keychain build.keychain");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
