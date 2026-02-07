const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const requiredFiles = ["index.html", "styles.css"];
const assetExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".gif",
  ".ico",
]);

function ensureCleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function copyFileToDist(fileName) {
  const source = path.join(rootDir, fileName);
  if (!fs.existsSync(source)) return;
  fs.copyFileSync(source, path.join(distDir, fileName));
}

function copyAssetsFolderIfExists() {
  const assetsDir = path.join(rootDir, "assets");
  if (!fs.existsSync(assetsDir)) return;
  fs.cpSync(assetsDir, path.join(distDir, "assets"), { recursive: true });
}

function copyTopLevelAssets() {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!assetExtensions.has(ext)) continue;

    copyFileToDist(entry.name);
  }
}

function build() {
  ensureCleanDist();
  execSync("npx tsc --project tsconfig.json", {
    cwd: rootDir,
    stdio: "inherit",
  });
  requiredFiles.forEach(copyFileToDist);
  copyAssetsFolderIfExists();
  copyTopLevelAssets();
  console.log("Build complete: dist/");
}

build();
