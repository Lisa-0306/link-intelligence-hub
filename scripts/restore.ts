import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";

const archive = process.argv[2];
if (!archive) {
  console.error("Usage: npm run restore -- ./backups/backup-YYYYMMDD-HHmmss.zip");
  process.exit(1);
}

const root = process.cwd();
const archivePath = path.resolve(root, archive);
if (!fs.existsSync(archivePath)) {
  console.error(`Backup file not found: ${archivePath}`);
  process.exit(1);
}

const zip = new AdmZip(archivePath);
zip.extractAllTo(root, true);
console.log(`Restored backup into: ${root}`);
