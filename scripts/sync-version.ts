import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import packageJson from "../package.json" with { type: "json" };

const infoPlist = "./crates/app/resources/macos/Info.plist";
const infoPlistVersionRegex = /<string>[0-9]+\.[0-9]+\.[0-9]+<\/string>/;
const cargoLockPath = "./Cargo.lock";

export function readInfoPlist() {
  return readFileSync(infoPlist, "utf8");
}

export function getInfoPlistVersion() {
  const infoPlistContent = readInfoPlist();
  const version = infoPlistContent.match(infoPlistVersionRegex)?.[0];
  return version?.replace(/<string>|<\/string>/g, "");
}

const cargoFilesVersionRegex = /version = "([^"]+)"/;

// 查找所有 Cargo.toml 文件
export function findCargoFiles() {
  try {
    const result = execSync('find . -name "Cargo.toml"', { encoding: "utf8" });
    return result.split("\n").filter(Boolean);
  } catch (error) {
    console.error("Error finding Cargo.toml files:", error);
    return ["./Cargo.toml"];
  }
}

export function cargoFilesVersion() {
  const cargoFiles = findCargoFiles();
  let filesVersion = cargoFiles.map((file) => {
    const content = readFileSync(file, "utf8");
    return [
      file,
      content.match(cargoFilesVersionRegex)?.[1],
    ];
  });

  return filesVersion;
}

// 获取本地包名称列表
function getLocalPackageNames(): string[] {
  const cargoFiles = findCargoFiles();
  const packageNames: string[] = [];
  
  cargoFiles.forEach((file) => {
    const content = readFileSync(file, "utf8");
    const packageNameMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
    if (packageNameMatch) {
      packageNames.push(packageNameMatch[1]);
    }
  });

  return packageNames;
}

// 验证版本号格式
function validateVersion(version: string) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("Invalid version format. Expected: X.Y.Z");
  }
  return version;
}

// 处理 Cargo.lock 文件中的版本
function updateCargoLock(version: string) {
  if (!existsSync(cargoLockPath)) {
    return;
  }

  const localPackages = new Set(getLocalPackageNames());
  let content = readFileSync(cargoLockPath, "utf8");
  const lines = content.split("\n");
  let currentPackage: string | null = null;
  
  // Process line by line to update versions of local packages
  const updatedLines = lines.map(line => {
    // Reset current package at the start of each package block
    if (line.startsWith("[[package]]")) {
      currentPackage = null;
      return line;
    }
    
    // Extract package name if we're at a name line
    if (line.trim().startsWith("name = ")) {
      const nameMatch = line.match(/name = "([^"]+)"/);
      if (nameMatch) {
        currentPackage = nameMatch[1];
      }
    }
    
    // Update version if this is one of our local packages
    if (currentPackage && localPackages.has(currentPackage) && line.trim().startsWith("version = ")) {
      return line.replace(/version = "[^"]+"/, `version = "${version}"`);
    }
    
    return line;
  });

  writeFileSync(cargoLockPath, updatedLines.join("\n"));
}

// 同步版本到所有文件
function syncVersions(version: string) {
  try {
    version = validateVersion(version);

    // 更新所有 Cargo.toml 文件
    const cargoFiles = findCargoFiles();
    cargoFiles.forEach((file) => {
      let content = readFileSync(file, "utf8");
      content = content.replace(cargoFilesVersionRegex, `version = "${version}"`);
      writeFileSync(file, content);
    });

    // 更新 Cargo.lock 文件
    updateCargoLock(version);

    // 更新 Info.plist
    if (existsSync(infoPlist)) {
      let plistContent = readFileSync(infoPlist, "utf8");
      plistContent = plistContent.replace(
        infoPlistVersionRegex,
        `<string>${version}</string>`
      );
      writeFileSync(infoPlist, plistContent);
    }

    console.log(`Successfully synced version ${version} to all files`);
  } catch (error) {
    console.error("Error syncing versions:", error);
    process.exit(1);
  }
}

syncVersions(packageJson.version);
