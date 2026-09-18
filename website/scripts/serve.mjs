import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const website = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const root = path.resolve(website, process.argv[2] || ".");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};
const port = Number(process.env.PORT || 4173);
http
  .createServer(async (req, res) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" });
        return res.end();
      }
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let target = path.resolve(root, `.${pathname}`);
      if (!target.startsWith(root + path.sep) && target !== root) {
        res.writeHead(403);
        return res.end("Forbidden");
      }
      const relative = path.relative(root, target);
      if (
        relative.split(path.sep).some((part) => part.startsWith(".")) ||
        ![
          "",
          "index.html",
          "robots.txt",
          "studio",
          "assets",
          "squarespace",
        ].includes(relative.split(path.sep)[0])
      ) {
        res.writeHead(404);
        return res.end("Not found");
      }
      if ((await stat(target)).isDirectory()) {
        if (!pathname.endsWith("/")) {
          res.writeHead(301, { Location: pathname + "/" });
          return res.end();
        }
        target = path.join(target, "index.html");
      }
      const content = await readFile(target);
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(target)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Page not found.");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`AudiobookPrep: http://localhost:${port}`),
  );
