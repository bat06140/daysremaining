# pnpm + Turborepo Monorepo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the repository to a `pnpm` + `turbo` monorepo with separate client, server, and shared packages while preserving current widget and LM4WC behavior.

**Architecture:** The existing Vite React app moves into `apps/widget-client`, the Express LM4WC backend moves into `apps/widget-server` and is converted to TypeScript, and shared runtime/types/constants move into `packages/shared`. Root-level workspace config orchestrates package builds and tests through `turbo`, while package-local configs keep client and server concerns isolated.

**Tech Stack:** pnpm workspaces, Turborepo, TypeScript, Vite, React 18, Express, node:test, MySQL2, node-cache

---

## File Structure

### Root workspace files

- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`

### Client workspace files

- Create: `apps/widget-client/package.json`
- Create: `apps/widget-client/tsconfig.json`
- Create: `apps/widget-client/tsconfig.node.json`
- Create: `apps/widget-client/vite.config.ts`
- Create: `apps/widget-client/index.html`
- Create: `apps/widget-client/custom.d.ts`
- Create: `apps/widget-client/src/**`
- Create: `apps/widget-client/tests/**`

### Server workspace files

- Create: `apps/widget-server/package.json`
- Create: `apps/widget-server/tsconfig.json`
- Create: `apps/widget-server/.env.example`
- Create: `apps/widget-server/src/index.ts`
- Create: `apps/widget-server/src/app.ts`
- Create: `apps/widget-server/src/routes/widgets.ts`
- Create: `apps/widget-server/src/services/license-service.ts`
- Create: `apps/widget-server/src/data/wordpress-db.ts`
- Create: `apps/widget-server/src/crypto/lm4wc-defuse.ts`
- Create: `apps/widget-server/src/html/render-widget-page.ts`
- Create: `apps/widget-server/tests/**`

### Shared workspace files

- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/widget-types.ts`
- Create: `packages/shared/src/widget-runtime.ts`
- Create: `packages/shared/src/widget-access.ts`

### Files to remove or retire from root

- Delete after migration: `crypto.js`
- Delete after migration: `db.js`
- Delete after migration: `licenseService.js`
- Delete after migration: `server.js`
- Delete after migration: root `index.html`
- Delete after migration: root `custom.d.ts`
- Delete after migration: root `tsconfig.json`
- Delete after migration: root `tsconfig.node.json`
- Delete after migration: root `vite.config.ts`
- Delete after migration: root `src/**`
- Delete after migration: root `tests/**`

---

### Task 1: Create The Workspace Skeleton

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing workspace test**

```bash
test -f pnpm-workspace.yaml && test -f turbo.json
```

- [ ] **Step 2: Run it to verify it fails**

Run: `test -f pnpm-workspace.yaml && test -f turbo.json`
Expected: FAIL because neither file exists yet.

- [ ] **Step 3: Write the minimal workspace config**

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

```json
// package.json
{
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^2.5.5"
  }
}
```

```gitignore
# .gitignore
node_modules
.turbo
dist
```

- [ ] **Step 4: Run the workspace test to verify it passes**

Run: `test -f pnpm-workspace.yaml && test -f turbo.json`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml turbo.json package.json .gitignore
git commit -m "chore: add pnpm turbo workspace skeleton"
```

### Task 2: Create The Shared Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/widget-types.ts`
- Create: `packages/shared/src/widget-runtime.ts`
- Create: `packages/shared/src/widget-access.ts`
- Create: `apps/widget-client/tests/shared-imports.test.ts`

- [ ] **Step 1: Write the failing shared-package test**

```ts
// apps/widget-client/tests/shared-imports.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  type WidgetRuntime,
} from "@repo/shared";

test("shared package exposes widget runtime primitives", () => {
  const runtime: WidgetRuntime = {
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
  };

  assert.equal(runtime.purchaseUrl, DEFAULT_WIDGET_PURCHASE_URL);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test apps/widget-client/tests/shared-imports.test.ts`
Expected: FAIL because `@repo/shared` does not exist yet.

- [ ] **Step 3: Write the minimal shared package**

```json
// packages/shared/package.json
{
  "name": "@repo/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

```ts
// packages/shared/src/widget-types.ts
export type WidgetKey = "calendar" | "daysRemaining" | "clock";
```

```ts
// packages/shared/src/widget-access.ts
export const DEFAULT_WIDGET_PURCHASE_URL =
  "https://atomicskills.academy/widgets-notion/";
```

```ts
// packages/shared/src/widget-runtime.ts
import type { WidgetKey } from "./widget-types.js";

export type WidgetRuntime = {
  widget?: WidgetKey;
  accessGranted: boolean;
  purchaseUrl: string;
  reason?: string;
};
```

```ts
// packages/shared/src/index.ts
export * from "./widget-types.js";
export * from "./widget-access.js";
export * from "./widget-runtime.js";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test apps/widget-client/tests/shared-imports.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared apps/widget-client/tests/shared-imports.test.ts
git commit -m "feat: add shared monorepo package"
```

### Task 3: Move The React App Into `apps/widget-client`

**Files:**
- Create: `apps/widget-client/package.json`
- Create: `apps/widget-client/tsconfig.json`
- Create: `apps/widget-client/tsconfig.node.json`
- Create: `apps/widget-client/vite.config.ts`
- Create: `apps/widget-client/index.html`
- Create: `apps/widget-client/custom.d.ts`
- Create: `apps/widget-client/src/**`
- Create: `apps/widget-client/tests/**`
- Modify: moved client imports to reference `@repo/shared`

- [ ] **Step 1: Write the failing client verification command**

```bash
pnpm --dir apps/widget-client test
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir apps/widget-client test`
Expected: FAIL because the client workspace has not been created yet.

- [ ] **Step 3: Move the client code with minimal changes**

```text
apps/widget-client/
  package.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  index.html
  custom.d.ts
  src/
  tests/
```

```json
// apps/widget-client/package.json
{
  "name": "@repo/widget-client",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc && vite build",
    "test": "tsc -p tests/tsconfig.json && node --test .test-dist/tests/**/*.test.js",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "dev": "vite"
  },
  "dependencies": {
    "@repo/shared": "workspace:*"
  }
}
```

```ts
// apps/widget-client/src/lib/widget-runtime.ts
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  type WidgetRuntime,
  type WidgetKey,
} from "@repo/shared";
```

- [ ] **Step 4: Run the client test suite to verify it passes**

Run: `pnpm --dir apps/widget-client test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client
git commit -m "refactor: move widget client into workspace package"
```

### Task 4: Move And Convert The Server Into `apps/widget-server`

**Files:**
- Create: `apps/widget-server/package.json`
- Create: `apps/widget-server/tsconfig.json`
- Create: `apps/widget-server/.env.example`
- Create: `apps/widget-server/src/index.ts`
- Create: `apps/widget-server/src/app.ts`
- Create: `apps/widget-server/src/routes/widgets.ts`
- Create: `apps/widget-server/src/services/license-service.ts`
- Create: `apps/widget-server/src/data/wordpress-db.ts`
- Create: `apps/widget-server/src/crypto/lm4wc-defuse.ts`
- Create: `apps/widget-server/src/html/render-widget-page.ts`
- Create: `apps/widget-server/tests/**`

- [ ] **Step 1: Write the failing server verification command**

```bash
pnpm --dir apps/widget-server test
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --dir apps/widget-server test`
Expected: FAIL because the server workspace does not exist yet.

- [ ] **Step 3: Move and type the server modules**

```text
apps/widget-server/src/
  index.ts
  app.ts
  routes/widgets.ts
  services/license-service.ts
  data/wordpress-db.ts
  crypto/lm4wc-defuse.ts
  html/render-widget-page.ts
```

```json
// apps/widget-server/package.json
{
  "name": "@repo/widget-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "node --test tests/**/*.test.js",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@repo/shared": "workspace:*"
  }
}
```

```ts
// apps/widget-server/src/routes/widgets.ts
import type { WidgetKey } from "@repo/shared";
```

```ts
// apps/widget-server/src/html/render-widget-page.ts
import type { WidgetRuntime } from "@repo/shared";
```

- [ ] **Step 4: Run the server test suite to verify it passes**

Run: `pnpm --dir apps/widget-server test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/widget-server
git commit -m "refactor: move widget server into workspace package"
```

### Task 5: Wire Root Builds And Package Dependencies

**Files:**
- Modify: root `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: package-level `package.json` files as needed

- [ ] **Step 1: Write the failing root build verification**

```bash
pnpm build
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm build`
Expected: FAIL until the workspace package scripts and dependency graph are fully wired.

- [ ] **Step 3: Finish the root/package script wiring**

```json
// package.json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "dev": "turbo run dev"
  }
}
```

```json
// apps/widget-client/package.json
{
  "dependencies": {
    "@repo/shared": "workspace:*"
  }
}
```

```json
// apps/widget-server/package.json
{
  "dependencies": {
    "@repo/shared": "workspace:*"
  }
}
```

- [ ] **Step 4: Run the root build and test commands to verify they pass**

Run: `pnpm build && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml apps/widget-client/package.json apps/widget-server/package.json
git commit -m "chore: wire monorepo scripts and package dependencies"
```

### Task 6: Remove The Root-Level Hybrid Layout

**Files:**
- Delete: root `crypto.js`
- Delete: root `db.js`
- Delete: root `licenseService.js`
- Delete: root `server.js`
- Delete: root `index.html`
- Delete: root `custom.d.ts`
- Delete: root `tsconfig.json`
- Delete: root `tsconfig.node.json`
- Delete: root `vite.config.ts`
- Delete: root `src/**`
- Delete: root `tests/**`

- [ ] **Step 1: Write the failing cleanup verification**

```bash
test ! -e server.js && test ! -d src && test ! -d tests
```

- [ ] **Step 2: Run it to verify it fails**

Run: `test ! -e server.js && test ! -d src && test ! -d tests`
Expected: FAIL because the root-level hybrid layout still exists.

- [ ] **Step 3: Delete the retired root-level implementation**

```text
Remove only the duplicated root-level client/server files after the workspace packages pass.
Do not remove root-level workspace config or repository docs.
```

- [ ] **Step 4: Run verification to confirm the workspace-only layout**

Run: `test ! -e server.js && test ! -d src && test ! -d tests && pnpm test && pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove root-level hybrid app layout"
```

## Self-Review

Spec coverage:

- workspace adoption -> Task 1
- shared package boundary -> Task 2
- client move -> Task 3
- server move and TypeScript conversion -> Task 4
- root orchestration -> Task 5
- removal of hybrid layout -> Task 6

Placeholder scan:

- no `TODO`, `TBD`, or deferred implementation markers remain
- each task has explicit files, commands, and success criteria

Type consistency:

- package names are consistently `@repo/widget-client`, `@repo/widget-server`, and `@repo/shared`
- shared primitives are consistently `WidgetKey`, `WidgetRuntime`, and `DEFAULT_WIDGET_PURCHASE_URL`
