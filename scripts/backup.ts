import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";

function stamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function addIfExists(zip: AdmZip, source: string, target: string) {
  if (!fs.existsSync(source)) return;
  const stat = fs.statSync(source);
  if (stat.isDirectory()) zip.addLocalFolder(source, target);
  else zip.addLocalFile(source, path.dirname(target), path.basename(target));
}

const root = process.cwd();
const backupDir = path.resolve(root, process.env.BACKUP_PATH ?? "./backups");
fs.mkdirSync(backupDir, { recursive: true });

const zip = new AdmZip();
const databasePath = path.resolve(
  root,
  (process.env.DATABASE_URL ?? "file:./data/app.sqlite").replace(/^file:/, "")
);

addIfExists(zip, databasePath, "data/app.sqlite");
addIfExists(zip, `${databasePath}-wal`, "data/app.sqlite-wal");
addIfExists(zip, `${databasePath}-shm`, "data/app.sqlite-shm");
addIfExists(zip, path.resolve(root, "prompts"), "prompts");
addIfExists(zip, path.resolve(root, "storage"), "storage");

zip.addFile(
  "manifest.json",
  Buffer.from(
    JSON.stringify(
      {
        app: "link-intelligence-hub",
        createdAt: new Date().toISOString(),
        includes: ["sqlite", "prompts", "storage-if-present"]
      },
      null,
      2
    )
  )
);

const file = path.join(backupDir, `backup-${stamp()}.zip`);
zip.writeZip(file);
console.log(`Backup created: ${file}`);
