import fs from "fs";
import path from "path";

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files.push(...walk(full));
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) files.push(full);
  }
  return files;
}

const allFiles = walk("src");
let found = 0;
for (const file of allFiles) {
  const content = fs.readFileSync(file, "utf8");
  const isClient = content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'");
  if (!isClient) {
    const matches = content.match(/<[A-Z][A-Za-z0-9]+\s+[^>]*\b(formatPrice|on[A-Z][a-zA-Z]+)\s*=/g);
    if (matches) {
      console.log("Server file:", file, "matches:", matches);
      found++;
    }
  }
}
console.log(`Scan complete. Found ${found} suspicious files.`);
