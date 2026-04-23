import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createWidgetAccessRouter } from "./routes/widget-access.js";
import { checkAccess as checkAccessDefault } from "./services/license-service.js";
import { type DebugLogger } from "./logging/license-debug.js";

const require = createRequire(import.meta.url);
const express = require("express") as {
  (): any;
  static: (root: string, options?: { index?: boolean }) => any;
};

export type CreateAppOptions = {
  checkAccess?: typeof checkAccessDefault;
  htmlTemplate?: string;
  templatePath?: string;
  staticDir?: string;
  purchaseUrl?: string;
  debugLicenses?: boolean;
  logger?: DebugLogger;
};

function loadSpaIndex({
  htmlTemplate,
  templatePath,
}: {
  htmlTemplate?: string;
  templatePath?: string;
}) {
  if (typeof htmlTemplate === "string" && htmlTemplate.length > 0) {
    return htmlTemplate;
  }

  if (typeof templatePath === "string" && templatePath.length > 0) {
    return readFileSync(templatePath, "utf8");
  }

  return undefined;
}

export function createApp({
  checkAccess = checkAccessDefault,
  htmlTemplate,
  templatePath,
  staticDir,
  purchaseUrl,
}: CreateAppOptions = {}) {
  const app = express();
  const spaIndex = loadSpaIndex({ htmlTemplate, templatePath });

  app.disable("x-powered-by");
  if (typeof staticDir === "string" && staticDir.length > 0) {
    app.use(express.static(staticDir, { index: false }));
  }
  app.use(
    createWidgetAccessRouter({
      checkAccess,
      purchaseUrl,
    })
  );

  if (typeof spaIndex === "string") {
    app.get(["/", "/calendar", "/clock", "/days-remaining"], (_req: any, res: any) => {
      res.type("html").send(spaIndex);
    });
  }

  return app;
}
