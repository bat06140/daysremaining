# Single-Port Dev HMR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `pnpm dev` expose a single public URL with native frontend hot reload while keeping the production Express HTML-injection flow unchanged.

**Architecture:** Vite becomes the public dev entrypoint on port `3000` and proxies `/api/*` to the Express server on `3001`. The frontend reads injected runtime in production, but in dev it fetches runtime/access state from a JSON endpoint instead of relying on server-rendered HTML injection.

**Tech Stack:** pnpm workspaces, Turborepo, Vite, React 18, Express 5, TypeScript, Node test runner

---

## File Structure

- Modify: `package.json`
  Root task orchestration for `pnpm dev`.
- Modify: `apps/widget-client/package.json`
  Client dev script options if needed for fixed port behavior.
- Modify: `apps/widget-client/vite.config.ts`
  Dev port, strict port, proxy, route handling for widget paths.
- Modify: `apps/widget-client/src/lib/widget-runtime.ts`
  Dev runtime fetch path and normalized runtime parsing.
- Modify: `apps/widget-client/src/App.tsx`
  Async bootstrapping so the app can wait for runtime in dev.
- Modify: `apps/widget-client/tests/widget-runtime.test.ts`
  Runtime helper coverage for injected and fetched runtime cases.
- Modify: `apps/widget-server/package.json`
  Replace the current watch chain with a standard watcher on port `3001`.
- Modify: `apps/widget-server/src/app.ts`
  Register a JSON runtime API route without disturbing production HTML serving.
- Create: `apps/widget-server/src/routes/runtime.ts`
  Compute and return runtime payloads for dev requests.
- Modify: `apps/widget-server/src/index.ts`
  Dev defaults for the internal server port while preserving production defaults.
- Modify: `apps/widget-server/tests/server.test.ts`
  Add coverage for the runtime API route.
- Modify: `README.md`
  Document the new `pnpm dev` contract and ports.

## Task 1: Add failing server coverage for dev runtime API

**Files:**
- Modify: `apps/widget-server/tests/server.test.ts`
- Modify: `apps/widget-server/src/app.ts`
- Create: `apps/widget-server/src/routes/runtime.ts`

- [ ] **Step 1: Write the failing test**

```ts
test("runtime api returns normalized widget access payload", async () => {
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
      `${baseUrl}/api/widget-runtime?widget=calendar&license=BAD-KEY`
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(receivedLicense, "BAD-KEY");
    assert.deepEqual(payload, {
      widget: "calendar",
      accessGranted: false,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
      reason: "Licence introuvable",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/widget-server run test`
Expected: FAIL because `/api/widget-runtime` is not implemented yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/widget-server/src/routes/runtime.ts
router.get("/api/widget-runtime", async (req, res) => {
  const widget = normalizeWidget(normalizeQueryValue(req.query.widget));
  const license = normalizeQueryValue(req.query.license);
  const access = await checkAccess(license);

  res.json({
    widget,
    accessGranted: access.access === true,
    purchaseUrl,
    ...(typeof access.reason === "string" ? { reason: access.reason } : {}),
  });
});
```

```ts
// apps/widget-server/src/app.ts
app.use(
  createRuntimeRouter({
    checkAccess,
    purchaseUrl,
    debugLicenses,
    logger,
  })
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/widget-server run test`
Expected: PASS with the new runtime API test included.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-server/src/app.ts apps/widget-server/src/routes/runtime.ts apps/widget-server/tests/server.test.ts
git commit -m "feat: add widget runtime api for dev"
```

## Task 2: Add failing client runtime tests for dev fallback loading

**Files:**
- Modify: `apps/widget-client/tests/widget-runtime.test.ts`
- Modify: `apps/widget-client/src/lib/widget-runtime.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test("readWidgetRuntime keeps injected runtime as the first source of truth", () => {
  assert.deepEqual(
    readWidgetRuntime({
      __WIDGET_RUNTIME__: {
        widget: "calendar",
        accessGranted: true,
        purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      },
    }),
    {
      widget: "calendar",
      accessGranted: true,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    }
  );
});

test("fetchWidgetRuntime normalizes api payload and keeps locked fallback", async () => {
  const runtime = await fetchWidgetRuntime({
    pathname: "/calendar",
    search: "?license=BAD-KEY",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          widget: "calendar",
          accessGranted: false,
          purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
          reason: "Licence introuvable",
        })
      ),
  });

  assert.deepEqual(runtime, {
    widget: "calendar",
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    reason: "Licence introuvable",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL because `fetchWidgetRuntime` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export async function fetchWidgetRuntime({
  pathname,
  search,
  fetchImpl = fetch,
}: {
  pathname: string;
  search: string;
  fetchImpl?: typeof fetch;
}): Promise<WidgetRuntime> {
  const params = new URLSearchParams(search);
  const widget = getWidgetFromPathname(pathname);

  if (!widget) {
    return {
      widget: undefined,
      accessGranted: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    };
  }

  params.set("widget", widget);

  const response = await fetchImpl(`/api/widget-runtime?${params.toString()}`);
  if (!response.ok) {
    return {
      widget,
      accessGranted: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    };
  }

  return normalizeWidgetRuntime(await response.json());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS with the new runtime helper coverage included.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/lib/widget-runtime.ts apps/widget-client/tests/widget-runtime.test.ts
git commit -m "feat: add dev runtime fetch helper"
```

## Task 3: Bootstrap the client with async runtime loading in dev

**Files:**
- Modify: `apps/widget-client/src/App.tsx`
- Modify: `apps/widget-client/src/lib/widget-runtime.ts`

- [ ] **Step 1: Write the failing test**

```ts
test("getInitialAppState keeps pathname routing when runtime widget is absent", () => {
  const state = getInitialAppState({
    location: { search: "", pathname: "/days-remaining" },
    __WIDGET_RUNTIME__: {
      accessGranted: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    },
  } as unknown as Window);

  assert.deepEqual(state.view, {
    kind: "widget",
    widget: "daysRemaining",
    layout: "square",
  });
});
```

- [ ] **Step 2: Run test to verify it fails if you introduce async bootstrap signatures first**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL while `App.tsx` and runtime helpers are mid-change.

- [ ] **Step 3: Write minimal implementation**

```tsx
// apps/widget-client/src/App.tsx
const [state, setState] = useState<AppState | null>(null);

useEffect(() => {
  let cancelled = false;

  const load = async () => {
    const nextState = await getInitialAppStateAsync(
      window,
      import.meta.env.VITE_COMPONENT
    );

    if (!cancelled) {
      setState(nextState);
    }
  };

  void load();
  window.addEventListener("popstate", load);
  return () => {
    cancelled = true;
    window.removeEventListener("popstate", load);
  };
}, []);

if (state == null) {
  return null;
}
```

```ts
// apps/widget-client/src/lib/widget-runtime.ts
export async function getInitialAppStateAsync(
  currentWindow: Window,
  envWidget?: string
): Promise<AppState> {
  const injected = readWidgetRuntime(currentWindow);
  const runtime =
    injected.widget || injected.accessGranted || injected.reason
      ? injected
      : await fetchWidgetRuntime(currentWindow.location);

  return {
    view: resolveAppView(
      currentWindow.location.search,
      getWidgetSelection(runtime, envWidget),
      currentWindow.location.pathname
    ),
    accessGranted: runtime.accessGranted,
  };
}
```

- [ ] **Step 4: Run tests to verify it passes**

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS with existing routing/runtime tests still green.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/App.tsx apps/widget-client/src/lib/widget-runtime.ts apps/widget-client/tests/widget-runtime.test.ts
git commit -m "feat: load widget runtime asynchronously in dev"
```

## Task 4: Configure Vite and root dev orchestration for a single public port

**Files:**
- Modify: `package.json`
- Modify: `apps/widget-client/package.json`
- Modify: `apps/widget-client/vite.config.ts`
- Modify: `apps/widget-server/package.json`

- [ ] **Step 1: Write the failing verification target**

```text
Manual target:
- pnpm dev starts both workspaces
- browser uses http://localhost:3000
- Vite owns the public port
- /api/* reaches Express on 3001
```

- [ ] **Step 2: Run dev once to capture the current failure**

Run: `pnpm dev`
Expected: current setup does not provide a single public Vite entrypoint on `3000`.

- [ ] **Step 3: Write minimal implementation**

```json
// package.json
{
  "scripts": {
    "dev": "turbo run dev"
  }
}
```

```json
// apps/widget-client/package.json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 3000 --strictPort"
  }
}
```

```ts
// apps/widget-client/vite.config.ts
server: {
  port: 3000,
  strictPort: true,
  proxy: {
    "/api": "http://127.0.0.1:3001",
  },
},
```

```json
// apps/widget-server/package.json
{
  "scripts": {
    "dev": "tsx watch --env-file=.env src/index.ts"
  }
}
```

- [ ] **Step 4: Run lint/build to verify the new config compiles**

Run: `pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json apps/widget-client/package.json apps/widget-client/vite.config.ts apps/widget-server/package.json
git commit -m "chore: wire single-port dev orchestration"
```

## Task 5: Make the server use an internal dev port while preserving production defaults

**Files:**
- Modify: `apps/widget-server/src/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
test("resolveServerPort uses the internal dev port when explicitly requested", () => {
  assert.equal(resolveServerPort({ PORT: undefined, WIDGET_DEV_BACKEND_PORT: "3001" }), 3001);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/widget-server run test`
Expected: FAIL because `resolveServerPort` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function resolveServerPort(env = process.env) {
  return Number(env.PORT ?? env.WIDGET_DEV_BACKEND_PORT ?? 3000);
}

export async function startServer(...) {
  port = resolveServerPort(),
  ...
}
```

```json
// apps/widget-server/package.json
{
  "scripts": {
    "dev": "WIDGET_DEV_BACKEND_PORT=3001 tsx watch --env-file=.env src/index.ts"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/widget-server run test`
Expected: PASS with the port helper covered.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-server/package.json apps/widget-server/src/index.ts apps/widget-server/tests/index.test.ts
git commit -m "feat: use internal backend port in dev"
```

## Task 6: Document and manually verify the final workflow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update docs**

```md
- `pnpm dev` starts Vite on `http://localhost:3000`
- Express runs internally on `http://localhost:3001`
- frontend requests under `/api/*` are proxied automatically in dev
```

- [ ] **Step 2: Run the full verification suite**

Run: `pnpm lint`
Expected: PASS

Run: `pnpm build`
Expected: PASS

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS

Run: `pnpm --filter @repo/widget-server run test`
Expected: PASS

- [ ] **Step 3: Run the manual smoke test**

Run: `pnpm dev`

Open:
- `http://localhost:3000/calendar`
- `http://localhost:3000/clock`
- `http://localhost:3000/days-remaining`

Verify:
- editing `apps/widget-client/src/components/DaysRemaining.tsx` updates the browser immediately
- `/api/widget-runtime` returns access state through the Vite proxy
- widget routes continue to resolve from the browser pathname

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: describe single-port dev workflow"
```
