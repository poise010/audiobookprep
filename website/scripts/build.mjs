import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const item of ["index.html", "assets", "studio", "robots.txt"])
  await cp(path.join(root, item), path.join(dist, item), { recursive: true });
// Static, dependency-free source also produces a scoped Squarespace code-block body.
// Host assets at /s/ or replace /s/ with the deployed asset origin in these snippets.
const html = await readFile(path.join(root, "index.html"), "utf8");
const body = html
  .match(/<body>([\s\S]*)<\/body>/)[1]
  .replaceAll("./assets/", "/s/")
  .replaceAll("./studio/", "/studio/")
  .replaceAll('href="./"', 'href="/"');
await mkdir(path.join(dist, "squarespace"), { recursive: true });
await writeFile(path.join(dist, "squarespace", "page-body.html"), body);
const studio = (await readFile(path.join(root, "studio/index.html"), "utf8"))
  .match(/<body>([\s\S]*)<\/body>/)[1]
  .replaceAll("../assets/", "/s/")
  .replaceAll('href="../', 'href="/');
await writeFile(path.join(dist, "squarespace", "studio-body.html"), studio);
// Exclude document-level resets from the embedded stylesheet. All other
// selectors are scoped to .abp-site so they cannot restyle Squarespace chrome.
const embedCss = (await readFile(path.join(root, "assets/site.css"), "utf8"))
  .replace(/(^|\n)\s*html\s*\{[^}]*\}/g, "$1")
  .replace(/(^|\n)\s*body\s*\{[^}]*\}/g, "$1");
await writeFile(path.join(dist, "assets/embed.css"), embedCss);
await writeFile(
  path.join(dist, "squarespace", "header-injection.html"),
  '<!-- Replace /s/ with your asset-host URL if assets are hosted elsewhere. -->\n<link rel="stylesheet" href="/s/embed.css">\n<link rel="icon" href="/s/mark.svg" type="image/svg+xml">\n',
);
// Inline the small module graph for Squarespace, avoiding filename rewriting of relative imports.
const pricing = (
  await readFile(path.join(root, "assets/pricing.js"), "utf8")
).replaceAll("export ", "");
const script = (
  await readFile(path.join(root, "assets/site.js"), "utf8")
).replace(/^import[\s\S]*?from ["']\.\/pricing\.js["'];\s*/, "");
await writeFile(
  path.join(dist, "squarespace", "footer-injection.html"),
  `<script type="module">\nif (document.querySelector('.abp-site')) {\n${pricing}\n${script}\n}\n</script>\n`,
);
console.log(
  "Built dist/: standalone site + Squarespace integration snippets. No runtime dependencies.",
);
