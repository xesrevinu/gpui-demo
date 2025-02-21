import { execSync } from "node:child_process";
import { readFileSync, mkdirSync, cpSync, chmodSync } from "node:fs";
import { join } from "node:path";

const APP_NAME = process.env.APP_NAME || "gpui-demo";
const RELEASE_DIR = "target/release";

function execCommand(command: string) {
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });
}

async function createDeb() {
  const version = JSON.parse(readFileSync("package.json", "utf-8")).version;
  const arch = execSync("dpkg --print-architecture").toString().trim();
  const debDir = join(RELEASE_DIR, "deb");

  // 创建目录结构
  mkdirSync(join(debDir, "DEBIAN"), { recursive: true });
  cpSync(join(RELEASE_DIR, APP_NAME, "usr"), join(debDir, "usr"), {
    recursive: true,
  });

  // 创建 control 文件
  const control = `Package: ${APP_NAME}
Version: ${version}
Architecture: ${arch}
Maintainer: Your Name <your.email@example.com>
Description: GPUI Demo Application
 A demo application built with GPUI framework.
Section: utils
Priority: optional
Homepage: https://github.com/yourusername/gpui-demo
`;

  execSync(`echo '${control}' > ${join(debDir, "DEBIAN/control")}`);
  chmodSync(debDir, 0o755);
  execCommand(
    `dpkg-deb --build "${debDir}" "${join(RELEASE_DIR, `${APP_NAME}.deb`)}`
  );
}

async function createRpm() {
  const version = JSON.parse(readFileSync("package.json", "utf-8")).version;
  const arch = execSync("uname -m").toString().trim();
  const rpmDir = join(RELEASE_DIR, "rpmbuild");

  // 创建目录结构
  mkdirSync(join(rpmDir, "SPECS"), { recursive: true });
  mkdirSync(join(rpmDir, "BUILD"), { recursive: true });
  cpSync(join(RELEASE_DIR, APP_NAME, "usr"), join(rpmDir, "BUILD/usr"), {
    recursive: true,
  });

  const spec = `Name: ${APP_NAME}
Version: ${version}
Release: 1%{?dist}
Summary: GPUI Demo Application
License: MIT
URL: https://github.com/yourusername/gpui-demo
BuildArch: ${arch}

%description
A demo application built with GPUI framework.

%files
/usr/local/bin/${APP_NAME}
/usr/local/share/applications/${APP_NAME}.desktop
/usr/local/share/icons/hicolor/512x512/apps/${APP_NAME}.png

%post
update-desktop-database || :
gtk-update-icon-cache -f -t /usr/local/share/icons/hicolor || :
`;

  execSync(`echo '${spec}' > ${join(rpmDir, "SPECS", `${APP_NAME}.spec`)}`);
  execCommand(
    `rpmbuild --define "_topdir ${rpmDir}" -bb "${join(
      rpmDir,
      "SPECS",
      `${APP_NAME}.spec`
    )}"`
  );
  execCommand(
    `mv "${join(rpmDir, "RPMS", arch, `${APP_NAME}-${version}*.rpm`)}" "${join(
      RELEASE_DIR,
      `${APP_NAME}.rpm`
    )}"`
  );
}

async function main() {
  if (process.argv.includes("--deb")) {
    await createDeb();
  } else if (process.argv.includes("--rpm")) {
    await createRpm();
  } else {
    await createDeb();
    await createRpm();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
