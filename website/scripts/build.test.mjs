import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: root });

test("Standalone pages have working local assets, page links and anchors", () => {
  for (const page of ["index.html", "studio/index.html"]) {
    const html = readFileSync(path.join(root, "dist", page), "utf8");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page}: duplicate ids`);
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^https?:/.test(url)) continue;
      const [file, anchor] = url.split("#");
      if (!file && anchor) {
        assert.ok(ids.includes(anchor), `${page}: missing #${anchor}`);
        continue;
      }
      let target = path.resolve(root, "dist", path.dirname(page), file);
      assert.ok(existsSync(target), `${page}: missing ${url}`);
      if (statSync(target).isDirectory())
        target = path.join(target, "index.html");
      assert.ok(existsSync(target), `${page}: missing index ${url}`);
      if (anchor)
        assert.ok(readFileSync(target, "utf8").includes(`id="${anchor}"`));
    }
  }
});
test("Squarespace footer has a syntactically valid, self-contained module", () => {
  const html = readFileSync(
    path.join(root, "dist/squarespace/footer-injection.html"),
    "utf8",
  );
  const js = html.match(/<script type="module">([\s\S]*)<\/script>/)[1];
  assert.ok(!/^import\s/m.test(js));
  assert.ok(!/^export\s/m.test(js));
  execFileSync(process.execPath, ["--input-type=module", "--check"], {
    input: js,
  });
});
test("Squarespace pages reference the correct public roots", () => {
  for (const file of ["page-body.html", "studio-body.html"]) {
    const html = readFileSync(
      path.join(root, "dist/squarespace", file),
      "utf8",
    );
    assert.ok(!html.includes('href="./') && !html.includes('src="./'));
    assert.ok(html.includes("/s/mark.svg"));
  }
  const css = readFileSync(path.join(root, "dist/assets/embed.css"), "utf8");
  assert.ok(!/(^|\n)\s*(?:html|body)\s*\{/.test(css));
  assert.ok(css.includes('.abp-site .studio-placeholder-body {'));
});
