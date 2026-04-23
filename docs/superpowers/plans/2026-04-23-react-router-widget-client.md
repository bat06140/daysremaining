# React Router Widget Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace server-rendered widget pages with a React Router frontend that owns `/calendar`, `/clock`, and `/days-remaining`, while the Express app becomes API plus production asset server only.

**Architecture:** The frontend moves to route-owned widget pages and fetches access state from a JSON API instead of reading injected runtime from HTML. Development keeps Vite as the only visible frontend entrypoint with proxying to the backend, and production keeps a single Express entrypoint that serves built assets, `/api/*`, and an SPA fallback.

**Tech Stack:** pnpm workspaces, Turborepo, Vite, React 18, React Router DOM, Express 5, TypeScript, Node test runner

---

## File Structure

- Modify: `apps/widget-client/package.json`
  Add React Router dependencies.
- Modify: `apps/widget-client/src/main.tsx`
  Mount the router-based app entrypoint.
- Modify: `apps/widget-client/src/App.tsx`
  Replace the runtime-driven shell with a route shell.
- Create: `apps/widget-client/src/routes/widget-page.tsx`
  Shared route component that fetches access state and renders a loading screen or widget.
- Create: `apps/widget-client/src/lib/widget-route.ts`
  Pathname-to-widget helpers and route metadata.
- Create: `apps/widget-client/src/lib/widget-access-api.ts`
  Client fetch helper for `/api/widget-access`.
- Modify: `apps/widget-client/tests/widget-access.test.ts`
  Keep theme editor access rules and add API helper coverage.
- Create: `apps/widget-client/tests/widget-route.test.ts`
  Add route mapping and route-page rendering tests.
- Modify: `apps/widget-client/vite.config.ts`
  Keep dev proxy on `/api/*` and ensure standard SPA development behavior.

- Modify: `apps/widget-server/src/app.ts`
  Register API route and production static/SPA fallback instead of widget HTML routes.
- Delete: `apps/widget-server/src/routes/widgets.ts`
  Remove server-side widget HTML rendering.
- Delete: `apps/widget-server/src/routes/runtime.ts`
  Remove the legacy runtime endpoint.
- Create: `apps/widget-server/src/routes/widget-access.ts`
  Expose JSON access results for widget pages.
- Modify: `apps/widget-server/tests/server.test.ts`
  Replace widget HTML injection tests with API and SPA fallback tests.
- Modify: `apps/widget-server/src/index.ts`
  Preserve build asset resolution but use it only for static serving and SPA fallback.

- Modify: `apps/widget-client/src/lib/widget-runtime.ts`
  Remove legacy runtime responsibilities after client routing is in place, or delete if fully unused.
- Modify: `apps/widget-client/tests/widget-runtime.test.ts`
  Remove runtime-injection behavior and replace with route/API-centered tests if the file remains.
- Modify: `README.md`
  Document the new frontend/backend responsibilities and dev/prod behavior.

## Task 1: Add client-side route and access helper tests

**Files:**
- Modify: `apps/widget-client/package.json`
- Create: `apps/widget-client/src/lib/widget-route.ts`
- Create: `apps/widget-client/src/lib/widget-access-api.ts`
- Create: `apps/widget-client/tests/widget-route.test.ts`
- Modify: `apps/widget-client/tests/widget-access.test.ts`

- [ ] **Step 1: Write the failing tests for route metadata and API fetch normalization**

```ts
// apps/widget-client/tests/widget-route.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  getWidgetFromPathname,
  getWidgetPath,
  isWidgetPathname,
} from "../src/lib/widget-route.js";

test("getWidgetFromPathname maps widget URLs to widget keys", () => {
  assert.equal(getWidgetFromPathname("/calendar"), "calendar");
  assert.equal(getWidgetFromPathname("/clock"), "clock");
  assert.equal(getWidgetFromPathname("/days-remaining"), "daysRemaining");
});

test("getWidgetFromPathname returns undefined for unknown routes", () => {
  assert.equal(getWidgetFromPathname("/"), undefined);
  assert.equal(getWidgetFromPathname("/unknown"), undefined);
});

test("getWidgetPath returns the canonical URL for each widget key", () => {
  assert.equal(getWidgetPath("calendar"), "/calendar");
  assert.equal(getWidgetPath("clock"), "/clock");
  assert.equal(getWidgetPath("daysRemaining"), "/days-remaining");
});

test("isWidgetPathname only accepts widget page routes", () => {
  assert.equal(isWidgetPathname("/calendar"), true);
  assert.equal(isWidgetPathname("/days-remaining"), true);
  assert.equal(isWidgetPathname("/api/widget-access"), false);
});
```

```ts
// apps/widget-client/tests/widget-access.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  fetchWidgetAccess,
  getThemeEditorMode,
  shouldShowWidgetBranding,
} from "../src/lib/widget-access-api.js";

test("fetchWidgetAccess normalizes a denied response", async () => {
  const access = await fetchWidgetAccess(
    {
      widget: "calendar",
      search: "?license=BAD-KEY",
    },
    async (input) => {
      assert.equal(input, "/api/widget-access?license=BAD-KEY&widget=calendar");
      return new Response(
        JSON.stringify({
          accessGranted: false,
          purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
          reason: "Licence introuvable",
        })
      );
    }
  );

  assert.deepEqual(access, {
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    reason: "Licence introuvable",
  });
});

test("fetchWidgetAccess falls back to locked mode when the request fails", async () => {
  const access = await fetchWidgetAccess(
    {
      widget: "clock",
      search: "",
    },
    async () => {
      throw new Error("network down");
    }
  );

  assert.deepEqual(access, {
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
  });
});
```

- [ ] **Step 2: Run the targeted client tests to verify they fail**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL with module-not-found or missing export errors for `widget-route` and `fetchWidgetAccess`.

- [ ] **Step 3: Add React Router and implement the minimal route/access helpers**

```json
// apps/widget-client/package.json
{
  "dependencies": {
    "react-router-dom": "^7.0.0"
  }
}
```

```ts
// apps/widget-client/src/lib/widget-route.ts
import type { WidgetKey } from "@repo/shared";

export function getWidgetFromPathname(pathname: string): WidgetKey | undefined {
  if (pathname === "/calendar") return "calendar";
  if (pathname === "/clock") return "clock";
  if (pathname === "/days-remaining") return "daysRemaining";
  return undefined;
}

export function getWidgetPath(widget: WidgetKey) {
  if (widget === "calendar") return "/calendar";
  if (widget === "clock") return "/clock";
  return "/days-remaining";
}

export function isWidgetPathname(pathname: string) {
  return getWidgetFromPathname(pathname) !== undefined;
}
```

```ts
// apps/widget-client/src/lib/widget-access-api.ts
import { DEFAULT_WIDGET_PURCHASE_URL } from "./widget-access.js";
import type { WidgetKey } from "@repo/shared";

export type WidgetAccessState = {
  accessGranted: boolean;
  purchaseUrl: string;
  reason?: string;
};

export async function fetchWidgetAccess(
  {
    widget,
    search,
  }: {
    widget: WidgetKey;
    search: string;
  },
  fetchImpl: typeof fetch = fetch
): Promise<WidgetAccessState> {
  const params = new URLSearchParams(search);
  params.set("widget", widget);

  try {
    const response = await fetchImpl(`/api/widget-access?${params.toString()}`);
    if (!response.ok) {
      return {
        accessGranted: false,
        purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      };
    }

    const payload = (await response.json()) as {
      accessGranted?: unknown;
      purchaseUrl?: unknown;
      reason?: unknown;
    };

    return {
      accessGranted: payload.accessGranted === true,
      purchaseUrl:
        typeof payload.purchaseUrl === "string"
          ? payload.purchaseUrl
          : DEFAULT_WIDGET_PURCHASE_URL,
      ...(typeof payload.reason === "string" ? { reason: payload.reason } : {}),
    };
  } catch {
    return {
      accessGranted: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    };
  }
}
```

- [ ] **Step 4: Run the targeted client tests to verify they pass**

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS with the new route and API helper tests included.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/package.json apps/widget-client/src/lib/widget-route.ts apps/widget-client/src/lib/widget-access-api.ts apps/widget-client/tests/widget-route.test.ts apps/widget-client/tests/widget-access.test.ts pnpm-lock.yaml
git commit -m "feat: add widget route and access helpers"
```

## Task 2: Migrate the frontend app shell to React Router widget pages

**Files:**
- Modify: `apps/widget-client/src/main.tsx`
- Modify: `apps/widget-client/src/App.tsx`
- Create: `apps/widget-client/src/routes/widget-page.tsx`
- Modify: `apps/widget-client/tests/widget-route.test.ts`

- [ ] **Step 1: Add a failing rendering test for route-owned widget pages**

```ts
// apps/widget-client/tests/widget-route.test.ts
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App.js";

test("calendar route renders a loading screen before access resolves", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/calendar?license=VALID-KEY"] },
      React.createElement(App)
    )
  );

  assert.match(markup, /Loading widget/);
});
```

- [ ] **Step 2: Run the targeted client tests to verify they fail**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL because `App` still reads the legacy runtime path and does not render route-owned loading state.

- [ ] **Step 3: Implement the router shell and widget page route**

```tsx
// apps/widget-client/src/routes/widget-page.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { WidgetThemeProvider } from "../context/WidgetThemeContext.js";
import { renderWidget } from "../components/widget-registry.js";
import { fetchWidgetAccess, type WidgetAccessState } from "../lib/widget-access-api.js";
import { getWidgetFromPathname } from "../lib/widget-route.js";

export function WidgetPage() {
  const location = useLocation();
  const widget = getWidgetFromPathname(location.pathname);
  const [access, setAccess] = useState<WidgetAccessState | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!widget) {
      setAccess({
        accessGranted: false,
        purchaseUrl: "https://atomicskills.academy/widgets-notion/",
      });
      return;
    }

    void fetchWidgetAccess({
      widget,
      search: location.search,
    }).then((nextAccess) => {
      if (!cancelled) {
        setAccess(nextAccess);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, widget]);

  if (!widget || access === null) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading widget...</div>;
  }

  return (
    <WidgetThemeProvider>
      <div className="flex h-screen w-screen items-center justify-center p-4">
        {renderWidget({
          widget,
          layout: "square",
          accessGranted: access.accessGranted,
          purchaseUrl: access.purchaseUrl,
        })}
      </div>
    </WidgetThemeProvider>
  );
}
```

```tsx
// apps/widget-client/src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { WidgetPage } from "./routes/widget-page.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/calendar" replace />} />
      <Route path="/calendar" element={<WidgetPage />} />
      <Route path="/clock" element={<WidgetPage />} />
      <Route path="/days-remaining" element={<WidgetPage />} />
    </Routes>
  );
}

export default App;
```

```tsx
// apps/widget-client/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 4: Run the targeted client tests to verify they pass**

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS with route rendering tests and no regression in existing widget render tests.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/main.tsx apps/widget-client/src/App.tsx apps/widget-client/src/routes/widget-page.tsx apps/widget-client/tests/widget-route.test.ts
git commit -m "feat: move widget pages to react router"
```

## Task 3: Replace legacy runtime/widget routes with a JSON access API

**Files:**
- Create: `apps/widget-server/src/routes/widget-access.ts`
- Modify: `apps/widget-server/src/app.ts`
- Modify: `apps/widget-server/tests/server.test.ts`
- Delete: `apps/widget-server/src/routes/widgets.ts`
- Delete: `apps/widget-server/src/routes/runtime.ts`

- [ ] **Step 1: Rewrite the failing backend tests around `/api/widget-access`**

```ts
// apps/widget-server/tests/server.test.ts
test("widget access api returns denied access without leaking the license", async () => {
  let receivedLicense: string | undefined;
  const app = createApp({
    checkAccess: async (license: string | undefined) => {
      receivedLicense = license;
      return {
        access: false,
        reason: "Licence introuvable",
      };
    },
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/widget-access?widget=calendar&license=BAD-KEY`
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(receivedLicense, "BAD-KEY");
    assert.deepEqual(payload, {
      accessGranted: false,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
      reason: "Licence introuvable",
    });
  });
});

test("server no longer serves widget HTML routes directly", async () => {
  const app = createApp({
    checkAccess: async () => ({ access: true }),
    htmlTemplate,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/calendar`);

    assert.equal(response.status, 404);
  });
});
```

- [ ] **Step 2: Run the server tests to verify they fail**

Run: `pnpm --filter @repo/widget-server run test`
Expected: FAIL because `/api/widget-access` does not exist yet and `/calendar` still returns injected HTML.

- [ ] **Step 3: Implement the new JSON API and remove legacy routes**

```ts
// apps/widget-server/src/routes/widget-access.ts
import { createRequire } from "node:module";
import { DEFAULT_WIDGET_PURCHASE_URL } from "@repo/shared";
import type { LicenseAccessResult } from "../services/license-service.js";

const require = createRequire(import.meta.url);
const { Router } = require("express") as {
  Router: () => any;
};

function normalizeQueryValue(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
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
```

```ts
// apps/widget-server/src/app.ts
import { createWidgetAccessRouter } from "./routes/widget-access.js";

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
    createWidgetAccessRouter({
      checkAccess,
      purchaseUrl,
    })
  );

  return app;
}
```

- [ ] **Step 4: Run the server tests to verify they pass**

Run: `pnpm --filter @repo/widget-server run test`
Expected: PASS with the new API tests and without server-rendered widget HTML assertions.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-server/src/routes/widget-access.ts apps/widget-server/src/app.ts apps/widget-server/tests/server.test.ts
git rm apps/widget-server/src/routes/widgets.ts apps/widget-server/src/routes/runtime.ts
git commit -m "feat: replace widget runtime routes with access api"
```

## Task 4: Add production SPA fallback and server static tests

**Files:**
- Modify: `apps/widget-server/src/app.ts`
- Modify: `apps/widget-server/tests/server.test.ts`
- Modify: `apps/widget-server/src/index.ts`

- [ ] **Step 1: Add failing tests for SPA fallback behavior**

```ts
// apps/widget-server/tests/server.test.ts
test("staticDir serves the frontend index for widget routes in production mode", async () => {
  const app = createApp({
    checkAccess: async () => ({ access: true }),
    htmlTemplate,
    staticDir: new URL("../../widget-client/dist", import.meta.url).pathname,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/calendar?license=BAD-KEY`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<div id="root"><\/div>/);
    assert.doesNotMatch(html, /"widget":"calendar"/);
  });
});
```

- [ ] **Step 2: Run the server tests to verify they fail**

Run: `pnpm --filter @repo/widget-server run test`
Expected: FAIL because widget routes currently return 404 once HTML injection has been removed.

- [ ] **Step 3: Implement the production SPA fallback**

```ts
// apps/widget-server/src/app.ts
import { readFileSync } from "node:fs";
import path from "node:path";

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

  throw new Error("template path is required");
}

export function createApp(options: CreateAppOptions = {}) {
  const {
    checkAccess = checkAccessDefault,
    htmlTemplate,
    templatePath,
    staticDir,
    purchaseUrl,
  } = options;

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

  app.get(["/", "/calendar", "/clock", "/days-remaining"], (_req: any, res: any) => {
    res.type("html").send(spaIndex);
  });

  return app;
}
```

- [ ] **Step 4: Run the server tests to verify they pass**

Run: `pnpm --filter @repo/widget-server run test`
Expected: PASS with API behavior and SPA fallback behavior both covered.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-server/src/app.ts apps/widget-server/tests/server.test.ts apps/widget-server/src/index.ts
git commit -m "feat: serve frontend app shell from express"
```

## Task 5: Remove legacy runtime code paths and update docs

**Files:**
- Modify: `apps/widget-client/src/lib/widget-runtime.ts`
- Modify: `apps/widget-client/tests/widget-runtime.test.ts`
- Modify: `apps/widget-client/vite.config.ts`
- Modify: `README.md`

- [ ] **Step 1: Add failing cleanup tests that assert the client no longer depends on injected runtime**

```ts
// apps/widget-client/tests/widget-runtime.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { getWidgetFromPathname } from "../src/lib/widget-route.js";

test("widget selection is route-driven instead of runtime-driven", () => {
  assert.equal(getWidgetFromPathname("/calendar"), "calendar");
  assert.equal(getWidgetFromPathname("/clock"), "clock");
});
```

- [ ] **Step 2: Run the full client test suite to verify the cleanup work still has failing expectations**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL because old runtime tests still assert `window.__WIDGET_RUNTIME__`-based behavior.

- [ ] **Step 3: Remove the injected-runtime path and update documentation**

```ts
// apps/widget-client/src/lib/widget-runtime.ts
// Either delete this file entirely, or reduce it to a narrow compatibility shim used nowhere:
export {};
```

```ts
// apps/widget-client/vite.config.ts
server: {
  port: 3000,
  strictPort: true,
  proxy: {
    "/api": "http://127.0.0.1:3001",
  },
}
```

```md
<!-- README.md -->
Development workflow:

- `pnpm dev` starts the React Router frontend on `http://localhost:3000`
- the backend API runs internally on `http://localhost:3001`
- frontend widget routes are handled by React Router
- `/api/*` is proxied to the backend in development
- production serves the built frontend from Express with the same widget URLs
```

- [ ] **Step 4: Run full verification**

Run:

```bash
pnpm --filter @repo/widget-client run test
pnpm --filter @repo/widget-server run test
pnpm lint
pnpm build
```

Expected:

- all client tests PASS
- all server tests PASS
- lint PASS
- build PASS

Manual verification:

```bash
pnpm dev
```

Then confirm:

- `http://localhost:3000/calendar` serves the frontend app shell
- editing a client component triggers native Vite HMR
- `http://localhost:3000/api/widget-access?widget=calendar&license=BAD-KEY` returns JSON through the dev proxy

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/lib/widget-runtime.ts apps/widget-client/tests/widget-runtime.test.ts apps/widget-client/vite.config.ts README.md
git commit -m "refactor: remove injected widget runtime flow"
```

## Self-Review

- Spec coverage:
  - frontend-owned widget routes: Task 2
  - API-only backend: Task 3
  - production SPA fallback: Task 4
  - runtime injection removal: Task 5
  - development HMR simplification: Tasks 2, 4, 5
- Placeholder scan: no `TODO`, `TBD`, or deferred implementation markers remain.
- Type consistency:
  - widget route helpers use `WidgetKey`
  - API helper returns `WidgetAccessState`
  - backend API returns `accessGranted`, `purchaseUrl`, and optional `reason`
