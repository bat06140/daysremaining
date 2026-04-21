import { createRequire } from "node:module";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  type WidgetKey,
  type WidgetRuntime,
} from "@repo/shared";
import { createTemplateLoader, renderWidgetPage } from "../html/render-widget-page.js";
import type { LicenseAccessResult } from "../services/license-service.js";

const require = createRequire(import.meta.url);
const { Router } = require("express") as {
  Router: () => any;
};

const WIDGET_ROUTES: ReadonlyArray<readonly [string, WidgetKey]> = [
  ["/calendar", "calendar"],
  ["/clock", "clock"],
  ["/days-remaining", "daysRemaining"],
];

function normalizeQueryValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return undefined;
}

export type WidgetsRouterOptions = {
  checkAccess: (license: string | undefined) => Promise<LicenseAccessResult>;
  htmlTemplate?: string;
  templatePath?: string;
  purchaseUrl?: string;
};

export function createWidgetsRouter({
  checkAccess,
  htmlTemplate,
  templatePath,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
}: WidgetsRouterOptions) {
  const router = Router();
  const loadTemplate = createTemplateLoader({ htmlTemplate, templatePath });

  for (const [routePath, widget] of WIDGET_ROUTES) {
    router.get(routePath, async (req: any, res: any) => {
      try {
        const access = await checkAccess(normalizeQueryValue(req.query.license));
        const runtime: WidgetRuntime = {
          widget,
          accessGranted: access.access === true,
          purchaseUrl,
          ...(typeof access.reason === "string" ? { reason: access.reason } : {}),
        };

        res.type("html").send(
          await renderWidgetPage({
            loadTemplate,
            runtime,
          })
        );
      } catch {
        res.status(503).type("html").send(
          "<!DOCTYPE html><html><body><h1>Service indisponible</h1></body></html>"
        );
      }
    });
  }

  return router;
}
