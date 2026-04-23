# Widget Theme Editor Bottom-Right Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the centered `WidgetThemeEditor` modal with an animated bottom-right in-widget popover that saves theme changes instantly and closes on outside click capture.

**Architecture:** Keep the implementation localized to `WidgetThemeEditor.tsx` and the existing theme context. Replace draft/apply semantics with immediate `saveTheme` updates, render a widget-scoped overlay to intercept outside clicks, and animate both the open/close transition and the step-1-to-step-2 panel resize from a bottom-right anchor.

**Tech Stack:** React 18, TypeScript, Tailwind utility classes, existing widget theme context, Node test runner, React server rendering tests

---

## File Structure

- Modify: `apps/widget-client/src/components/WidgetThemeEditor.tsx`
  Replace the centered modal with the anchored popover, remove explicit save/cancel controls, and apply theme changes immediately.
- Modify: `apps/widget-client/tests/widget-theme-editor.test.ts`
  Add rendering assertions for the new layout and removal of the old modal UI.
- Modify: `apps/widget-client/src/context/WidgetThemeContext.tsx`
  Only if needed to make immediate saves easy to test or keep the save API stable.

## Task 1: Lock the new popup structure with failing tests

**Files:**
- Modify: `apps/widget-client/tests/widget-theme-editor.test.ts`

- [ ] **Step 1: Write the failing rendering tests**

```ts
test("WidgetThemeEditor open state no longer renders modal header or action buttons", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
    })
  );

  assert.doesNotMatch(markup, /Customize widget colors/);
  assert.doesNotMatch(markup, /aria-label="Close color theme editor"/);
  assert.doesNotMatch(markup, />Cancel</);
  assert.doesNotMatch(markup, />Apply</);
});

test("WidgetThemeEditor detail step places back button and mode controls above the picker", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      initialActiveColorKey: "color1",
    })
  );

  assert.match(markup, /aria-label="Go back to theme colors"/);
  assert.match(markup, />HEX</);
  assert.match(markup, />RGBA</);
});
```

- [ ] **Step 2: Run the targeted test suite to verify it fails**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL because `WidgetThemeEditor` does not accept `initialOpen` / `initialActiveColorKey` and still renders the old modal header and footer actions.

- [ ] **Step 3: Add minimal test-only hooks and implement the new popup structure**

```tsx
// apps/widget-client/src/components/WidgetThemeEditor.tsx
export const WidgetThemeEditor = ({
  mode,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  suspendHoverReveal = false,
  paletteButtonClassName,
  initialOpen = false,
  initialActiveColorKey = null,
}: {
  mode: ThemeEditorMode;
  purchaseUrl?: string;
  suspendHoverReveal?: boolean;
  paletteButtonClassName?: string;
  initialOpen?: boolean;
  initialActiveColorKey?: ThemeColorKey | null;
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeColorKey, setActiveColorKey] =
    useState<ThemeColorKey | null>(initialActiveColorKey);

  // Replace the centered overlay markup with a widget-local absolute overlay.
  // Remove the title row, close button, and footer action buttons.
  // Render the back button + HEX/RGBA + input row above the picker in detail mode.
};
```

- [ ] **Step 4: Run the targeted test suite to verify it passes**

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS with the new popup-structure assertions included.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/components/WidgetThemeEditor.tsx apps/widget-client/tests/widget-theme-editor.test.ts
git commit -m "feat: redesign widget theme editor popover layout"
```

## Task 2: Remove draft/apply semantics and save colors immediately

**Files:**
- Modify: `apps/widget-client/src/components/WidgetThemeEditor.tsx`

- [ ] **Step 1: Write the failing behavior assertions around immediate-save UI**

```ts
test("WidgetThemeEditor no longer renders save controls in premium mode", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      initialActiveColorKey: "color1",
    })
  );

  assert.doesNotMatch(markup, />Cancel</);
  assert.doesNotMatch(markup, />Save</);
});
```

- [ ] **Step 2: Run the targeted test suite to verify it fails for the right reason**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL if any old action button markup remains.

- [ ] **Step 3: Implement immediate-save updates**

```tsx
// apps/widget-client/src/components/WidgetThemeEditor.tsx
const updateThemeColor = (nextColor: string) => {
  const nextTheme = {
    ...theme,
    [resolvedActiveColorKey]: nextColor,
  };

  saveTheme(nextTheme);
};

const closeEditor = () => {
  setActiveColorKey(null);
  setInputMode("hex");
  setIsOpen(false);
};
```

Implementation rules:

- remove `draftTheme`
- remove any save/apply button logic
- keep `inputDraft` only for typing convenience
- picker changes call `saveTheme` immediately
- valid text input changes call `saveTheme` immediately

- [ ] **Step 4: Run the targeted test suite to verify it passes**

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS with no action-button markup left.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/components/WidgetThemeEditor.tsx apps/widget-client/tests/widget-theme-editor.test.ts
git commit -m "feat: apply widget theme changes immediately"
```

## Task 3: Add anchored popup, outside-click capture, and animated step resizing

**Files:**
- Modify: `apps/widget-client/src/components/WidgetThemeEditor.tsx`

- [ ] **Step 1: Write the failing structural assertions for the in-widget popover**

```ts
test("WidgetThemeEditor open state renders a widget-scoped overlay and anchored popover shell", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
    })
  );

  assert.match(markup, /data-theme-editor-overlay="true"/);
  assert.match(markup, /data-theme-editor-panel="true"/);
  assert.match(markup, /bottom-1/);
  assert.match(markup, /right-1/);
});
```

- [ ] **Step 2: Run the targeted test suite to verify it fails**

Run: `pnpm --filter @repo/widget-client run test`
Expected: FAIL because the current layout still uses the old centered panel and does not mark the new overlay/panel shell.

- [ ] **Step 3: Implement the anchored overlay and animated panel shell**

```tsx
// apps/widget-client/src/components/WidgetThemeEditor.tsx
{isOpen && (
  <div
    data-theme-editor-overlay="true"
    className="absolute inset-0 z-30 rounded-[inherit]"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      closeEditor();
    }}
  >
    <div
      data-theme-editor-panel="true"
      className={cn(
        "absolute bottom-1 right-1 overflow-hidden rounded-[12px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.24)] transition-[width,height,opacity,transform] duration-200 ease-out",
        activeColorKey == null
          ? "h-[110px] w-[176px] opacity-100"
          : "h-[238px] w-[228px] opacity-100"
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      ...
    </div>
  </div>
)}
```

Implementation rules:

- panel stays fully within widget bounds
- panel anchor remains bottom-right
- step 1 and step 2 sizes differ
- transition uses width/height/opacity/transform
- no portal

- [ ] **Step 4: Run the targeted test suite to verify it passes**

Run: `pnpm --filter @repo/widget-client run test`
Expected: PASS with the anchored overlay structure.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/components/WidgetThemeEditor.tsx apps/widget-client/tests/widget-theme-editor.test.ts
git commit -m "feat: anchor widget theme editor in bottom-right popover"
```

## Task 4: Final verification for regressions and locked/hidden behavior

**Files:**
- Modify: `apps/widget-client/tests/widget-theme-editor.test.ts`

- [ ] **Step 1: Add any remaining regression assertions**

```ts
test("WidgetThemeEditor still renders the locked purchase affordance", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "locked",
      purchaseUrl: "https://example.com/purchase",
    })
  );

  assert.match(markup, /href="https:\/\/example\.com\/purchase"/);
});
```

- [ ] **Step 2: Run full client verification**

Run:

```bash
pnpm --filter @repo/widget-client run test
pnpm lint
pnpm build
```

Expected:

- all client tests PASS
- lint PASS
- build PASS

- [ ] **Step 3: Manual dev verification**

Run:

```bash
pnpm dev
```

Then verify:

- clicking the palette button opens a bottom-right in-widget popup
- step 1 -> step 2 resize is animated
- picker changes update the widget immediately
- clicking outside the popup but inside the widget closes it
- that outside click does not trigger underlying widget actions

- [ ] **Step 4: Commit**

```bash
git add apps/widget-client/src/components/WidgetThemeEditor.tsx apps/widget-client/tests/widget-theme-editor.test.ts
git commit -m "test: verify widget theme editor bottom-right popover"
```

## Self-Review

- Spec coverage:
  - bottom-right anchored popup: Task 3
  - no close/title/cancel/apply controls: Tasks 1 and 2
  - immediate-save editing: Task 2
  - step resize animation: Task 3
  - outside click capture inside widget: Tasks 3 and 4
- Placeholder scan: no `TODO`, `TBD`, or deferred implementation markers remain.
- Type consistency:
  - test-only props are `initialOpen` and `initialActiveColorKey`
  - saved color updates continue to use `saveTheme`
  - active editor step remains driven by `activeColorKey`
