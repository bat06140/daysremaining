# LM4WC License Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add direct LM4WC-backed license validation in Node/Express, remove the public `hasLicense` flag, expose dedicated widget routes, and switch the palette UI between locked and premium modes based on server validation of the `license` query parameter.

**Architecture:** Keep the Vite frontend as a single built HTML document, but let Express own the external routes (`/calendar`, `/clock`, `/days-remaining`) and inject a small runtime payload containing the widget type and access state. Move frontend licensing decisions to a runtime config reader and move backend license verification into isolated modules (`db.js`, `crypto.js`, `licenseService.js`) with cache-backed access checks.

**Tech Stack:** React 18, TypeScript, Vite single-file build, Node.js ESM, Express, MySQL2, node-cache, dotenv, node:test

---

## File Structure

### Frontend runtime and access files

- Create: `src/lib/widget-runtime.ts`
  - Read and normalize `window.__WIDGET_RUNTIME__`.
- Create: `src/lib/widget-access.ts`
  - Centralize locked/premium UI decisions for widgets.
- Modify: `src/App.tsx`
  - Use runtime widget/access state instead of URL-driven `hasLicense`.
- Modify: `src/lib/view-config.ts`
  - Stop parsing `hasLicense` and stop treating `license` as a boolean alias.
- Modify: `custom.d.ts`
  - Declare `window.__WIDGET_RUNTIME__`.

### Widget component files

- Modify: `src/components/widget-registry.tsx`
  - Replace `hasLicense` prop with `accessGranted`.
- Modify: `src/components/Calendar.tsx`
- Modify: `src/components/FlipClock.tsx`
- Modify: `src/components/DaysRemaining.tsx`
- Modify: `src/components/CenteredPopover.tsx`
- Modify: `src/components/WidgetThemeEditor.tsx`
- Modify: `src/components/WidgetShowcase.tsx`
  - Consume shared locked/premium access semantics.

### Backend files

- Create: `db.js`
  - Shared MySQL2 pool.
- Create: `crypto.js`
  - LM4WC/Defuse-compatible decryption entrypoint.
- Create: `licenseService.js`
  - Cached access checks and in-memory decrypted index.
- Create: `server.js`
  - Express app, route handling, HTML injection.
- Modify: `.env.example`
  - Add DB and LM4WC secrets.
- Modify: `index.html`
  - Add server-side runtime placeholder.
- Modify: `package.json`
  - Add server dependencies and start/build/test scripts.

### Test files

- Modify: `tests/tsconfig.json`
  - Include new frontend runtime helper files.
- Modify: `tests/view-config.test.ts`
  - Remove `hasLicense` expectations.
- Create: `tests/widget-runtime.test.ts`
- Create: `tests/widget-access.test.ts`
- Create: `tests/server/licenseService.test.js`
- Create: `tests/server/server.test.js`

### Verification commands

- `npm run test`
- `npm run build`
- `node server.js`

---

### Task 1: Move Frontend Access State To Server Runtime

**Files:**
- Create: `src/lib/widget-runtime.ts`
- Modify: `src/App.tsx`
- Modify: `src/lib/view-config.ts`
- Modify: `custom.d.ts`
- Modify: `tests/tsconfig.json`
- Modify: `tests/view-config.test.ts`
- Create: `tests/widget-runtime.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/view-config.test.ts
test("resolveAppView no longer returns a license flag", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView ignores the license query param for access", () => {
  assert.deepEqual(resolveAppView("?widget=calendar&license=ABC-123"), {
    kind: "widget",
    widget: "calendar",
    layout: "square",
  });
});

// tests/widget-runtime.test.ts
import { readWidgetRuntime } from "../src/lib/widget-runtime.js";

test("readWidgetRuntime returns locked mode by default", () => {
  assert.deepEqual(readWidgetRuntime(undefined), {
    widget: undefined,
    accessGranted: false,
    purchaseUrl: "https://atomicskills.academy/widgets-notion/",
  });
});

test("readWidgetRuntime normalizes server-injected access state", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "calendar",
      accessGranted: true,
      reason: undefined,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
    },
  } as Window);

  assert.deepEqual(runtime, {
    widget: "calendar",
    accessGranted: true,
    purchaseUrl: "https://atomicskills.academy/widgets-notion/",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `tsc -p tests/tsconfig.json && node --test .test-dist/tests/view-config.test.js .test-dist/tests/widget-runtime.test.js`

Expected: FAIL with the old `hasLicense` shape still present and `Cannot find module '../src/lib/widget-runtime.js'`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/view-config.ts
export type AppView =
  | {
      kind: "widget";
      widget: WidgetKey;
      layout: WidgetLayout;
    }
  | {
      kind: "showcase";
    };

export function resolveAppView(search: string, envWidget?: string): AppView {
  const params = new URLSearchParams(search);
  const requestedWidget = params.get("widget");
  const requestedLayout = params.get("layout");

  if (params.get("view") === "showcase") {
    return { kind: "showcase" };
  }

  return {
    kind: "widget",
    widget: isWidgetKey(requestedWidget)
      ? requestedWidget
      : isWidgetKey(envWidget)
        ? envWidget
        : FALLBACK_WIDGET,
    layout: isWidgetLayout(requestedLayout) ? requestedLayout : "square",
  };
}

// src/lib/widget-runtime.ts
import { WidgetKey } from "@/lib/view-config";

export type WidgetRuntime = {
  widget?: WidgetKey;
  accessGranted: boolean;
  reason?: string;
  purchaseUrl: string;
};

const DEFAULT_PURCHASE_URL = "https://atomicskills.academy/widgets-notion/";

export function readWidgetRuntime(
  win: Pick<Window, "__WIDGET_RUNTIME__"> | undefined = window
): WidgetRuntime {
  const runtime = win?.__WIDGET_RUNTIME__;

  return {
    widget:
      runtime?.widget === "calendar" ||
      runtime?.widget === "clock" ||
      runtime?.widget === "daysRemaining"
        ? runtime.widget
        : undefined,
    accessGranted: runtime?.accessGranted === true,
    reason: typeof runtime?.reason === "string" ? runtime.reason : undefined,
    purchaseUrl:
      typeof runtime?.purchaseUrl === "string"
        ? runtime.purchaseUrl
        : DEFAULT_PURCHASE_URL,
  };
}

// src/App.tsx
const runtime = readWidgetRuntime();
const resolvedView = resolveAppView(window.location.search, runtime.widget ?? import.meta.env.VITE_COMPONENT);

return (
  <WidgetThemeProvider>
    {resolvedView.kind === "showcase"
      ? <WidgetShowcase hasLicense={runtime.accessGranted} />
      : renderWidget({
          widget: resolvedView.widget,
          layout: resolvedView.layout,
          hasLicense: runtime.accessGranted,
        })}
  </WidgetThemeProvider>
);

// custom.d.ts
interface Window {
  __WIDGET_RUNTIME__?: {
    widget?: "calendar" | "clock" | "daysRemaining";
    accessGranted?: boolean;
    reason?: string;
    purchaseUrl?: string;
  };
}

// tests/tsconfig.json
{
  "include": [
    "../tests/**/*.ts",
    "../src/lib/view-config.ts",
    "../src/lib/widget-runtime.ts",
    "../src/lib/showcase-layout.ts",
    "../src/lib/font-fit.ts",
    "../src/lib/widget-theme.ts",
    "../src/lib/calendar-theme.ts",
    "../src/lib/days-remaining.ts"
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `tsc -p tests/tsconfig.json && node --test .test-dist/tests/view-config.test.js .test-dist/tests/widget-runtime.test.js`

Expected: PASS for the updated view shape and the new runtime reader.

- [ ] **Step 5: Commit**

```bash
git add tests/view-config.test.ts tests/widget-runtime.test.ts tests/tsconfig.json src/lib/view-config.ts src/lib/widget-runtime.ts src/App.tsx custom.d.ts
git commit -m "refactor: move widget access state to runtime config"
```

---

### Task 2: Switch Widgets To Locked And Premium Modes

**Files:**
- Modify: `src/App.tsx`
- Create: `src/lib/widget-access.ts`
- Create: `tests/widget-access.test.ts`
- Modify: `src/components/widget-registry.tsx`
- Modify: `src/components/Calendar.tsx`
- Modify: `src/components/FlipClock.tsx`
- Modify: `src/components/DaysRemaining.tsx`
- Modify: `src/components/CenteredPopover.tsx`
- Modify: `src/components/WidgetThemeEditor.tsx`
- Modify: `src/components/WidgetShowcase.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/widget-access.test.ts
import { getThemeEditorMode, shouldShowWidgetBranding } from "../src/lib/widget-access.js";

test("licensed widgets use premium mode when the editor is allowed", () => {
  assert.equal(getThemeEditorMode(true, true), "premium");
});

test("locked widgets keep the palette visible when the editor is allowed", () => {
  assert.equal(getThemeEditorMode(false, true), "locked");
});

test("widgets without editor permission hide the palette entirely", () => {
  assert.equal(getThemeEditorMode(false, false), "hidden");
  assert.equal(getThemeEditorMode(true, false), "hidden");
});

test("branding stays visible only when access is locked", () => {
  assert.equal(shouldShowWidgetBranding(false, undefined), true);
  assert.equal(shouldShowWidgetBranding(true, undefined), false);
  assert.equal(shouldShowWidgetBranding(true, true), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `tsc -p tests/tsconfig.json && node --test .test-dist/tests/widget-access.test.js`

Expected: FAIL with `Cannot find module '../src/lib/widget-access.js'`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/widget-access.ts
export type ThemeEditorMode = "premium" | "locked" | "hidden";

export const getThemeEditorMode = (
  accessGranted: boolean,
  allowThemeEditor: boolean
): ThemeEditorMode => {
  if (!allowThemeEditor) {
    return "hidden";
  }

  return accessGranted ? "premium" : "locked";
};

export const shouldShowWidgetBranding = (
  accessGranted: boolean,
  showBranding?: boolean
) => {
  return showBranding ?? !accessGranted;
};

// src/components/WidgetThemeEditor.tsx
export const WidgetThemeEditor = ({
  mode,
  purchaseUrl,
  suspendHoverReveal = false,
  paletteButtonClassName,
}: {
  mode: ThemeEditorMode;
  purchaseUrl: string;
  suspendHoverReveal?: boolean;
  paletteButtonClassName?: string;
}) => {
  if (mode === "hidden") {
    return null;
  }

  const isLocked = mode === "locked";

  return (
    <button
      type="button"
      aria-label={
        isLocked ? "Unlock premium theme customization" : "Customize widget colors"
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isLocked) {
          window.location.assign(purchaseUrl);
          return;
        }
        setIsOpen(true);
      }}
    >
      <Palette size={14} />
      {isLocked && <Lock size={12} className="absolute -right-0.5 -top-0.5" />}
    </button>
  );
};

// src/components/Calendar.tsx
const editorMode = getThemeEditorMode(accessGranted, allowThemeEditor);
const shouldShowBranding = showBranding ?? !accessGranted;
const effectiveTheme = accessGranted ? theme : DEFAULT_WIDGET_THEME;

<WidgetThemeEditor mode={editorMode} purchaseUrl={purchaseUrl} />

// src/App.tsx
{resolvedView.kind === "showcase"
  ? <WidgetShowcase accessGranted={runtime.accessGranted} purchaseUrl={runtime.purchaseUrl} />
  : renderWidget({
      widget: resolvedView.widget,
      layout: resolvedView.layout,
      accessGranted: runtime.accessGranted,
      purchaseUrl: runtime.purchaseUrl,
    })}

// tests/tsconfig.json
{
  "include": [
    "../tests/**/*.ts",
    "../src/lib/view-config.ts",
    "../src/lib/widget-runtime.ts",
    "../src/lib/widget-access.ts",
    "../src/lib/showcase-layout.ts",
    "../src/lib/font-fit.ts",
    "../src/lib/widget-theme.ts",
    "../src/lib/calendar-theme.ts",
    "../src/lib/days-remaining.ts"
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `tsc -p tests/tsconfig.json && node --test .test-dist/tests/view-config.test.js .test-dist/tests/widget-runtime.test.js .test-dist/tests/widget-access.test.js`

Expected: PASS for the new access helpers and the runtime tests from Task 1.

- [ ] **Step 5: Commit**

```bash
git add tests/widget-access.test.ts src/App.tsx src/lib/widget-access.ts src/components/widget-registry.tsx src/components/Calendar.tsx src/components/FlipClock.tsx src/components/DaysRemaining.tsx src/components/CenteredPopover.tsx src/components/WidgetThemeEditor.tsx src/components/WidgetShowcase.tsx
git commit -m "feat: add locked and premium widget access modes"
```

---

### Task 3: Add LM4WC Decryption And Cached Access Checks

**Files:**
- Create: `db.js`
- Create: `crypto.js`
- Create: `licenseService.js`
- Create: `tests/server/licenseService.test.js`
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Write the failing tests**

```js
// tests/server/licenseService.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { createLicenseService } from "../../licenseService.js";

const rows = [
  { license_key: "enc-active", status: 3, expires_at: "2099-01-01 00:00:00" },
  { license_key: "enc-inactive", status: 2, expires_at: null },
  { license_key: "enc-expired", status: 3, expires_at: "2000-01-01 00:00:00" },
  { license_key: "enc-bad", status: 3, expires_at: null },
];

test("checkAccess grants a matching active key", async () => {
  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => rows,
    decryptLicenseKey: (encrypted) => ({
      "enc-active": "VALID-KEY",
      "enc-inactive": "INACTIVE-KEY",
      "enc-expired": "EXPIRED-KEY",
    })[encrypted] ?? (() => { throw new Error("bad row"); })(),
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  assert.deepEqual(await service.checkAccess("VALID-KEY"), { access: true });
});

test("checkAccess rejects inactive and expired keys", async () => {
  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => rows,
    decryptLicenseKey: (encrypted) => ({
      "enc-active": "VALID-KEY",
      "enc-inactive": "INACTIVE-KEY",
      "enc-expired": "EXPIRED-KEY",
    })[encrypted] ?? (() => { throw new Error("bad row"); })(),
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  assert.deepEqual(await service.checkAccess("INACTIVE-KEY"), {
    access: false,
    reason: "Licence inactive",
  });
  assert.deepEqual(await service.checkAccess("EXPIRED-KEY"), {
    access: false,
    reason: "Licence expirée",
  });
});

test("checkAccess returns service unavailable when the database fetch fails", async () => {
  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => {
      throw new Error("db down");
    },
    decryptLicenseKey: () => "IGNORED",
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  assert.deepEqual(await service.checkAccess("ANY-KEY"), {
    access: false,
    reason: "Service indisponible",
  });
});

test("checkAccess skips rows that fail decryption and caches the first result", async () => {
  let fetchCount = 0;

  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => {
      fetchCount += 1;
      return rows;
    },
    decryptLicenseKey: (encrypted) => ({
      "enc-active": "VALID-KEY",
      "enc-inactive": "INACTIVE-KEY",
      "enc-expired": "EXPIRED-KEY",
    })[encrypted] ?? (() => { throw new Error("bad row"); })(),
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  await service.checkAccess("VALID-KEY");
  await service.checkAccess("VALID-KEY");

  assert.equal(fetchCount, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/server/licenseService.test.js`

Expected: FAIL with `Cannot find module '../../licenseService.js'`.

- [ ] **Step 3: Write the minimal implementation**

```js
// db.js
import mysql from "mysql2/promise";

let pool;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return pool;
}

export async function fetchLicenseRows() {
  const [rows] = await getDbPool().query(`
    SELECT license_key, status, expires_at
    FROM wp_lmfwc_licenses
    WHERE status IN (2, 3)
  `);

  return rows;
}

// crypto.js
import crypto from "node:crypto";

export function decryptLicenseKey(encryptedHex) {
  const payload = Buffer.from(encryptedHex, "hex");
  const version = payload.subarray(0, 4);
  const mac = payload.subarray(4, 36);
  const iv = payload.subarray(36, 52);
  const ciphertext = payload.subarray(52);

  const secret = Buffer.from(process.env.LMFWC_SECRET ?? "", "utf8");
  const defuse = Buffer.from(process.env.LMFWC_DEFUSE ?? "", "utf8");
  const derived = crypto.hkdfSync("sha256", secret, Buffer.alloc(0), defuse, 64);
  const encKey = derived.subarray(0, 32);
  const macKey = derived.subarray(32);
  const expectedMac = crypto
    .createHmac("sha256", macKey)
    .update(Buffer.concat([version, iv, ciphertext]))
    .digest();

  if (!crypto.timingSafeEqual(mac, expectedMac)) {
    throw new Error("Invalid license HMAC");
  }

  const decipher = crypto.createDecipheriv("aes-256-cbc", encKey, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// licenseService.js
import NodeCache from "node-cache";
import { fetchLicenseRows } from "./db.js";
import { decryptLicenseKey as decryptDefault } from "./crypto.js";

export function createLicenseService({
  cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS ?? 3600),
  fetchRows = fetchLicenseRows,
  decryptLicenseKey = decryptDefault,
  now = () => new Date(),
} = {}) {
  const cache = new NodeCache({ stdTTL: cacheTtlSeconds });
  let records = new Map();
  let lastRefreshAt = 0;

  async function refreshIndex() {
    const nextRecords = new Map();
    const rows = await fetchRows();

    for (const row of rows) {
      try {
        const key = decryptLicenseKey(row.license_key);
        nextRecords.set(key, {
          status: Number(row.status),
          expiresAt: row.expires_at ? new Date(row.expires_at) : null,
        });
      } catch {
        continue;
      }
    }

    records = nextRecords;
    lastRefreshAt = Date.now();
  }

  async function checkAccess(key) {
    if (!key) {
      return { access: false, reason: "Licence manquante" };
    }

    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    try {
      if (records.size === 0 || Date.now() - lastRefreshAt > cacheTtlSeconds * 1000) {
        await refreshIndex();
      }
    } catch {
      return { access: false, reason: "Service indisponible" };
    }

    const record = records.get(key);
    const result =
      !record
        ? { access: false, reason: "Licence introuvable" }
        : record.status !== 3
          ? { access: false, reason: "Licence inactive" }
          : record.expiresAt && record.expiresAt <= now()
            ? { access: false, reason: "Licence expirée" }
            : { access: true };

    cache.set(key, result);
    return result;
  }

  return { checkAccess, refreshIndex };
}

export const { checkAccess, refreshIndex } = createLicenseService();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/server/licenseService.test.js`

Expected: PASS for active, inactive, expired, decryption-skip, cache-hit, and DB-unavailable cases.

- [ ] **Step 5: Commit**

```bash
git add package.json .env.example db.js crypto.js licenseService.js tests/server/licenseService.test.js
git commit -m "feat: add cached LM4WC license validation service"
```

---

### Task 4: Serve Dedicated Widget Routes Through Express

**Files:**
- Create: `server.js`
- Create: `tests/server/server.test.js`
- Modify: `index.html`
- Modify: `package.json`

- [ ] **Step 1: Write the failing integration tests**

```js
// tests/server/server.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../../server.js";

test("calendar route injects premium runtime state", async () => {
  const app = createApp({
    checkAccess: async (key) => {
      assert.equal(key, "VALID-KEY");
      return { access: true };
    },
    htmlTemplate: `
      <html>
        <body>
          <div id="root"></div>
          <script>window.__WIDGET_RUNTIME__=__WIDGET_RUNTIME__;</script>
        </body>
      </html>
    `,
  });

  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/calendar?layout=square&license=VALID-KEY`);
  const html = await response.text();
  server.close();

  assert.equal(response.status, 200);
  assert.match(html, /"widget":"calendar"/);
  assert.match(html, /"accessGranted":true/);
});

test("clock route injects locked runtime state when the license is absent", async () => {
  const app = createApp({
    checkAccess: async () => ({ access: false, reason: "Licence manquante" }),
    htmlTemplate: `
      <html>
        <body>
          <div id="root"></div>
          <script>window.__WIDGET_RUNTIME__=__WIDGET_RUNTIME__;</script>
        </body>
      </html>
    `,
  });

  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/clock`);
  const html = await response.text();
  server.close();

  assert.equal(response.status, 200);
  assert.match(html, /"widget":"clock"/);
  assert.match(html, /"accessGranted":false/);
  assert.match(html, /"purchaseUrl":"https:\\/\\/atomicskills.academy\\/widgets-notion\\//);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/server/server.test.js`

Expected: FAIL with `Cannot find module '../../server.js'`.

- [ ] **Step 3: Write the minimal implementation**

```js
// index.html
<body>
  <div id="root"></div>
  <script>window.__WIDGET_RUNTIME__=__WIDGET_RUNTIME__;</script>
  <script type="module" src="/src/main.tsx"></script>
</body>

// server.js
import "dotenv/config";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkAccess } from "./licenseService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PURCHASE_URL = "https://atomicskills.academy/widgets-notion/";

export function createApp({
  checkAccess: checkAccessOverride = checkAccess,
  htmlTemplate,
} = {}) {
  const app = express();

  const renderWidgetHtml = async (widget, license) => {
    const access = await checkAccessOverride(license);
    const runtime = JSON.stringify({
      widget,
      accessGranted: access.access,
      reason: access.reason,
      purchaseUrl: PURCHASE_URL,
    });
    const template =
      htmlTemplate ??
      await fs.readFile(path.join(__dirname, "dist", "index.html"), "utf8");

    return template.replace("__WIDGET_RUNTIME__", runtime);
  };

  for (const route of [
    ["calendar", "calendar"],
    ["clock", "clock"],
    ["days-remaining", "daysRemaining"],
  ]) {
    const [pathname, widget] = route;
    app.get(`/${pathname}`, async (req, res) => {
      const html = await renderWidgetHtml(widget, req.query.license);
      res.type("html").send(html);
    });
  }

  app.use("/assets", express.static(path.join(__dirname, "dist", "assets")));

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port);
}

// package.json
{
  "scripts": {
    "build": "tsc && vite build",
    "start": "node server.js",
    "test": "tsc -p tests/tsconfig.json && node --test .test-dist/tests/**/*.test.js tests/server/**/*.test.js"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/server/server.test.js`

Expected: PASS for `/calendar`, `/clock`, and `/days-remaining` route injection behavior.

- [ ] **Step 5: Commit**

```bash
git add index.html package.json server.js tests/server/server.test.js
git commit -m "feat: serve widgets through dedicated express routes"
```

---

### Task 5: Finish Wiring, Install Dependencies, And Verify End To End

**Files:**
- Modify: `package.json`
- Modify: `src/App.tsx`
- Modify: `src/components/widget-registry.tsx`
- Modify: `src/components/Calendar.tsx`
- Modify: `src/components/FlipClock.tsx`
- Modify: `src/components/DaysRemaining.tsx`
- Modify: `src/components/CenteredPopover.tsx`
- Modify: `src/components/WidgetThemeEditor.tsx`
- Modify: `src/components/WidgetShowcase.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Write the final regression coverage**

```js
// tests/server/server.test.js
test("days-remaining route still renders even when checkAccess reports service unavailable", async () => {
  const app = createApp({
    checkAccess: async () => ({ access: false, reason: "Service indisponible" }),
    htmlTemplate: `
      <html>
        <body>
          <div id="root"></div>
          <script>window.__WIDGET_RUNTIME__=__WIDGET_RUNTIME__;</script>
        </body>
      </html>
    `,
  });

  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/days-remaining?license=ANY-KEY`);
  const html = await response.text();
  server.close();

  assert.equal(response.status, 200);
  assert.match(html, /"widget":"daysRemaining"/);
  assert.match(html, /"reason":"Service indisponible"/);
  assert.match(html, /"accessGranted":false/);
});
```

- [ ] **Step 2: Install and wire the runtime dependencies**

```json
// package.json
{
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "mysql2": "^3.11.0",
    "node-cache": "^5.1.2"
  }
}

// .env.example
DB_HOST=localhost
DB_USER=
DB_PASSWORD=
DB_NAME=
LMFWC_SECRET=
LMFWC_DEFUSE=
CACHE_TTL_SECONDS=3600
PORT=3000
```

Run: `pnpm add dotenv express mysql2 node-cache`

Expected: dependency installation succeeds and `pnpm-lock.yaml` is updated with `dotenv`, `express`, `mysql2`, and `node-cache`.

- [ ] **Step 3: Run the full verification suite**

Run: `npm run test`

Expected: PASS for:
- view-config tests
- widget runtime tests
- widget access tests
- license service tests
- server route tests

Run: `npm run build`

Expected: PASS with Vite emitting `dist/index.html`.

- [ ] **Step 4: Perform a manual smoke check**

Run: `node server.js`

Expected: server listening on `http://localhost:3000`.

Open:
- `http://localhost:3000/calendar`
- `http://localhost:3000/clock?license=VALID-KEY`
- `http://localhost:3000/days-remaining?license=BAD-KEY`

Verify:
- missing or bad license keeps the widget visible and the palette locked
- clicking the locked palette redirects to `https://atomicskills.academy/widgets-notion/`
- valid license removes branding and opens the palette editor

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example src/App.tsx src/components/widget-registry.tsx src/components/Calendar.tsx src/components/FlipClock.tsx src/components/DaysRemaining.tsx src/components/CenteredPopover.tsx src/components/WidgetThemeEditor.tsx src/components/WidgetShowcase.tsx tests/server/server.test.js
git commit -m "feat: wire LM4WC access gating through widget routes"
```
