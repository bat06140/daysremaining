import { createRequire } from "node:module";
import { createWidgetsRouter } from "./routes/widgets.js";
import { injectWidgetRuntime } from "./html/render-widget-page.js";
import { checkAccess as checkAccessDefault } from "./services/license-service.js";

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
};

export function createApp({
  checkAccess = checkAccessDefault,
  htmlTemplate,
  templatePath,
  staticDir,
  purchaseUrl,
}: CreateAppOptions = {}) {
  const app = express();

  app.disable("x-powered-by");
  if (typeof staticDir === "string" && staticDir.length > 0) {
    app.use(express.static(staticDir, { index: false }));
  }
  app.use(
    createWidgetsRouter({
      checkAccess,
      htmlTemplate,
      templatePath,
      purchaseUrl,
    })
  );

  return app;
}

export { injectWidgetRuntime };
