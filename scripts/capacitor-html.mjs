import { readdirSync, writeFileSync } from "fs";
import { join } from "path";

const clientDir = join(import.meta.dirname, "..", "dist", "client");
const assetsDir = join(clientDir, "assets");

const files = readdirSync(assetsDir);
const cssFiles = files.filter((f) => f.endsWith(".css"));
const jsFiles = files.filter((f) => f.endsWith(".js"));

const cssTags = cssFiles
  .map((f) => `    <link rel="stylesheet" href="/assets/${f}">`)
  .join("\n");
const jsTags = jsFiles
  .map((f) => `    <script type="module" src="/assets/${f}"></script>`)
  .join("\n");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#09090b" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>Safebox</title>
    <meta name="description" content="Local-only password manager. AES-256-GCM encrypted vault that runs entirely in your browser." />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="manifest" href="/manifest.json" />
${cssTags}
  </head>
  <body>
    <div id="root"></div>
${jsTags}
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html);
console.log("Generated dist/client/index.html");
