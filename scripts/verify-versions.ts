import packageJson from "../package.json" with { type: "json" };
import { cargoFilesVersion, getInfoPlistVersion } from "./sync-version.ts";

const cargoFiles = cargoFilesVersion();
const pkgVersion = packageJson.version;

for (const [file, version] of cargoFiles) {
  if (version !== pkgVersion) {
    console.error(`Version mismatch in ${file}: ${version} !== ${pkgVersion}`);
  }
}

const infoPlistVersion = getInfoPlistVersion();
if (infoPlistVersion !== pkgVersion) {
  console.error(`Version mismatch in Info.plist: ${infoPlistVersion} !== ${pkgVersion}`);
}
