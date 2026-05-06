#!/usr/bin/env node
/**
 * Vaseworks build script.
 *
 * The app is a single-file HTML artifact that loads its dependencies
 * (React, ReactDOM, Babel, Google Fonts) from CDNs at runtime, so
 * "building" it just means copying src/ → dist/. We keep this as a
 * dedicated step so the pipeline matches what frontend tooling expects
 * (npm run build → ./dist artifact ready to deploy).
 */
import { cp, mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcDir = join(root, "src");
const distDir = join(root, "dist");

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function main() {
  if (!(await exists(srcDir))) {
    console.error(`✗ source directory not found: ${srcDir}`);
    process.exit(1);
  }
  if (await exists(distDir)) {
    await rm(distDir, { recursive: true, force: true });
  }
  await mkdir(distDir, { recursive: true });
  await cp(srcDir, distDir, { recursive: true });
  console.log(`✓ built dist/ from src/`);
  console.log(`  serve locally:  npm run preview`);
  console.log(`  deploy:         upload contents of dist/ to any static host`);
}

main().catch((err) => {
  console.error("✗ build failed:", err);
  process.exit(1);
});
