import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// 验证版本号格式
function validateVersion(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Invalid version format. Expected: X.Y.Z');
  }
  return version;
}

// 查找所有 Cargo.toml 文件
function findCargoFiles() {
  try {
    const result = execSync('find . -name "Cargo.toml"', { encoding: 'utf8' });
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding Cargo.toml files:', error);
    return ['./Cargo.toml'];
  }
}

// 同步版本到所有文件
function syncVersions(version) {
  try {
    version = validateVersion(version);
    
    // 更新所有 Cargo.toml 文件
    const cargoFiles = findCargoFiles();
    cargoFiles.forEach(file => {
      let content = readFileSync(file, 'utf8');
      content = content.replace(
        /^version = ".*"$/m,
        `version = "${version}"`
      );
      writeFileSync(file, content);
    });
    
    // 更新 Info.plist
    const infoPlist = './crates/app/resources/macos/Info.plist';
    if (existsSync(infoPlist)) {
      let plistContent = readFileSync(infoPlist, 'utf8');
      plistContent = plistContent.replace(
        /<string>[0-9]+\.[0-9]+\.[0-9]+<\/string>/,
        `<string>${version}</string>`
      );
      writeFileSync(infoPlist, plistContent);
    }
    
    console.log(`Successfully synced version ${version} to all files`);
  } catch (error) {
    console.error('Error syncing versions:', error);
    process.exit(1);
  }
}

// CLI 支持
if (process.argv[2]) {
  syncVersions(process.argv[2]);
}

export { syncVersions }; 