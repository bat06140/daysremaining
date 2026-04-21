import "dotenv/config";
import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkAccess as checkAccessDefault } from "./licenseService.js";

const DEFAULT_PURCHASE_URL = "https://atomicskills.academy/widgets-notion/";
const DEFAULT_TEMPLATE_PATH = fileURLToPath(
  new URL("./dist/index.html", import.meta.url)
);
const DEFAULT_STATIC_DIR = path.dirname(DEFAULT_TEMPLATE_PATH);
const WIDGET_ROUTES = new Map([
  ["/calendar", "calendar"],
  ["/clock", "clock"],
  ["/days-remaining", "daysRemaining"],
]);

function normalizeQueryValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return undefined;
}

function serializeRuntime(runtime) {
  return JSON.stringify(runtime)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function injectWidgetRuntime(htmlTemplate, runtime) {
  const runtimeScript =
    `<script>window.__WIDGET_RUNTIME__=${serializeRuntime(runtime)};</script>`;

  if (htmlTemplate.includes("<!--WIDGET_RUNTIME-->")) {
    return htmlTemplate.replace("<!--WIDGET_RUNTIME-->", runtimeScript);
  }

  if (htmlTemplate.includes("</head>")) {
    return htmlTemplate.replace("</head>", `${runtimeScript}</head>`);
  }

  return `${runtimeScript}${htmlTemplate}`;
}

function createTemplateLoader({ htmlTemplate, templatePath }) {
  if (typeof htmlTemplate === "string") {
    return async () => htmlTemplate;
  }

  let pendingTemplate;

  return async () => {
    if (!pendingTemplate) {
      pendingTemplate = readFile(templatePath, "utf8");
    }

    return pendingTemplate;
  };
}

export function createApp({
  checkAccess = checkAccessDefault,
  htmlTemplate,
  templatePath = DEFAULT_TEMPLATE_PATH,
  staticDir = DEFAULT_STATIC_DIR,
  purchaseUrl = DEFAULT_PURCHASE_URL,
} = {}) {
  const app = express();
  const loadTemplate = createTemplateLoader({ htmlTemplate, templatePath });

  app.disable("x-powered-by");
  app.use(express.static(staticDir, { index: false }));

  for (const [routePath, widget] of WIDGET_ROUTES) {
    app.get(routePath, async (req, res) => {
      try {
        const access = await checkAccess(normalizeQueryValue(req.query.license));
        const template = await loadTemplate();
        const runtime = {
          widget,
          accessGranted: access.access === true,
          purchaseUrl,
          ...(typeof access.reason === "string" ? { reason: access.reason } : {}),
        };

        res.type("html").send(injectWidgetRuntime(template, runtime));
      } catch {
        res.status(503).type("html").send(
          "<!DOCTYPE html><html><body><h1>Service indisponible</h1></body></html>"
        );
      }
    });
  }

  return app;
}

export async function startServer({
  port = Number(process.env.PORT ?? 3000),
  ...options
} = {}) {
  const app = createApp(options);

  return await new Promise((resolve, reject) => {
    const nextServer = app.listen(port, () => {
      setImmediate(() => resolve(nextServer));
    });
    nextServer.once("error", reject);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
