import { createRequire } from "node:module";
import { DEFAULT_WIDGET_PURCHASE_URL } from "@repo/shared";
import type { LicenseAccessResult } from "../services/license-service.js";

const require = createRequire(import.meta.url);
const { Router } = require("express") as {
  Router: () => any;
};

function normalizeQueryValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return undefined;
}

export function createWidgetAccessRouter({
  checkAccess,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
}: {
  checkAccess: (license: string | undefined) => Promise<LicenseAccessResult>;
  purchaseUrl?: string;
}) {
  const router = Router();

  router.get("/api/widget-access", async (req: any, res: any) => {
    const license = normalizeQueryValue(req.query.license);
    const access = await checkAccess(license);

    res.json({
      accessGranted: access.access === true,
      purchaseUrl,
      ...(typeof access.reason === "string" ? { reason: access.reason } : {}),
    });
  });

  return router;
}
